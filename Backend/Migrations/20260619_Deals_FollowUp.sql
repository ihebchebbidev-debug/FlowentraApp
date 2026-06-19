-- =====================================================================
-- Deals: follow-up / next-action + lost-reason (pipeline health & win-loss).
-- Additive & idempotent. PostgreSQL.
-- =====================================================================

ALTER TABLE "Deals" ADD COLUMN IF NOT EXISTS "NextActionDate" timestamptz  NULL;
ALTER TABLE "Deals" ADD COLUMN IF NOT EXISTS "NextAction"     varchar(255) NULL;
ALTER TABLE "Deals" ADD COLUMN IF NOT EXISTS "LostReason"     varchar(255) NULL;

-- Helps "overdue follow-up" queries on the open pipeline.
CREATE INDEX IF NOT EXISTS "IX_Deals_NextActionDate" ON "Deals" ("NextActionDate");
