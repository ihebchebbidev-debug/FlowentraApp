-- =====================================================================
-- Allow Deals to carry Documents & Checklists (EntityFormDocuments).
-- The EntityFormDocuments.EntityType column has a CHECK constraint that
-- whitelists the entity types; add 'deal' so deal checklists/forms insert.
-- Idempotent & safe to run multiple times. PostgreSQL.
-- =====================================================================

DO $$
DECLARE c text;
BEGIN
    -- Drop whatever the current EntityType CHECK constraint is named.
    SELECT conname INTO c
      FROM pg_constraint
     WHERE conrelid = '"EntityFormDocuments"'::regclass
       AND contype  = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%EntityType%';
    IF c IS NOT NULL THEN
        EXECUTE format('ALTER TABLE "EntityFormDocuments" DROP CONSTRAINT %I', c);
    END IF;
END $$;

ALTER TABLE "EntityFormDocuments"
    ADD CONSTRAINT "CK_EntityFormDocuments_EntityType"
    CHECK ("EntityType" IN ('offer', 'sale', 'serviceorder', 'dispatch', 'deal'));
