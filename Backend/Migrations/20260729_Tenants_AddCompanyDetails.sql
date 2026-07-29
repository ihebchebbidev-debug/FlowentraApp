-- ============================================================================
-- Tenants: per-company report/footer identity fields
-- Every column lives on the tenant row, so EACH company keeps its own
-- address, contact, legal and bank details for PDF report footers.
-- All columns are nullable -> safe on existing rows.
-- ============================================================================

ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "CompanyEmail"        varchar(255);
ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "CompanyTagline"      varchar(255);
ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "CompanyCity"         varchar(120);
ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "CompanyPostalCode"   varchar(30);
ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "CompanyState"        varchar(120);
ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "TaxId"               varchar(80);
ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "RegistrationNumber"  varchar(80);
ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "ShareCapital"        varchar(80);
ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "BankName"            varchar(160);
ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "BankAccount"         varchar(80);
ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "BankSwift"           varchar(40);
ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "ReportFooterMessage" text;
