-- Adds a denormalized array of preferred skill names on Service Orders.
-- Auto-seeded from line-item article SkillsRequired at creation and propagated
-- to Dispatch.RequiredSkills when a dispatch is created from a job.
ALTER TABLE "ServiceOrders"
    ADD COLUMN IF NOT EXISTS "PreferredSkills" TEXT[] NULL;

-- Ensure the Dispatch.RequiredSkills column exists (Dispatch model already declares
-- it; this guards environments where the column was never physically added).
ALTER TABLE "Dispatches"
    ADD COLUMN IF NOT EXISTS "RequiredSkills" TEXT[] NULL;