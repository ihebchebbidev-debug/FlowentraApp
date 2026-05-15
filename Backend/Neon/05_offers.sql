-- =====================================================
-- Offers Module Tables
-- =====================================================

-- Offers Table
CREATE TABLE IF NOT EXISTS "offers" (
    "id" VARCHAR(50) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "contact_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TND',
    "taxes" DECIMAL(15,2) DEFAULT 0,
    "TaxType" VARCHAR(20) DEFAULT 'percentage',
    "discount" DECIMAL(15,2) DEFAULT 0,
    "total_amount" DECIMAL(15,2) GENERATED ALWAYS AS ("amount" + COALESCE("taxes", 0) - COALESCE("discount", 0)) STORED,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "category" VARCHAR(50),
    "source" VARCHAR(50),
    "billing_address" TEXT,
    "billing_postal_code" VARCHAR(20),
    "billing_country" VARCHAR(100),
    "delivery_address" TEXT,
    "delivery_postal_code" VARCHAR(20),
    "delivery_country" VARCHAR(100),
    "valid_until" TIMESTAMP,
    "assigned_to" VARCHAR(50),
    "assigned_to_name" VARCHAR(255),
    "tags" TEXT[],
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL,
    "last_activity" TIMESTAMP,
    "converted_to_sale_id" VARCHAR(50),
    "converted_to_service_order_id" VARCHAR(50),
    "converted_at" TIMESTAMP,
    FOREIGN KEY ("contact_id") REFERENCES "Contacts"("Id") ON DELETE RESTRICT
);

-- Offer Items Table
CREATE TABLE IF NOT EXISTS "offer_items" (
    "id" VARCHAR(50) PRIMARY KEY,
    "offer_id" VARCHAR(50) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "article_id" VARCHAR(50) NOT NULL,
    "item_name" VARCHAR(255) NOT NULL,
    "item_code" VARCHAR(100),
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(15,2) GENERATED ALWAYS AS ("quantity" * "unit_price" * (1 - COALESCE("discount", 0) / 100)) STORED,
    "discount" DECIMAL(15,2) DEFAULT 0,
    "discount_type" VARCHAR(20) DEFAULT 'percentage',
    "installation_id" VARCHAR(50),
    "installation_name" VARCHAR(255),
    FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE
);

-- Offer Activities Table
CREATE TABLE IF NOT EXISTS "offer_activities" (
    "id" VARCHAR(50) PRIMARY KEY,
    "offer_id" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "details" TEXT,
    "old_value" VARCHAR(255),
    "new_value" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL,
    "created_by_name" VARCHAR(255) NOT NULL,
    FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE
);

-- Indexes for Offers
CREATE INDEX IF NOT EXISTS "idx_offers_contact" ON "offers"("contact_id");
CREATE INDEX IF NOT EXISTS "idx_offers_status" ON "offers"("status");
CREATE INDEX IF NOT EXISTS "idx_offers_created_at" ON "offers"("created_at");
CREATE INDEX IF NOT EXISTS "idx_offer_items_offer" ON "offer_items"("offer_id");
CREATE INDEX IF NOT EXISTS "idx_offer_activities_offer" ON "offer_activities"("offer_id");
