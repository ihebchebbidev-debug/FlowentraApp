-- =====================================================
-- Sales Module Tables
-- =====================================================

-- Sales Table
CREATE TABLE IF NOT EXISTS "sales" (
    "id" VARCHAR(50) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "contact_id" INTEGER NOT NULL,
    "offer_id" VARCHAR(50),
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TND',
    "taxes" DECIMAL(15,2) DEFAULT 0,
    "TaxType" VARCHAR(20) DEFAULT 'percentage',
    "discount" DECIMAL(15,2) DEFAULT 0,
    "total_amount" DECIMAL(15,2) GENERATED ALWAYS AS ("amount" + COALESCE("taxes", 0) - COALESCE("discount", 0)) STORED,
    "status" VARCHAR(20) NOT NULL DEFAULT 'new_offer',
    "stage" VARCHAR(20) NOT NULL DEFAULT 'offer',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "billing_address" TEXT,
    "billing_postal_code" VARCHAR(20),
    "billing_country" VARCHAR(100),
    "delivery_address" TEXT,
    "delivery_postal_code" VARCHAR(20),
    "delivery_country" VARCHAR(100),
    "estimated_close_date" TIMESTAMP,
    "actual_close_date" TIMESTAMP,
    "valid_until" TIMESTAMP,
    "assigned_to" VARCHAR(50),
    "assigned_to_name" VARCHAR(255),
    "tags" TEXT[],
    "lost_reason" TEXT,
    "materials_fulfillment" VARCHAR(20),
    "service_orders_status" VARCHAR(20),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL,
    "last_activity" TIMESTAMP,
    FOREIGN KEY ("contact_id") REFERENCES "Contacts"("Id") ON DELETE RESTRICT,
    FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL
);

-- Sale Items Table
CREATE TABLE IF NOT EXISTS "sale_items" (
    "id" VARCHAR(50) PRIMARY KEY,
    "sale_id" VARCHAR(50) NOT NULL,
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
    FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE
);

-- Sale Activities Table
CREATE TABLE IF NOT EXISTS "sale_activities" (
    "id" VARCHAR(50) PRIMARY KEY,
    "sale_id" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "details" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL,
    "created_by_name" VARCHAR(255) NOT NULL,
    FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE
);

-- Indexes for Sales
CREATE INDEX IF NOT EXISTS "idx_sales_contact" ON "sales"("contact_id");
CREATE INDEX IF NOT EXISTS "idx_sales_offer" ON "sales"("offer_id");
CREATE INDEX IF NOT EXISTS "idx_sales_status" ON "sales"("status");
CREATE INDEX IF NOT EXISTS "idx_sales_stage" ON "sales"("stage");
CREATE INDEX IF NOT EXISTS "idx_sales_created_at" ON "sales"("created_at");
CREATE INDEX IF NOT EXISTS "idx_sale_items_sale" ON "sale_items"("sale_id");
CREATE INDEX IF NOT EXISTS "idx_sale_activities_sale" ON "sale_activities"("sale_id");
