-- Migration: soft-cap overrun tracking on MaterialUsage (mirrors TimeEntries / Expenses).
-- Run on every tenant database before (or with) deploying the backend.

ALTER TABLE "MaterialUsage"
    ADD COLUMN IF NOT EXISTS "OverrunFlag"   boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "OverrunReason" varchar(500) NULL;
