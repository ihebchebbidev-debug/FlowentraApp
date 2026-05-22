-- Planned time & expenses authored on offer/sale lines and carried through to service order jobs.
-- Lineage: OriginOfferItemId stays stable across conversions (offer_item -> sale_item -> service_order_job).
CREATE TABLE IF NOT EXISTS "PlannedLineEntries" (
    "Id"                  SERIAL PRIMARY KEY,
    "TenantId"            INT          NOT NULL,
    "ParentType"          VARCHAR(30)  NOT NULL,  -- offer_item | sale_item | service_order_job
    "ParentId"            INT          NOT NULL,
    "OriginOfferItemId"   INT          NULL,
    "Kind"                VARCHAR(20)  NOT NULL,  -- time | expense
    "PlannedMinutes"      INT          NULL,
    "TechnicianCount"     INT          NULL,
    "HourlyRate"          DECIMAL(18,2) NULL,
    "ExpenseType"         VARCHAR(30)  NULL,      -- travel | per_diem | materials | subcontractor
    "PlannedAmount"       DECIMAL(18,2) NULL,
    "Currency"            VARCHAR(3)   NULL,
    "Description"         VARCHAR(500) NULL,
    "CreatedAt"           TIMESTAMP    NOT NULL DEFAULT NOW(),
    "CreatedBy"           VARCHAR(100) NULL,
    "ModifiedAt"          TIMESTAMP    NULL,
    "ModifiedBy"          VARCHAR(100) NULL
);

CREATE INDEX IF NOT EXISTS "IX_PlannedLineEntries_Parent"
    ON "PlannedLineEntries" ("TenantId", "ParentType", "ParentId");

CREATE INDEX IF NOT EXISTS "IX_PlannedLineEntries_Origin"
    ON "PlannedLineEntries" ("TenantId", "OriginOfferItemId");

-- Overrun tracking on actual entries logged by technicians.
ALTER TABLE "TimeEntries"
    ADD COLUMN IF NOT EXISTS "OverrunFlag"   BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "OverrunReason" VARCHAR(500) NULL;

ALTER TABLE "Expenses"
    ADD COLUMN IF NOT EXISTS "OverrunFlag"   BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "OverrunReason" VARCHAR(500) NULL;
