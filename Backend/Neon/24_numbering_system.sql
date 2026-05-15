-- ============================================================
-- Migration 24: Configurable Document Numbering System
-- Tables: NumberingSettings, NumberSequences
-- Unique constraints on document number columns
-- ============================================================

-- 1. NumberingSettings — stores per-entity template configuration
CREATE TABLE IF NOT EXISTS "NumberingSettings" (
    "Id"               SERIAL PRIMARY KEY,
    "entity_name"      VARCHAR(50)  NOT NULL,
    "is_enabled"       BOOLEAN      NOT NULL DEFAULT FALSE,
    "template"         VARCHAR(200) NOT NULL,
    "strategy"         VARCHAR(30)  NOT NULL DEFAULT 'atomic_counter',
    "reset_frequency"  VARCHAR(20)  NOT NULL DEFAULT 'yearly',
    "start_value"      INTEGER      NOT NULL DEFAULT 1,
    "padding"          INTEGER      NOT NULL DEFAULT 6,
    "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_numbering_settings_entity UNIQUE ("entity_name")
);

-- 2. NumberSequences — atomic counter per (entity, period)
CREATE TABLE IF NOT EXISTS "NumberSequences" (
    "Id"               SERIAL PRIMARY KEY,
    "entity_name"      VARCHAR(50)  NOT NULL,
    "period_key"       VARCHAR(20)  NOT NULL DEFAULT 'all',
    "last_value"       BIGINT       NOT NULL DEFAULT 0,
    "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_number_sequences_entity_period UNIQUE ("entity_name", "period_key")
);

-- 3. Seed default templates matching current hardcoded logic
-- These defaults ensure the system works immediately on first run without admin config
-- is_enabled = FALSE means legacy hardcoded logic is used until admin explicitly enables custom templates
INSERT INTO "NumberingSettings" ("entity_name", "is_enabled", "template", "strategy", "reset_frequency", "start_value", "padding")
VALUES
    ('Offer',        FALSE, 'OFR-{YEAR}-{SEQ:6}',             'atomic_counter',   'yearly',  1, 6),
    ('Sale',         FALSE, 'SALE-{DATE:yyyyMMdd}-{GUID:5}',  'guid',             'never',   1, 5),
    ('ServiceOrder', FALSE, 'SO-{DATE:yyyyMMdd}-{GUID:6}',    'guid',             'never',   1, 6),
    ('Dispatch',     FALSE, 'DISP-{TS:yyyyMMddHHmmss}',       'timestamp_random', 'never',   1, 6)
ON CONFLICT ("entity_name") DO NOTHING;

-- 3b. Initialize sequence counters at 0 for each entity (yearly reset default)
INSERT INTO "NumberSequences" ("entity_name", "period_key", "last_value")
VALUES
    ('Offer',        EXTRACT(YEAR FROM NOW())::TEXT, 0),
    ('Sale',         'all',                          0),
    ('ServiceOrder', 'all',                          0),
    ('Dispatch',     'all',                          0)
ON CONFLICT ("entity_name", "period_key") DO NOTHING;

-- 4. Unique constraints on document number columns (idempotent)
-- Offers
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_offers_offer_number') THEN
        ALTER TABLE "Offers" ADD CONSTRAINT uq_offers_offer_number UNIQUE ("OfferNumber");
    END IF;
END $$;

-- Sales
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_sales_sale_number') THEN
        ALTER TABLE "Sales" ADD CONSTRAINT uq_sales_sale_number UNIQUE ("SaleNumber");
    END IF;
END $$;

-- ServiceOrders
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_service_orders_order_number') THEN
        ALTER TABLE "ServiceOrders" ADD CONSTRAINT uq_service_orders_order_number UNIQUE ("OrderNumber");
    END IF;
END $$;

-- Dispatches
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_dispatches_dispatch_number') THEN
        ALTER TABLE "Dispatches" ADD CONSTRAINT uq_dispatches_dispatch_number UNIQUE ("DispatchNumber");
    END IF;
END $$;

-- 5. Performance indexes
CREATE INDEX IF NOT EXISTS idx_numbering_settings_entity ON "NumberingSettings" ("entity_name");
CREATE INDEX IF NOT EXISTS idx_number_sequences_entity_period ON "NumberSequences" ("entity_name", "period_key");
