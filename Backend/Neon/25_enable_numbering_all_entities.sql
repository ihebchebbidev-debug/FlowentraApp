-- ============================================================
-- Migration 25: Enable Custom Numbering for ALL Entities
-- Activates atomic_counter strategy and syncs sequence counters
-- past any existing document numbers to prevent collisions.
-- ============================================================

-- 1. Enable all 4 entities with atomic_counter + yearly reset for Offer,
--    and appropriate strategies for others.
--    All use {SEQ} so counters are sequential and predictable.
UPDATE "NumberingSettings"
SET "is_enabled" = TRUE,
    "template"   = 'OFR-{YEAR}-{SEQ:6}',
    "strategy"   = 'atomic_counter',
    "reset_frequency" = 'yearly',
    "padding"    = 6,
    "updated_at" = NOW()
WHERE "entity_name" = 'Offer';

UPDATE "NumberingSettings"
SET "is_enabled" = TRUE,
    "template"   = 'SALE-{YEAR}-{SEQ:6}',
    "strategy"   = 'atomic_counter',
    "reset_frequency" = 'yearly',
    "padding"    = 6,
    "updated_at" = NOW()
WHERE "entity_name" = 'Sale';

UPDATE "NumberingSettings"
SET "is_enabled" = TRUE,
    "template"   = 'SO-{YEAR}-{SEQ:6}',
    "strategy"   = 'atomic_counter',
    "reset_frequency" = 'yearly',
    "padding"    = 6,
    "updated_at" = NOW()
WHERE "entity_name" = 'ServiceOrder';

UPDATE "NumberingSettings"
SET "is_enabled" = TRUE,
    "template"   = 'DISP-{YEAR}-{SEQ:6}',
    "strategy"   = 'atomic_counter',
    "reset_frequency" = 'yearly',
    "padding"    = 6,
    "updated_at" = NOW()
WHERE "entity_name" = 'Dispatch';

-- 2. Sync sequence counters past existing data for current year.
--    This ensures next generated number is always higher than any existing one.

-- Offer: count existing offers this year as a safe baseline
INSERT INTO "NumberSequences" ("entity_name", "period_key", "last_value", "created_at", "updated_at")
VALUES ('Offer', EXTRACT(YEAR FROM NOW())::TEXT,
        COALESCE((SELECT COUNT(*) FROM "Offers" WHERE "CreatedDate" >= date_trunc('year', NOW())), 0) + 100,
        NOW(), NOW())
ON CONFLICT ("entity_name", "period_key")
DO UPDATE SET "last_value" = GREATEST(
    "NumberSequences"."last_value",
    COALESCE((SELECT COUNT(*) FROM "Offers" WHERE "CreatedDate" >= date_trunc('year', NOW())), 0) + 100
), "updated_at" = NOW();

-- Sale: count existing sales this year
INSERT INTO "NumberSequences" ("entity_name", "period_key", "last_value", "created_at", "updated_at")
VALUES ('Sale', EXTRACT(YEAR FROM NOW())::TEXT,
        COALESCE((SELECT COUNT(*) FROM "Sales" WHERE "CreatedDate" >= date_trunc('year', NOW())), 0) + 100,
        NOW(), NOW())
ON CONFLICT ("entity_name", "period_key")
DO UPDATE SET "last_value" = GREATEST(
    "NumberSequences"."last_value",
    COALESCE((SELECT COUNT(*) FROM "Sales" WHERE "CreatedDate" >= date_trunc('year', NOW())), 0) + 100
), "updated_at" = NOW();

-- ServiceOrder: count existing service orders this year
INSERT INTO "NumberSequences" ("entity_name", "period_key", "last_value", "created_at", "updated_at")
VALUES ('ServiceOrder', EXTRACT(YEAR FROM NOW())::TEXT,
        COALESCE((SELECT COUNT(*) FROM "ServiceOrders" WHERE "CreatedDate" >= date_trunc('year', NOW())), 0) + 100,
        NOW(), NOW())
ON CONFLICT ("entity_name", "period_key")
DO UPDATE SET "last_value" = GREATEST(
    "NumberSequences"."last_value",
    COALESCE((SELECT COUNT(*) FROM "ServiceOrders" WHERE "CreatedDate" >= date_trunc('year', NOW())), 0) + 100
), "updated_at" = NOW();

-- Dispatch: count existing dispatches this year
INSERT INTO "NumberSequences" ("entity_name", "period_key", "last_value", "created_at", "updated_at")
VALUES ('Dispatch', EXTRACT(YEAR FROM NOW())::TEXT,
        COALESCE((SELECT COUNT(*) FROM "Dispatches" WHERE "CreatedDate" >= date_trunc('year', NOW())), 0) + 100,
        NOW(), NOW())
ON CONFLICT ("entity_name", "period_key")
DO UPDATE SET "last_value" = GREATEST(
    "NumberSequences"."last_value",
    COALESCE((SELECT COUNT(*) FROM "Dispatches" WHERE "CreatedDate" >= date_trunc('year', NOW())), 0) + 100
), "updated_at" = NOW();

-- NOTE: We add +100 buffer to each counter to safely skip any existing records
-- that might have non-sequential numbers (e.g., from GUID-based legacy numbering).
