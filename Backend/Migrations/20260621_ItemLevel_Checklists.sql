-- =====================================================================
-- Allow item-level checklists on EntityFormDocuments.
-- A checklist attached to a service line follows the lineage
-- offer_item -> sale_item -> service_order_job (the job in the dispatch).
-- Extends the EntityType CHECK constraint to include those item-level types.
-- Idempotent & safe to run multiple times. PostgreSQL. Run per tenant DB.
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
    CHECK ("EntityType" IN (
        'offer', 'sale', 'serviceorder', 'dispatch', 'deal', 'project',
        'offer_item', 'sale_item', 'service_order_job'
    ));
