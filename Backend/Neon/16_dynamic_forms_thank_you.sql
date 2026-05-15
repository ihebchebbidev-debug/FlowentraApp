-- =====================================================
-- Dynamic Forms - Thank You Page Settings Migration
-- Execute this SQL on your PostgreSQL database
-- =====================================================

-- Add ThankYouSettings column to DynamicForms table
-- This stores customizable thank you page configuration as JSON
ALTER TABLE "DynamicForms" 
ADD COLUMN IF NOT EXISTS "ThankYouSettings" JSONB DEFAULT NULL;

-- Add index for performance (optional, for querying by thank you settings)
CREATE INDEX IF NOT EXISTS "idx_dynamicforms_thankyousettings" 
ON "DynamicForms" USING GIN ("ThankYouSettings");

-- Add column comment
COMMENT ON COLUMN "DynamicForms"."ThankYouSettings" IS 'JSONB object containing thank you page configuration including default messages and conditional rules';

-- =====================================================
-- THANK YOU SETTINGS SCHEMA:
-- =====================================================
-- {
--   "default_message": {
--     "title_en": "Thank You!",
--     "title_fr": "Merci !",
--     "message_en": "Your response has been recorded.",
--     "message_fr": "Votre réponse a été enregistrée.",
--     "enable_redirect": false,
--     "redirect_url": "https://example.com/thank-you",
--     "redirect_delay": 3
--   },
--   "rules": [
--     {
--       "id": "rule_123456789",
--       "name": "High Rating Thank You",
--       "condition": {
--         "field_id": "field_987654321",
--         "operator": "greater_than",
--         "value": 4
--       },
--       "title_en": "Excellent!",
--       "title_fr": "Excellent !",
--       "message_en": "Thank you for your positive feedback!",
--       "message_fr": "Merci pour vos commentaires positifs !",
--       "redirect_url": "https://example.com/referral",
--       "redirect_delay": 5,
--       "priority": 1
--     },
--     {
--       "id": "rule_123456790",
--       "name": "Low Rating Follow-up",
--       "condition": {
--         "field_id": "field_987654321",
--         "operator": "less_than",
--         "value": 3
--       },
--       "title_en": "We're Sorry",
--       "title_fr": "Nous sommes désolés",
--       "message_en": "We appreciate your feedback and will work to improve.",
--       "message_fr": "Nous apprécions vos commentaires et travaillerons à nous améliorer.",
--       "redirect_url": "https://example.com/support",
--       "redirect_delay": 3,
--       "priority": 2
--     }
--   ]
-- }

-- =====================================================
-- CONDITION OPERATORS (same as field conditions):
-- =====================================================
-- equals, not_equals, contains, not_contains, 
-- greater_than, less_than, is_empty, is_not_empty

-- =====================================================
-- RULE PRIORITY:
-- =====================================================
-- Rules are evaluated in order of priority (lower number = higher priority)
-- First matching rule wins
-- If no rules match, default_message is used
