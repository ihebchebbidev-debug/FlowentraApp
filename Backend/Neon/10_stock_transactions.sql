-- =====================================================
-- Stock Transactions Audit Log Table
-- =====================================================

-- Stock Transactions Table (Full Audit Log)
CREATE TABLE IF NOT EXISTS "stock_transactions" (
    "id" SERIAL PRIMARY KEY,
    "article_id" INTEGER NOT NULL,
    "transaction_type" VARCHAR(50) NOT NULL,  -- add, remove, sale_deduction, offer_added, adjustment, transfer_in, transfer_out, return, damaged, lost
    "quantity" DECIMAL(18,2) NOT NULL,
    "previous_stock" DECIMAL(18,2) NOT NULL,
    "new_stock" DECIMAL(18,2) NOT NULL,
    "reason" VARCHAR(255),
    "reference_type" VARCHAR(50),  -- offer, sale, service_order, manual, adjustment
    "reference_id" VARCHAR(50),  -- ID of related entity (offer_id, sale_id, etc.)
    "reference_number" VARCHAR(100),  -- Human readable reference (OFFER-001, SALE-002)
    "notes" TEXT,
    "performed_by" VARCHAR(100) NOT NULL,
    "performed_by_name" VARCHAR(200),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY ("article_id") REFERENCES "Articles"("Id") ON DELETE CASCADE
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS "idx_stock_transactions_article_id" ON "stock_transactions"("article_id");
CREATE INDEX IF NOT EXISTS "idx_stock_transactions_type" ON "stock_transactions"("transaction_type");
CREATE INDEX IF NOT EXISTS "idx_stock_transactions_reference" ON "stock_transactions"("reference_type", "reference_id");
CREATE INDEX IF NOT EXISTS "idx_stock_transactions_created_at" ON "stock_transactions"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_stock_transactions_performed_by" ON "stock_transactions"("performed_by");

-- Comments for documentation
COMMENT ON TABLE "stock_transactions" IS 'Audit log for all stock movements including manual changes, sales deductions, and offer additions';
COMMENT ON COLUMN "stock_transactions"."transaction_type" IS 'Type of transaction: add, remove, sale_deduction, offer_added, adjustment, transfer_in, transfer_out, return, damaged, lost';
COMMENT ON COLUMN "stock_transactions"."reference_type" IS 'Source of transaction: offer, sale, service_order, manual, adjustment';
COMMENT ON COLUMN "stock_transactions"."reference_id" IS 'ID of the related entity (offer ID, sale ID, etc.)';
COMMENT ON COLUMN "stock_transactions"."reference_number" IS 'Human readable reference number (OFFER-001, SALE-002, etc.)';
