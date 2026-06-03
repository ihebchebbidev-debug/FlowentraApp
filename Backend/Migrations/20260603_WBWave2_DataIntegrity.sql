-- ════════════════════════════════════════════════════════════════════
-- Website Builder — Wave 2: Data Integrity Migration (PostgreSQL)
-- Run once against the project database. Safe to re-run (idempotent).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Atomic publishing snapshot on WB_Pages ──────────────────────
ALTER TABLE "WB_Pages"
    ADD COLUMN IF NOT EXISTS "PublishedComponentsJson"   jsonb,
    ADD COLUMN IF NOT EXISTS "PublishedSeoJson"          jsonb,
    ADD COLUMN IF NOT EXISTS "PublishedTranslationsJson" jsonb,
    ADD COLUMN IF NOT EXISTS "PublishedAt"               timestamp without time zone;

-- ── 2. Soft-delete on WB_FormSubmissions (GDPR audit trail) ────────
ALTER TABLE "WB_FormSubmissions"
    ADD COLUMN IF NOT EXISTS "IsDeleted" boolean NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "DeletedAt" timestamp without time zone,
    ADD COLUMN IF NOT EXISTS "DeletedBy" varchar(100);

CREATE INDEX IF NOT EXISTS "IX_WB_FormSubmissions_Site_Active_SubmittedAt"
    ON "WB_FormSubmissions" ("SiteId", "IsDeleted", "SubmittedAt" DESC);

-- ── 3. Per-tenant unique site slug (excluding soft-deleted) ────────
-- Drops any older unique-on-Slug-only index if present.
DROP INDEX IF EXISTS "IX_WB_Sites_Slug";

CREATE UNIQUE INDEX IF NOT EXISTS "UX_WB_Sites_TenantId_Slug_Active"
    ON "WB_Sites" ("TenantId", "Slug")
    WHERE "IsDeleted" = FALSE;

-- ── 4. Per-site unique page slug (excluding soft-deleted) ──────────
CREATE UNIQUE INDEX IF NOT EXISTS "UX_WB_Pages_Site_Slug_Active"
    ON "WB_Pages" ("SiteId", "Slug")
    WHERE "IsDeleted" = FALSE;

-- ── 5. Helpful index for the public renderer's slug→site lookup ────
CREATE INDEX IF NOT EXISTS "IX_WB_Sites_Slug_Published"
    ON "WB_Sites" ("Slug")
    WHERE "IsDeleted" = FALSE AND "Published" = TRUE;

COMMIT;

-- ════════════════════════════════════════════════════════════════════
-- Notes
--   • UpdatedAt-based optimistic concurrency does NOT need any schema
--     change — it is enforced in service code (WBPageService).
--   • The WB_FormSubmissions backfill defaults IsDeleted = FALSE on
--     every existing row, so no historical data is hidden.
--   • If your tenant already has duplicate (TenantId, Slug) sites or
--     (SiteId, Slug) pages among non-deleted rows, the unique-index
--     creation will fail. Resolve duplicates first with:
--       SELECT "TenantId","Slug",COUNT(*)
--       FROM "WB_Sites" WHERE "IsDeleted" = FALSE
--       GROUP BY 1,2 HAVING COUNT(*) > 1;
--       SELECT "SiteId","Slug",COUNT(*)
--       FROM "WB_Pages" WHERE "IsDeleted" = FALSE
--       GROUP BY 1,2 HAVING COUNT(*) > 1;
-- ════════════════════════════════════════════════════════════════════
