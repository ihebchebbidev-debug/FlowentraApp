-- =====================================================
-- Dynamic Forms Module Tables (Updated with Signature & Rating)
-- Execute this SQL on your PostgreSQL database
-- =====================================================

-- DynamicForms Table
CREATE TABLE IF NOT EXISTS "DynamicForms" (
    "Id" SERIAL PRIMARY KEY,
    "NameEn" VARCHAR(200) NOT NULL,
    "NameFr" VARCHAR(200) NOT NULL,
    "DescriptionEn" VARCHAR(1000),
    "DescriptionFr" VARCHAR(1000),
    "Status" VARCHAR(20) NOT NULL DEFAULT 'Draft',
    "Version" INTEGER NOT NULL DEFAULT 1,
    "Category" VARCHAR(100),
    "Fields" JSONB NOT NULL DEFAULT '[]',
    "CreatedUser" VARCHAR(100),
    "ModifyUser" VARCHAR(100),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP,
    "DeletedAt" TIMESTAMP,
    "DeletedBy" VARCHAR(100),
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- DynamicFormResponses Table
CREATE TABLE IF NOT EXISTS "DynamicFormResponses" (
    "Id" SERIAL PRIMARY KEY,
    "FormId" INTEGER NOT NULL REFERENCES "DynamicForms"("Id") ON DELETE CASCADE,
    "FormVersion" INTEGER NOT NULL,
    "EntityType" VARCHAR(50),
    "EntityId" VARCHAR(100),
    "Responses" JSONB NOT NULL DEFAULT '{}',
    "Notes" VARCHAR(2000),
    "SubmittedBy" VARCHAR(100) NOT NULL,
    "SubmittedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_dynamicforms_status" ON "DynamicForms"("Status");
CREATE INDEX IF NOT EXISTS "idx_dynamicforms_category" ON "DynamicForms"("Category");
CREATE INDEX IF NOT EXISTS "idx_dynamicforms_name_en" ON "DynamicForms"("NameEn");
CREATE INDEX IF NOT EXISTS "idx_dynamicforms_name_fr" ON "DynamicForms"("NameFr");
CREATE INDEX IF NOT EXISTS "idx_dynamicforms_created" ON "DynamicForms"("CreatedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_dynamicforms_updated" ON "DynamicForms"("UpdatedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_dynamicforms_isdeleted" ON "DynamicForms"("IsDeleted");

CREATE INDEX IF NOT EXISTS "idx_dynamicformresponses_formid" ON "DynamicFormResponses"("FormId");
CREATE INDEX IF NOT EXISTS "idx_dynamicformresponses_entity" ON "DynamicFormResponses"("EntityType", "EntityId");
CREATE INDEX IF NOT EXISTS "idx_dynamicformresponses_submitted" ON "DynamicFormResponses"("SubmittedAt" DESC);

-- Comments for documentation
COMMENT ON TABLE "DynamicForms" IS 'Stores dynamic form/checklist definitions with fields as JSON';
COMMENT ON TABLE "DynamicFormResponses" IS 'Stores user submissions/responses to dynamic forms';
COMMENT ON COLUMN "DynamicForms"."Fields" IS 'JSONB array of field definitions including signature and rating types';
COMMENT ON COLUMN "DynamicForms"."Status" IS 'Form lifecycle: Draft, Released, Archived';
COMMENT ON COLUMN "DynamicFormResponses"."Responses" IS 'JSONB object mapping field IDs to values (signature stored as base64 data URL)';

-- =====================================================
-- FIELD TYPES SUPPORTED:
-- =====================================================
-- text       - Single line text input
-- textarea   - Multi-line text input
-- number     - Numeric input with min/max validation
-- email      - Email address input
-- phone      - Phone number input
-- checkbox   - Yes/No or multiple choice checkboxes
-- radio      - Single selection radio buttons
-- select     - Dropdown select list
-- date       - Date picker
-- section    - Section header for grouping
-- signature  - Digital signature canvas (stored as base64 PNG data URL)
-- rating     - Star rating (1-10 stars, stored as integer)
-- page_break - Page break for multi-page forms (label used as page title)
-- content    - Rich content block for titles, descriptions, and links
-- =====================================================

-- CONDITION OPERATORS:
-- equals, not_equals, contains, not_contains, greater_than, less_than, is_empty, is_not_empty

-- FIELD SCHEMA EXAMPLE WITH HINTS AND LINKS:
-- {
--   "id": "field_123456789",
--   "type": "text",
--   "label_en": "Your Name",
--   "label_fr": "Votre Nom",
--   "description_en": "Please enter your full legal name",
--   "description_fr": "Veuillez entrer votre nom complet",
--   "hint_en": "This will appear on your certificate",
--   "hint_fr": "Ceci apparaîtra sur votre certificat",
--   "link_url": "https://example.com/privacy",
--   "link_text_en": "View our privacy policy",
--   "link_text_fr": "Voir notre politique de confidentialité",
--   "link_style": "link",
--   "link_new_tab": true,
--   "required": true,
--   "order": 1,
--   "width": "full"
-- }
--
-- CONTENT BLOCK EXAMPLE:
-- {
--   "id": "field_content_1",
--   "type": "content",
--   "label_en": "Important Notice",
--   "label_fr": "Avis Important",
--   "description_en": "Please read the following carefully before proceeding.",
--   "description_fr": "Veuillez lire attentivement ce qui suit avant de continuer.",
--   "hint_en": "This section is for informational purposes only",
--   "hint_fr": "Cette section est à titre informatif uniquement",
--   "link_url": "https://example.com/terms",
--   "link_text_en": "Read Full Terms",
--   "link_text_fr": "Lire les Conditions Complètes",
--   "link_style": "button",
--   "link_new_tab": true,
--   "required": false,
--   "order": 0
-- }
--
-- FIELD WITH CONDITIONAL LOGIC:
-- {
--   "id": "field_123456789",
--   "type": "text",
--   "label_en": "Other Details",
--   "label_fr": "Autres Détails",
--   "required": false,
--   "order": 2,
--   "condition": {
--     "field_id": "field_987654321",
--     "operator": "equals",
--     "value": "other"
--   },
--   "condition_action": "show"
-- }

-- RESPONSE SCHEMA EXAMPLE:
-- {
--   "field_123456789": "data:image/png;base64,iVBORw0KGgo...",
--   "field_987654321": 4
-- }
