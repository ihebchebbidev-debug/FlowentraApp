-- =====================================================
-- Payments Module Tables
-- Supports partial/installment payments for Offers & Sales
-- =====================================================

-- Payment Plans (predefined installment schedules)
CREATE TABLE IF NOT EXISTS "payment_plans" (
    "id" VARCHAR(50) PRIMARY KEY,
    "entity_type" VARCHAR(20) NOT NULL, -- 'offer' or 'sale'
    "entity_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TND',
    "installment_count" INTEGER NOT NULL DEFAULT 2,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active', -- active, completed, cancelled
    "created_by" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payment Plan Installments (scheduled due dates + amounts)
CREATE TABLE IF NOT EXISTS "payment_plan_installments" (
    "id" VARCHAR(50) PRIMARY KEY,
    "plan_id" VARCHAR(50) NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "due_date" TIMESTAMP NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, partially_paid, overdue
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_at" TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("plan_id") REFERENCES "payment_plans"("id") ON DELETE CASCADE
);

-- Payments (actual payment records — ad-hoc or linked to installments)
CREATE TABLE IF NOT EXISTS "payments" (
    "id" VARCHAR(50) PRIMARY KEY,
    "entity_type" VARCHAR(20) NOT NULL, -- 'offer' or 'sale'
    "entity_id" VARCHAR(50) NOT NULL,
    "plan_id" VARCHAR(50),
    "installment_id" VARCHAR(50),
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TND',
    "payment_method" VARCHAR(50) NOT NULL DEFAULT 'cash', -- cash, bank_transfer, check, card, other
    "payment_reference" VARCHAR(255),
    "payment_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'completed', -- pending, completed, cancelled, refunded
    "notes" TEXT,
    "receipt_number" VARCHAR(100),
    "created_by" VARCHAR(50) NOT NULL,
    "created_by_name" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("plan_id") REFERENCES "payment_plans"("id") ON DELETE SET NULL,
    FOREIGN KEY ("installment_id") REFERENCES "payment_plan_installments"("id") ON DELETE SET NULL
);

-- Payment Item Allocations (track which items a payment covers)
CREATE TABLE IF NOT EXISTS "payment_item_allocations" (
    "id" VARCHAR(50) PRIMARY KEY,
    "payment_id" VARCHAR(50) NOT NULL,
    "item_id" VARCHAR(50) NOT NULL,
    "item_name" VARCHAR(255) NOT NULL,
    "allocated_amount" DECIMAL(15,2) NOT NULL,
    "item_total" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE
);

-- Add payment tracking columns to offers and sales
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR(20) NOT NULL DEFAULT 'unpaid';

ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR(20) NOT NULL DEFAULT 'unpaid';

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_payment_plans_entity" ON "payment_plans"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_payment_plan_installments_plan" ON "payment_plan_installments"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_payments_entity" ON "payments"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_payments_plan" ON "payments"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_payments_installment" ON "payments"("installment_id");
CREATE INDEX IF NOT EXISTS "idx_payments_date" ON "payments"("payment_date");
CREATE INDEX IF NOT EXISTS "idx_payment_item_allocations_payment" ON "payment_item_allocations"("payment_id");
CREATE INDEX IF NOT EXISTS "idx_payment_item_allocations_item" ON "payment_item_allocations"("item_id");
