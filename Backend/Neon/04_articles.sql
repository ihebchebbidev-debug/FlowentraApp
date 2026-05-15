-- =====================================================
-- Articles Module Tables (Materials & Services)
-- =====================================================

-- Article Categories Table
CREATE TABLE IF NOT EXISTS "article_categories" (
    "id" VARCHAR(50) PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "description" VARCHAR(500),
    "parent_id" VARCHAR(50),
    "order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("parent_id") REFERENCES "article_categories"("id") ON DELETE SET NULL
);

-- Locations Table
CREATE TABLE IF NOT EXISTS "locations" (
    "id" VARCHAR(50) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "address" VARCHAR(500),
    "assigned_technician" VARCHAR(50),
    "capacity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Articles Table (Materials & Services)
CREATE TABLE IF NOT EXISTS "articles" (
    "id" VARCHAR(50) PRIMARY KEY,
    "type" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sku" VARCHAR(100),
    "description" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "stock" INTEGER,
    "min_stock" INTEGER,
    "cost_price" DECIMAL(10,2),
    "sell_price" DECIMAL(10,2),
    "supplier" VARCHAR(255),
    "location" VARCHAR(255),
    "sub_location" VARCHAR(255),
    "base_price" DECIMAL(10,2),
    "duration" INTEGER,
    "tva_rate" DECIMAL(5,2) NOT NULL DEFAULT 19.00,
    "skills_required" TEXT,
    "materials_needed" TEXT,
    "preferred_users" TEXT,
    "last_used" TIMESTAMP,
    "last_used_by" VARCHAR(50),
    "tags" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL,
    "modified_by" VARCHAR(50) NOT NULL
);

-- Inventory Transactions Table
CREATE TABLE IF NOT EXISTS "inventory_transactions" (
    "id" VARCHAR(50) PRIMARY KEY,
    "article_id" VARCHAR(50) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "from_location" VARCHAR(255),
    "to_location" VARCHAR(255),
    "reason" VARCHAR(500) NOT NULL,
    "reference" VARCHAR(100),
    "performed_by" VARCHAR(50) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
);

-- Indexes for Articles
CREATE INDEX IF NOT EXISTS "idx_articles_type" ON "articles"("type");
CREATE INDEX IF NOT EXISTS "idx_articles_category" ON "articles"("category");
CREATE INDEX IF NOT EXISTS "idx_articles_status" ON "articles"("status");
CREATE INDEX IF NOT EXISTS "idx_articles_name" ON "articles"("name");
CREATE INDEX IF NOT EXISTS "idx_inventory_transactions_article" ON "inventory_transactions"("article_id");
CREATE INDEX IF NOT EXISTS "idx_inventory_transactions_type" ON "inventory_transactions"("type");
