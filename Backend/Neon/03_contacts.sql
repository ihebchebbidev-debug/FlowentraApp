-- =====================================================
-- Contacts Module Tables
-- =====================================================

-- Contacts Table
CREATE TABLE IF NOT EXISTS "Contacts" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(255) NOT NULL,
    "Email" VARCHAR(255) NOT NULL,
    "Phone" VARCHAR(50),
    "Company" VARCHAR(255),
    "Position" VARCHAR(255),
    "Status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "Type" VARCHAR(50) NOT NULL DEFAULT 'individual',
    "Address" VARCHAR(500),
    "Avatar" VARCHAR(500),
    "Favorite" BOOLEAN NOT NULL DEFAULT FALSE,
    "LastContactDate" TIMESTAMP,
    "Cin" VARCHAR(50),
    "MatriculeFiscale" VARCHAR(100),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" VARCHAR(255),
    "ModifiedBy" VARCHAR(255),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Contact Notes Table
CREATE TABLE IF NOT EXISTS "ContactNotes" (
    "Id" SERIAL PRIMARY KEY,
    "ContactId" INTEGER NOT NULL,
    "Content" VARCHAR(2000) NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" VARCHAR(255),
    FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE CASCADE
);

-- Contact Tags Table
CREATE TABLE IF NOT EXISTS "ContactTags" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL UNIQUE,
    "Color" VARCHAR(50) NOT NULL DEFAULT '#3b82f6',
    "Description" VARCHAR(500),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Contact Tag Assignments Junction Table
CREATE TABLE IF NOT EXISTS "ContactTagAssignments" (
    "Id" SERIAL PRIMARY KEY,
    "ContactId" INTEGER NOT NULL,
    "TagId" INTEGER NOT NULL,
    "AssignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "AssignedBy" VARCHAR(255),
    FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("TagId") REFERENCES "ContactTags"("Id") ON DELETE CASCADE,
    UNIQUE ("ContactId", "TagId")
);

-- Indexes for Contacts
CREATE INDEX IF NOT EXISTS "idx_contacts_email" ON "Contacts"("Email");
CREATE INDEX IF NOT EXISTS "idx_contacts_name" ON "Contacts"("Name");
CREATE INDEX IF NOT EXISTS "idx_contacts_status" ON "Contacts"("Status");
CREATE INDEX IF NOT EXISTS "idx_contacts_type" ON "Contacts"("Type");
CREATE INDEX IF NOT EXISTS "idx_contacts_cin" ON "Contacts"("Cin");
CREATE INDEX IF NOT EXISTS "idx_contacts_matricule" ON "Contacts"("MatriculeFiscale");
CREATE INDEX IF NOT EXISTS "idx_contactnotes_contactid" ON "ContactNotes"("ContactId");
CREATE INDEX IF NOT EXISTS "idx_contacttagassignments_contactid" ON "ContactTagAssignments"("ContactId");
CREATE INDEX IF NOT EXISTS "idx_contacttagassignments_tagid" ON "ContactTagAssignments"("TagId");
