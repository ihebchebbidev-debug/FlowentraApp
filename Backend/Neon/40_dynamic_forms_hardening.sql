-- =====================================================
-- Dynamic Forms hardening
--  * unique public slug (race-proof, DB is source of truth)
--  * composite index for tenant-scoped response lookups
--  * submission window / cap columns
-- =====================================================

-- 1. Submission window + cap
ALTER TABLE "DynamicForms" ADD COLUMN IF NOT EXISTS "ClosesAt" TIMESTAMP NULL;
ALTER TABLE "DynamicForms" ADD COLUMN IF NOT EXISTS "MaxResponses" INTEGER NULL;

-- 2. De-duplicate any existing slug collisions before enforcing uniqueness
WITH ranked AS (
    SELECT "Id",
           "PublicSlug",
           ROW_NUMBER() OVER (PARTITION BY "PublicSlug" ORDER BY "Id") AS rn
    FROM "DynamicForms"
    WHERE "PublicSlug" IS NOT NULL AND "IsDeleted" = FALSE
)
UPDATE "DynamicForms" f
SET "PublicSlug" = ranked."PublicSlug" || '-' || ranked.rn
FROM ranked
WHERE f."Id" = ranked."Id" AND ranked.rn > 1;

-- 3. Unique slug across live forms only (soft-deleted forms release their slug)
DROP INDEX IF EXISTS "IX_DynamicForms_PublicSlug";
CREATE UNIQUE INDEX IF NOT EXISTS "UX_DynamicForms_PublicSlug"
    ON "DynamicForms" ("PublicSlug")
    WHERE "PublicSlug" IS NOT NULL AND "IsDeleted" = FALSE;

-- 4. Response lookups are always tenant + form scoped
CREATE INDEX IF NOT EXISTS "IX_DynamicFormResponses_Tenant_Form"
    ON "DynamicFormResponses" ("TenantId", "FormId", "SubmittedAt" DESC);

COMMENT ON COLUMN "DynamicForms"."ClosesAt" IS 'Public submissions are refused after this UTC timestamp';
COMMENT ON COLUMN "DynamicForms"."MaxResponses" IS 'Public submissions are refused once this many responses exist';