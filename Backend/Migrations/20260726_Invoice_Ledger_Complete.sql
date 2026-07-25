-- ============================================================================
-- Phase B — Customer Invoice Ledger: additive completion migration.
--
-- Adds the FKs, indexes and CHECK constraints that InvoiceService.cs relies on
-- at runtime but that were missing from the initial "Invoices / InvoiceLines /
-- InvoiceActivities" DDL.
--
-- Written as plain DDL (no DO $$ ... $$ blocks) so it runs in every client,
-- including ones that split statements on "$$". Safe to run repeatedly:
--   * FKs / CHECKs use DROP CONSTRAINT IF EXISTS then ADD CONSTRAINT.
--   * Indexes use CREATE INDEX IF NOT EXISTS.
--
-- Prereqs: the base Invoices / InvoiceLines / InvoiceActivities tables must
-- already exist (created by 20260723_PhaseB_Invoice_Ledger.sql +
-- 20260728_Invoice_Activities.sql). The Sales, Contacts and payments tables
-- must also already exist — if you don't have the payments module enabled,
-- skip section 4 (the single CREATE INDEX on payments).
-- ============================================================================

-- 1. FK: Invoices.SaleId -> Sales.Id (nullable, SET NULL on sale delete) --------
ALTER TABLE "Invoices" DROP CONSTRAINT IF EXISTS "FK_Invoices_Sales_SaleId";
ALTER TABLE "Invoices"
    ADD CONSTRAINT "FK_Invoices_Sales_SaleId"
    FOREIGN KEY ("SaleId") REFERENCES "Sales"("Id") ON DELETE SET NULL;

-- 2. FK: Invoices.ContactId -> Contacts.Id (RESTRICT — ledger must not orphan) --
ALTER TABLE "Invoices" DROP CONSTRAINT IF EXISTS "FK_Invoices_Contacts_ContactId";
ALTER TABLE "Invoices"
    ADD CONSTRAINT "FK_Invoices_Contacts_ContactId"
    FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE RESTRICT;

-- 3. Supporting indexes -------------------------------------------------------

-- Every service query filters !IsDeleted; partial index makes it a no-op.
CREATE INDEX IF NOT EXISTS "IX_Invoices_Tenant_Active"
    ON "Invoices" ("TenantId")
    WHERE "IsDeleted" = FALSE;

-- Overdue filter: posted + DueDate < now + amount due > 0.
CREATE INDEX IF NOT EXISTS "IX_Invoices_Tenant_DueDate_Posted"
    ON "Invoices" ("TenantId", "DueDate")
    WHERE "Status" = 'posted' AND "DueDate" IS NOT NULL;

-- Sort by IssueDate is common in the ledger list view.
CREATE INDEX IF NOT EXISTS "IX_Invoices_Tenant_IssueDate"
    ON "Invoices" ("TenantId", "IssueDate" DESC)
    WHERE "IsDeleted" = FALSE;

-- Line ordering: MapToDto sorts lines by DisplayOrder on every fetch.
CREATE INDEX IF NOT EXISTS "IX_InvoiceLines_Invoice_DisplayOrder"
    ON "InvoiceLines" ("InvoiceId", "DisplayOrder");

-- 4. Payments lookup used by RecalculatePaymentStateAsync --------------------
-- SKIP this single statement if the `payments` table does not exist in your DB.
CREATE INDEX IF NOT EXISTS "IX_payments_invoice_completed"
    ON payments (entity_type, entity_id)
    WHERE status = 'completed';

-- 5. CHECK constraints mirroring service invariants --------------------------

-- Header amounts must be non-negative.
ALTER TABLE "Invoices" DROP CONSTRAINT IF EXISTS "CK_Invoices_Amounts_NonNegative";
ALTER TABLE "Invoices"
    ADD CONSTRAINT "CK_Invoices_Amounts_NonNegative"
    CHECK ("Subtotal"   >= 0
       AND "TaxAmount"  >= 0
       AND "GrandTotal" >= 0
       AND "AmountPaid" >= 0);

-- Voided invoices must record a reason (VoidAsync enforces this).
ALTER TABLE "Invoices" DROP CONSTRAINT IF EXISTS "CK_Invoices_Void_Requires_Reason";
ALTER TABLE "Invoices"
    ADD CONSTRAINT "CK_Invoices_Void_Requires_Reason"
    CHECK ("Status" <> 'void' OR ("VoidReason" IS NOT NULL AND btrim("VoidReason") <> ''));

-- Posted / paid / void invoices must carry a number (PostAsync always assigns).
ALTER TABLE "Invoices" DROP CONSTRAINT IF EXISTS "CK_Invoices_Posted_Requires_Number";
ALTER TABLE "Invoices"
    ADD CONSTRAINT "CK_Invoices_Posted_Requires_Number"
    CHECK ("Status" = 'draft' OR ("InvoiceNumber" IS NOT NULL AND btrim("InvoiceNumber") <> ''));

-- Line quantity / prices must be non-negative (BuildLine assumes this).
ALTER TABLE "InvoiceLines" DROP CONSTRAINT IF EXISTS "CK_InvoiceLines_NonNegative";
ALTER TABLE "InvoiceLines"
    ADD CONSTRAINT "CK_InvoiceLines_NonNegative"
    CHECK ("Quantity"  >= 0
       AND "UnitPrice" >= 0
       AND "TaxRate"   >= 0
       AND "LineTotal" >= 0
       AND "TaxAmount" >= 0);
