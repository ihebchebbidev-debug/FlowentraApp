-- Migration: enforce "at most one preferred supplier per article per tenant" at
-- the DB layer. Application code in ArticleSupplierService demotes prior
-- preferred rows before marking a new one, but even under IsolationLevel.
-- Serializable a wildly interleaved retry / connection-pool race could
-- theoretically slip two IsPreferred=true rows in for the same (Tenant,
-- Article). This partial unique index turns any such race into a clean
-- 23505 unique-violation instead of a silently ambiguous "two preferred"
-- state that downstream PO auto-fill would resolve non-deterministically.
--
-- Only live, preferred rows are constrained (the partial WHERE clause) so
-- tombstoned rows and non-preferred history don't collide.
--
-- Safe to re-run: index is created IF NOT EXISTS. Pre-check for orphan
-- duplicates so the CREATE doesn't fail on legacy data — repair-first,
-- then constrain.

DO $$
DECLARE
    dup_count INTEGER;
BEGIN
    -- Detect any pre-existing duplicates so we surface them explicitly
    -- instead of failing the migration with a cryptic unique-violation.
    SELECT COUNT(*) INTO dup_count
    FROM (
        SELECT "TenantId", "ArticleId"
        FROM "ArticleSuppliers"
        WHERE "IsPreferred" = TRUE AND "IsDeleted" = FALSE
        GROUP BY "TenantId", "ArticleId"
        HAVING COUNT(*) > 1
    ) d;

    IF dup_count > 0 THEN
        -- Repair strategy: keep the most recently modified row as preferred,
        -- demote the rest. Matches the app-level "last write wins" intent.
        WITH ranked AS (
            SELECT "Id",
                   ROW_NUMBER() OVER (
                       PARTITION BY "TenantId", "ArticleId"
                       ORDER BY COALESCE("ModifiedDate", "CreatedDate") DESC, "Id" DESC
                   ) AS rn
              FROM "ArticleSuppliers"
             WHERE "IsPreferred" = TRUE AND "IsDeleted" = FALSE
        )
        UPDATE "ArticleSuppliers" a
           SET "IsPreferred" = FALSE,
               "ModifiedDate" = NOW()
          FROM ranked r
         WHERE a."Id" = r."Id" AND r.rn > 1;

        RAISE NOTICE 'Demoted duplicate preferred suppliers on % (Tenant, Article) groups.', dup_count;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "ux_article_suppliers_one_preferred_per_article"
    ON "ArticleSuppliers" ("TenantId", "ArticleId")
    WHERE "IsPreferred" = TRUE AND "IsDeleted" = FALSE;
