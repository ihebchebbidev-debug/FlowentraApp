-- Migration: Add geolocation fields to Contacts, Offers, and Sales
-- This enables map display functionality for all entities

-- Add geolocation to Contacts table
ALTER TABLE "Contacts" ADD COLUMN IF NOT EXISTS "Latitude" DECIMAL(10,7);
ALTER TABLE "Contacts" ADD COLUMN IF NOT EXISTS "Longitude" DECIMAL(10,7);
ALTER TABLE "Contacts" ADD COLUMN IF NOT EXISTS "HasLocation" INTEGER DEFAULT 0;

-- Add contact geolocation to Offers table (for map display without joining)
ALTER TABLE "Offers" ADD COLUMN IF NOT EXISTS "ContactLatitude" DECIMAL(10,7);
ALTER TABLE "Offers" ADD COLUMN IF NOT EXISTS "ContactLongitude" DECIMAL(10,7);
ALTER TABLE "Offers" ADD COLUMN IF NOT EXISTS "ContactHasLocation" INTEGER DEFAULT 0;

-- Add contact geolocation to Sales table (for map display without joining)
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "ContactLatitude" DECIMAL(10,7);
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "ContactLongitude" DECIMAL(10,7);
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "ContactHasLocation" INTEGER DEFAULT 0;

-- Add contact geolocation to ServiceOrders table (for map display without joining)
ALTER TABLE "ServiceOrders" ADD COLUMN IF NOT EXISTS "ContactLatitude" DECIMAL(10,7);
ALTER TABLE "ServiceOrders" ADD COLUMN IF NOT EXISTS "ContactLongitude" DECIMAL(10,7);
ALTER TABLE "ServiceOrders" ADD COLUMN IF NOT EXISTS "ContactHasLocation" INTEGER DEFAULT 0;

-- Create index for geolocation queries on Contacts
CREATE INDEX IF NOT EXISTS idx_contacts_has_location ON "Contacts" ("HasLocation") WHERE "HasLocation" = 1;

-- Create indexes for geolocation queries on Offers
CREATE INDEX IF NOT EXISTS idx_offers_contact_has_location ON "Offers" ("ContactHasLocation") WHERE "ContactHasLocation" = 1;

-- Create indexes for geolocation queries on Sales
CREATE INDEX IF NOT EXISTS idx_sales_contact_has_location ON "Sales" ("ContactHasLocation") WHERE "ContactHasLocation" = 1;

-- Create indexes for geolocation queries on ServiceOrders
CREATE INDEX IF NOT EXISTS idx_service_orders_contact_has_location ON "ServiceOrders" ("ContactHasLocation") WHERE "ContactHasLocation" = 1;

-- Optional: Update existing records to copy contact location to offers/sales
-- Run this after migration if you have existing data:
-- 
-- UPDATE "Offers" o
-- SET "ContactLatitude" = c."Latitude",
--     "ContactLongitude" = c."Longitude", 
--     "ContactHasLocation" = c."HasLocation"
-- FROM "Contacts" c
-- WHERE o."ContactId" = c."Id" AND c."HasLocation" = 1;
-- 
-- UPDATE "Sales" s
-- SET "ContactLatitude" = c."Latitude",
--     "ContactLongitude" = c."Longitude",
--     "ContactHasLocation" = c."HasLocation"
-- FROM "Contacts" c
-- WHERE s."ContactId" = c."Id" AND c."HasLocation" = 1;
--
-- UPDATE "ServiceOrders" so
-- SET "ContactLatitude" = c."Latitude",
--     "ContactLongitude" = c."Longitude",
--     "ContactHasLocation" = c."HasLocation"
-- FROM "Contacts" c
-- WHERE so."ContactId" = c."Id" AND c."HasLocation" = 1;
