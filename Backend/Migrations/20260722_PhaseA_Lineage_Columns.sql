-- Phase A additive schema:
--   * SaleItems.OriginOfferItemId  → FK lineage for offer→sale pairing (A2).
--   * Offers.AcceptedWithoutConversionAt → distinguishes "accepted, no sale" from a real conversion (A3).
-- Both columns are nullable so this migration is safe on live data and fully revertible.

ALTER TABLE "SaleItems"
    ADD COLUMN IF NOT EXISTS "OriginOfferItemId" INT NULL;

CREATE INDEX IF NOT EXISTS "IX_SaleItems_OriginOfferItemId"
    ON "SaleItems" ("TenantId", "OriginOfferItemId");

ALTER TABLE "Offers"
    ADD COLUMN IF NOT EXISTS "AcceptedWithoutConversionAt" TIMESTAMPTZ NULL;