-- =====================================================================
-- Projects: planned Budget column (seeded from a converted deal's value).
-- Additive & idempotent. PostgreSQL.
-- =====================================================================

ALTER TABLE "Projects" ADD COLUMN IF NOT EXISTS "Budget" numeric(18,2) NULL;
