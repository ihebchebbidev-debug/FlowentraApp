-- =====================================================================
-- Deals Module — pipeline/opportunity entity that converts to Sale / Project / Offer
-- Idempotent: safe to run multiple times. Run on a DB copy first.
-- PostgreSQL.
-- =====================================================================

-- ── Deals ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Deals" (
    "Id"                   SERIAL PRIMARY KEY,
    "TenantId"             integer NOT NULL DEFAULT 0,
    "IsDeleted"            boolean NOT NULL DEFAULT false,
    "DeletedAt"            timestamptz NULL,
    "DeletedBy"            varchar(100) NULL,
    "DealNumber"           varchar(50) NULL,
    "Title"                varchar(255) NOT NULL DEFAULT '',
    "Description"          text NULL,
    "ContactId"            integer NOT NULL,
    "ProjectId"            integer NULL,
    "Stage"                text NOT NULL DEFAULT 'lead',
    "Probability"          integer NOT NULL DEFAULT 0,
    "EstimatedValue"       numeric(18,2) NOT NULL DEFAULT 0,
    "Currency"             varchar(3) NOT NULL DEFAULT 'TND',
    "ExpectedCloseDate"    timestamptz NULL,
    "ActualCloseDate"      timestamptz NULL,
    "Category"             varchar(50) NULL,
    "Source"               varchar(50) NULL,
    "Notes"                text NULL,
    "Tags"                 text[] NULL,
    "AssignedTo"           varchar(50) NULL,
    "AssignedToName"       varchar(255) NULL,
    "ConvertedToOfferId"   varchar(50) NULL,
    "ConvertedToSaleId"    varchar(50) NULL,
    "ConvertedToProjectId" varchar(50) NULL,
    "ConvertedAt"          timestamptz NULL,
    "CreatedDate"          timestamptz NOT NULL DEFAULT now(),
    "CreatedBy"            varchar(100) NOT NULL DEFAULT '',
    "CreatedByName"        varchar(255) NULL,
    "ModifiedDate"         timestamptz NULL,
    "ModifiedBy"           varchar(100) NULL,
    "LastActivity"         timestamptz NULL
);

CREATE INDEX IF NOT EXISTS "IX_Deals_TenantId"  ON "Deals" ("TenantId");
CREATE INDEX IF NOT EXISTS "IX_Deals_ContactId" ON "Deals" ("ContactId");
CREATE INDEX IF NOT EXISTS "IX_Deals_ProjectId" ON "Deals" ("ProjectId");
CREATE INDEX IF NOT EXISTS "IX_Deals_Stage"     ON "Deals" ("Stage");

-- ── DealItems ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "DealItems" (
    "Id"           SERIAL PRIMARY KEY,
    "TenantId"     integer NOT NULL DEFAULT 0,
    "DealId"       integer NOT NULL,
    "ArticleId"    integer NULL,
    "Type"         varchar(20) NOT NULL DEFAULT 'article',
    "ItemName"     varchar(255) NOT NULL DEFAULT '',
    "ItemCode"     varchar(100) NULL,
    "Description"  text NULL,
    "Quantity"     numeric(18,2) NOT NULL DEFAULT 1,
    "UnitPrice"    numeric(18,2) NOT NULL DEFAULT 0,
    "Discount"     numeric(5,2)  NOT NULL DEFAULT 0,
    "DiscountType" varchar(20) NOT NULL DEFAULT 'percentage',
    "LineTotal"    numeric(18,2) NOT NULL DEFAULT 0,
    "DisplayOrder" integer NOT NULL DEFAULT 0,
    CONSTRAINT "FK_DealItems_Deals" FOREIGN KEY ("DealId") REFERENCES "Deals" ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_DealItems_DealId"   ON "DealItems" ("DealId");
CREATE INDEX IF NOT EXISTS "IX_DealItems_TenantId" ON "DealItems" ("TenantId");

-- Optional installation/equipment link per item (parity with offer & sale items).
ALTER TABLE "DealItems" ADD COLUMN IF NOT EXISTS "InstallationId"   varchar(50)  NULL;
ALTER TABLE "DealItems" ADD COLUMN IF NOT EXISTS "InstallationName" varchar(255) NULL;

-- ── DealActivities ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "DealActivities" (
    "Id"            SERIAL PRIMARY KEY,
    "TenantId"      integer NOT NULL DEFAULT 0,
    "DealId"        integer NOT NULL,
    "Type"          varchar(30) NOT NULL DEFAULT 'note',
    "Description"   text NOT NULL DEFAULT '',
    "Details"       text NULL,
    "OldValue"      varchar(100) NULL,
    "NewValue"      varchar(100) NULL,
    "CreatedAt"     timestamptz NOT NULL DEFAULT now(),
    "CreatedBy"     varchar(100) NOT NULL DEFAULT '',
    "CreatedByName" varchar(255) NULL,
    CONSTRAINT "FK_DealActivities_Deals" FOREIGN KEY ("DealId") REFERENCES "Deals" ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_DealActivities_DealId"   ON "DealActivities" ("DealId");
CREATE INDEX IF NOT EXISTS "IX_DealActivities_TenantId" ON "DealActivities" ("TenantId");

-- ── Cross-entity back-links (a deal traces forward to what it became) ──
ALTER TABLE "Offers"   ADD COLUMN IF NOT EXISTS "DealId" integer NULL;
ALTER TABLE "Sales"    ADD COLUMN IF NOT EXISTS "DealId" integer NULL;
ALTER TABLE "Projects" ADD COLUMN IF NOT EXISTS "ConvertedFromDealId" integer NULL;

CREATE INDEX IF NOT EXISTS "IX_Offers_DealId" ON "Offers" ("DealId");
CREATE INDEX IF NOT EXISTS "IX_Sales_DealId"  ON "Sales" ("DealId");
