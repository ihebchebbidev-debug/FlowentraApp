-- =====================================================
-- Migration: Add Public Sharing and Thank You Settings
-- Execute this SQL on your PostgreSQL database
-- =====================================================

-- Add public sharing columns to DynamicForms table
ALTER TABLE "DynamicForms" 
ADD COLUMN IF NOT EXISTS "IsPublic" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "DynamicForms" 
ADD COLUMN IF NOT EXISTS "PublicSlug" VARCHAR(200);

ALTER TABLE "DynamicForms" 
ADD COLUMN IF NOT EXISTS "ThankYouSettings" JSONB;

-- Add public submission columns to DynamicFormResponses table
ALTER TABLE "DynamicFormResponses" 
ADD COLUMN IF NOT EXISTS "SubmitterName" VARCHAR(200);

ALTER TABLE "DynamicFormResponses" 
ADD COLUMN IF NOT EXISTS "SubmitterEmail" VARCHAR(200);

ALTER TABLE "DynamicFormResponses" 
ADD COLUMN IF NOT EXISTS "IsPublicSubmission" BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for public slug lookups
CREATE INDEX IF NOT EXISTS "idx_dynamicforms_publicslug" 
ON "DynamicForms"("PublicSlug") WHERE "PublicSlug" IS NOT NULL;

-- Add index for public forms
CREATE INDEX IF NOT EXISTS "idx_dynamicforms_ispublic" 
ON "DynamicForms"("IsPublic") WHERE "IsPublic" = TRUE;

-- Comments for documentation
COMMENT ON COLUMN "DynamicForms"."IsPublic" IS 'Whether the form is publicly accessible without authentication';
COMMENT ON COLUMN "DynamicForms"."PublicSlug" IS 'URL-friendly slug for public access (e.g., customer-satisfaction-survey)';
COMMENT ON COLUMN "DynamicForms"."ThankYouSettings" IS 'JSONB object containing thank you page settings (messages, rules, redirects)';
COMMENT ON COLUMN "DynamicFormResponses"."SubmitterName" IS 'Name of the submitter for public submissions';
COMMENT ON COLUMN "DynamicFormResponses"."SubmitterEmail" IS 'Email of the submitter for public submissions';
COMMENT ON COLUMN "DynamicFormResponses"."IsPublicSubmission" IS 'Whether this was a public (unauthenticated) submission';
