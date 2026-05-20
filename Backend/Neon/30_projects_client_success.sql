-- Projects pivot to client-success container
-- Adds Project.ProjectKind and Sale.IsDeal.
-- Backfills IsDeal/ProjectId on Sales converted from Offers that had a ProjectId.

ALTER TABLE "Projects"
    ADD COLUMN IF NOT EXISTS "ProjectKind" VARCHAR(20) NOT NULL DEFAULT 'client';

ALTER TABLE "Sales"
    ADD COLUMN IF NOT EXISTS "IsDeal" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS ix_sales_tenant_isdeal_projectid
    ON "Sales" ("TenantId", "ProjectId", "IsDeal")
    WHERE "IsDeal" = TRUE;

-- Backfill: any existing sale converted from an offer that had a ProjectId
-- becomes the project's deal, and inherits ProjectId if it was missing.
-- Offers.ConvertedToSaleId is VARCHAR(50) holding the int Sale.Id as text.
UPDATE "Sales" s
SET "IsDeal" = TRUE,
    "ProjectId" = COALESCE(s."ProjectId", o."ProjectId")
FROM "Offers" o
WHERE o."ConvertedToSaleId" IS NOT NULL
  AND o."ConvertedToSaleId" ~ '^[0-9]+$'
  AND o."ConvertedToSaleId"::int = s."Id"
  AND o."ProjectId" IS NOT NULL;
