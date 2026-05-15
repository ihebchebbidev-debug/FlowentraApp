-- =====================================================
-- Lookups Module Tables
-- =====================================================

-- Lookup Items Table
CREATE TABLE IF NOT EXISTS "LookupItems" (
    "Id" VARCHAR(50) PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "Color" VARCHAR(20),
    "LookupType" VARCHAR(50) NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "SortOrder" INTEGER NOT NULL DEFAULT 0,
    "CreatedUser" VARCHAR(100) NOT NULL,
    "ModifyUser" VARCHAR(100),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "Level" INTEGER,
    "IsCompleted" BOOLEAN,
    "DefaultDuration" INTEGER,
    "IsAvailable" BOOLEAN,
    "IsPaid" BOOLEAN,
    "Category" VARCHAR(100)
);

-- Currencies Table
CREATE TABLE IF NOT EXISTS "Currencies" (
    "Id" VARCHAR(3) PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Symbol" VARCHAR(10) NOT NULL,
    "Code" VARCHAR(3) NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDefault" BOOLEAN NOT NULL DEFAULT FALSE,
    "SortOrder" INTEGER NOT NULL DEFAULT 0,
    "CreatedUser" VARCHAR(100) NOT NULL,
    "ModifyUser" VARCHAR(100),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for Lookups
CREATE INDEX IF NOT EXISTS "idx_lookupitems_type" ON "LookupItems"("LookupType");
CREATE INDEX IF NOT EXISTS "idx_lookupitems_name" ON "LookupItems"("Name");
CREATE INDEX IF NOT EXISTS "idx_currencies_code" ON "Currencies"("Code");
