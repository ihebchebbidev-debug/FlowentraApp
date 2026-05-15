-- =====================================================
-- MIGRATION: 13_complete_schema_setup.sql
-- DATE: 2025-12-02
-- DESCRIPTION: Complete schema setup for all modules
-- Fixes 500 errors in Contacts, Tags, Articles, Lookups,
-- Projects, Tasks, and Installations
-- =====================================================

-- =====================================================
-- 1. CONTACTS MODULE
-- =====================================================

-- Contacts Table (PascalCase to match Entity Framework)
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
    "Content" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" VARCHAR(255),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE CASCADE
);

-- Contact Tags Table
CREATE TABLE IF NOT EXISTS "ContactTags" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Color" VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
    "Description" VARCHAR(500),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" VARCHAR(255),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Contact Tag Assignments Table
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
CREATE INDEX IF NOT EXISTS "idx_contacts_company" ON "Contacts"("Company");
CREATE INDEX IF NOT EXISTS "idx_contactnotes_contact" ON "ContactNotes"("ContactId");
CREATE INDEX IF NOT EXISTS "idx_contacttagassignments_contact" ON "ContactTagAssignments"("ContactId");
CREATE INDEX IF NOT EXISTS "idx_contacttagassignments_tag" ON "ContactTagAssignments"("TagId");

-- =====================================================
-- 2. ARTICLES MODULE (Fix naming to match EF)
-- =====================================================

-- Articles Table (PascalCase)
CREATE TABLE IF NOT EXISTS "Articles" (
    "Id" VARCHAR(50) PRIMARY KEY,
    "Type" VARCHAR(20) NOT NULL,
    "Name" VARCHAR(255) NOT NULL,
    "Sku" VARCHAR(100),
    "Description" TEXT,
    "Category" VARCHAR(100) NOT NULL,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "Stock" INTEGER DEFAULT 0,
    "MinStock" INTEGER DEFAULT 0,
    "CostPrice" DECIMAL(10,2),
    "SellPrice" DECIMAL(10,2),
    "Supplier" VARCHAR(255),
    "Location" VARCHAR(255),
    "SubLocation" VARCHAR(255),
    "BasePrice" DECIMAL(10,2),
    "Duration" INTEGER,
    "SkillsRequired" TEXT,
    "MaterialsNeeded" TEXT,
    "PreferredUsers" TEXT,
    "LastUsed" TIMESTAMP,
    "LastUsedBy" VARCHAR(50),
    "Tags" TEXT,
    "Notes" TEXT,
    "Unit" VARCHAR(50) DEFAULT 'piece',
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" VARCHAR(50),
    "ModifiedBy" VARCHAR(50),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Article Categories Table (PascalCase)
CREATE TABLE IF NOT EXISTS "ArticleCategories" (
    "Id" VARCHAR(50) PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Type" VARCHAR(20) NOT NULL,
    "Description" VARCHAR(500),
    "ParentId" VARCHAR(50),
    "SortOrder" INTEGER NOT NULL DEFAULT 0,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Locations Table (PascalCase)
CREATE TABLE IF NOT EXISTS "Locations" (
    "Id" VARCHAR(50) PRIMARY KEY,
    "Name" VARCHAR(255) NOT NULL,
    "Type" VARCHAR(50) NOT NULL,
    "Address" VARCHAR(500),
    "AssignedTechnician" VARCHAR(50),
    "Capacity" INTEGER,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Transactions Table (PascalCase)
CREATE TABLE IF NOT EXISTS "InventoryTransactions" (
    "Id" VARCHAR(50) PRIMARY KEY,
    "ArticleId" VARCHAR(50) NOT NULL,
    "Type" VARCHAR(20) NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "FromLocation" VARCHAR(255),
    "ToLocation" VARCHAR(255),
    "Reason" VARCHAR(500) NOT NULL,
    "Reference" VARCHAR(100),
    "PerformedBy" VARCHAR(50) NOT NULL,
    "Notes" TEXT,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ArticleId") REFERENCES "Articles"("Id") ON DELETE CASCADE
);

-- Indexes for Articles
CREATE INDEX IF NOT EXISTS "idx_articles_type_pc" ON "Articles"("Type");
CREATE INDEX IF NOT EXISTS "idx_articles_category_pc" ON "Articles"("Category");
CREATE INDEX IF NOT EXISTS "idx_articles_status_pc" ON "Articles"("Status");
CREATE INDEX IF NOT EXISTS "idx_articles_name_pc" ON "Articles"("Name");

-- =====================================================
-- 3. LOOKUPS MODULE
-- =====================================================

-- Lookup Items Table (stores all lookup types)
CREATE TABLE IF NOT EXISTS "LookupItems" (
    "Id" VARCHAR(50) PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "Color" VARCHAR(20),
    "LookupType" VARCHAR(50) NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "SortOrder" INTEGER NOT NULL DEFAULT 0,
    "CreatedUser" VARCHAR(100) NOT NULL DEFAULT 'system',
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
    "CreatedUser" VARCHAR(100) NOT NULL DEFAULT 'system',
    "ModifyUser" VARCHAR(100),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for Lookups
CREATE INDEX IF NOT EXISTS "idx_lookupitems_type" ON "LookupItems"("LookupType");
CREATE INDEX IF NOT EXISTS "idx_lookupitems_name" ON "LookupItems"("Name");
CREATE INDEX IF NOT EXISTS "idx_lookupitems_active" ON "LookupItems"("IsActive");
CREATE INDEX IF NOT EXISTS "idx_currencies_code" ON "Currencies"("Code");

-- Insert default lookup data
INSERT INTO "LookupItems" ("Id", "Name", "Description", "LookupType", "SortOrder", "Color", "CreatedUser")
VALUES 
    -- Priorities
    ('priority_low', 'Low', 'Low priority', 'priority', 1, '#90EE90', 'system'),
    ('priority_medium', 'Medium', 'Medium priority', 'priority', 2, '#FFD700', 'system'),
    ('priority_high', 'High', 'High priority', 'priority', 3, '#FFA500', 'system'),
    ('priority_urgent', 'Urgent', 'Urgent priority', 'priority', 4, '#FF0000', 'system'),
    -- Task Statuses
    ('task_todo', 'To Do', 'Task not started', 'task-status', 1, '#808080', 'system'),
    ('task_inprogress', 'In Progress', 'Task in progress', 'task-status', 2, '#3b82f6', 'system'),
    ('task_completed', 'Completed', 'Task completed', 'task-status', 3, '#22c55e', 'system'),
    -- Project Statuses
    ('project_planning', 'Planning', 'Project in planning', 'project-status', 1, '#808080', 'system'),
    ('project_active', 'Active', 'Project is active', 'project-status', 2, '#3b82f6', 'system'),
    ('project_onhold', 'On Hold', 'Project on hold', 'project-status', 3, '#FFA500', 'system'),
    ('project_completed', 'Completed', 'Project completed', 'project-status', 4, '#22c55e', 'system'),
    -- Project Types
    ('projecttype_service', 'Service', 'Service project', 'project-type', 1, '#3b82f6', 'system'),
    ('projecttype_sales', 'Sales', 'Sales project', 'project-type', 2, '#22c55e', 'system'),
    ('projecttype_internal', 'Internal', 'Internal project', 'project-type', 3, '#808080', 'system'),
    -- Event Types
    ('event_meeting', 'Meeting', 'Meeting event', 'event-type', 1, '#3b82f6', 'system'),
    ('event_call', 'Call', 'Phone call', 'event-type', 2, '#22c55e', 'system'),
    ('event_task', 'Task', 'Task event', 'event-type', 3, '#FFA500', 'system'),
    -- Article Categories
    ('artcat_electronics', 'Electronics', 'Electronic items', 'article-category', 1, '#3b82f6', 'system'),
    ('artcat_plumbing', 'Plumbing', 'Plumbing materials', 'article-category', 2, '#22c55e', 'system'),
    ('artcat_hvac', 'HVAC', 'HVAC equipment', 'article-category', 3, '#FFA500', 'system'),
    ('artcat_tools', 'Tools', 'Tools and equipment', 'article-category', 4, '#808080', 'system'),
    -- Article Statuses
    ('artstatus_active', 'Active', 'Item is active', 'article-status', 1, '#22c55e', 'system'),
    ('artstatus_inactive', 'Inactive', 'Item is inactive', 'article-status', 2, '#808080', 'system'),
    ('artstatus_discontinued', 'Discontinued', 'Item discontinued', 'article-status', 3, '#FF0000', 'system'),
    -- Service Categories
    ('srvcat_installation', 'Installation', 'Installation services', 'service-category', 1, '#3b82f6', 'system'),
    ('srvcat_maintenance', 'Maintenance', 'Maintenance services', 'service-category', 2, '#22c55e', 'system'),
    ('srvcat_repair', 'Repair', 'Repair services', 'service-category', 3, '#FFA500', 'system'),
    -- Countries (sample)
    ('country_us', 'United States', 'USA', 'country', 1, NULL, 'system'),
    ('country_ca', 'Canada', 'Canada', 'country', 2, NULL, 'system'),
    ('country_gb', 'United Kingdom', 'UK', 'country', 3, NULL, 'system'),
    ('country_de', 'Germany', 'Germany', 'country', 4, NULL, 'system'),
    -- Technician Statuses
    ('techstatus_available', 'Available', 'Technician available', 'technician-status', 1, '#22c55e', 'system'),
    ('techstatus_busy', 'Busy', 'Technician busy', 'technician-status', 2, '#FFA500', 'system'),
    ('techstatus_offline', 'Offline', 'Technician offline', 'technician-status', 3, '#808080', 'system'),
    -- Leave Types
    ('leave_annual', 'Annual Leave', 'Paid annual leave', 'leave-type', 1, '#3b82f6', 'system'),
    ('leave_sick', 'Sick Leave', 'Sick leave', 'leave-type', 2, '#FF0000', 'system'),
    ('leave_personal', 'Personal', 'Personal leave', 'leave-type', 3, '#FFA500', 'system'),
    -- Offer Statuses
    ('offer_draft', 'Draft', 'Offer in draft', 'offer-status', 1, '#808080', 'system'),
    ('offer_sent', 'Sent', 'Offer sent', 'offer-status', 2, '#3b82f6', 'system'),
    ('offer_accepted', 'Accepted', 'Offer accepted', 'offer-status', 3, '#22c55e', 'system'),
    ('offer_rejected', 'Rejected', 'Offer rejected', 'offer-status', 4, '#FF0000', 'system')
ON CONFLICT ("Id") DO NOTHING;

-- Insert default currencies
INSERT INTO "Currencies" ("Id", "Name", "Symbol", "Code", "IsDefault", "SortOrder", "CreatedUser")
VALUES 
    ('USD', 'US Dollar', '$', 'USD', TRUE, 1, 'system'),
    ('EUR', 'Euro', '€', 'EUR', FALSE, 2, 'system'),
    ('GBP', 'British Pound', '£', 'GBP', FALSE, 3, 'system'),
    ('CAD', 'Canadian Dollar', 'C$', 'CAD', FALSE, 4, 'system'),
    ('AUD', 'Australian Dollar', 'A$', 'AUD', FALSE, 5, 'system')
ON CONFLICT ("Id") DO NOTHING;

-- =====================================================
-- 4. INSTALLATIONS MODULE
-- =====================================================

-- Installations Table
CREATE TABLE IF NOT EXISTS "Installations" (
    "Id" VARCHAR(50) PRIMARY KEY,
    "Name" VARCHAR(255) NOT NULL,
    "Description" TEXT,
    "Category" VARCHAR(100),
    "Status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "ContactId" INTEGER,
    "InstallationDate" TIMESTAMP,
    "WarrantyEndDate" TIMESTAMP,
    "LastMaintenanceDate" TIMESTAMP,
    "NextMaintenanceDate" TIMESTAMP,
    "MaintenanceFrequency" VARCHAR(50),
    "SerialNumber" VARCHAR(100),
    "ModelNumber" VARCHAR(100),
    "Manufacturer" VARCHAR(255),
    "LocationAddress" VARCHAR(500),
    "LocationCity" VARCHAR(100),
    "LocationState" VARCHAR(100),
    "LocationCountry" VARCHAR(100),
    "LocationPostalCode" VARCHAR(20),
    "LocationLatitude" DECIMAL(10,7),
    "LocationLongitude" DECIMAL(10,7),
    "Tags" TEXT,
    "Notes" TEXT,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" VARCHAR(255),
    "ModifiedBy" VARCHAR(255),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE SET NULL
);

-- Maintenance History Table
CREATE TABLE IF NOT EXISTS "MaintenanceHistory" (
    "Id" SERIAL PRIMARY KEY,
    "InstallationId" VARCHAR(50) NOT NULL,
    "MaintenanceType" VARCHAR(100) NOT NULL,
    "Description" TEXT,
    "PerformedBy" VARCHAR(255),
    "PerformedDate" TIMESTAMP NOT NULL,
    "Cost" DECIMAL(10,2),
    "Notes" TEXT,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" VARCHAR(255),
    FOREIGN KEY ("InstallationId") REFERENCES "Installations"("Id") ON DELETE CASCADE
);

-- Indexes for Installations
CREATE INDEX IF NOT EXISTS "idx_installations_status" ON "Installations"("Status");
CREATE INDEX IF NOT EXISTS "idx_installations_contact" ON "Installations"("ContactId");
CREATE INDEX IF NOT EXISTS "idx_installations_category" ON "Installations"("Category");
CREATE INDEX IF NOT EXISTS "idx_maintenancehistory_installation" ON "MaintenanceHistory"("InstallationId");

-- =====================================================
-- 5. FIX TOKEN COLUMNS (if not already done)
-- =====================================================

-- Change AccessToken and RefreshToken to TEXT type
DO $$
BEGIN
    -- MainAdminUsers table
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'MainAdminUsers' AND column_name = 'AccessToken' 
               AND data_type = 'character varying') THEN
        ALTER TABLE "MainAdminUsers" ALTER COLUMN "AccessToken" TYPE TEXT;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'MainAdminUsers' AND column_name = 'RefreshToken' 
               AND data_type = 'character varying') THEN
        ALTER TABLE "MainAdminUsers" ALTER COLUMN "RefreshToken" TYPE TEXT;
    END IF;
    
    -- Users table
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Users' AND column_name = 'AccessToken' 
               AND data_type = 'character varying') THEN
        ALTER TABLE "Users" ALTER COLUMN "AccessToken" TYPE TEXT;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Users' AND column_name = 'RefreshToken' 
               AND data_type = 'character varying') THEN
        ALTER TABLE "Users" ALTER COLUMN "RefreshToken" TYPE TEXT;
    END IF;
END $$;

-- =====================================================
-- 6. PLANNING MODULE (Working Hours & Leaves)
-- Works for both MainAdminUsers (id=1) and Users (id>=2)
-- =====================================================

-- User Working Hours Table (no FK constraint - works for both user types)
CREATE TABLE IF NOT EXISTS "user_working_hours" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL CHECK ("day_of_week" >= 0 AND "day_of_week" <= 6),
    "start_time" TIME NOT NULL DEFAULT '08:00:00',
    "end_time" TIME NOT NULL DEFAULT '17:00:00',
    "lunch_start" TIME DEFAULT '12:00:00',
    "lunch_end" TIME DEFAULT '13:00:00',
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "effective_from" TIMESTAMP WITH TIME ZONE,
    "effective_until" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE ("user_id", "day_of_week")
);

-- User Leaves Table (no FK constraint - works for both user types)
CREATE TABLE IF NOT EXISTS "user_leaves" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "leave_type" VARCHAR(100) NOT NULL,
    "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'approved',
    "reason" TEXT,
    "notes" TEXT,
    "approved_by" INTEGER,
    "approved_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for Planning
CREATE INDEX IF NOT EXISTS "idx_user_working_hours_user_id" ON "user_working_hours"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_working_hours_day" ON "user_working_hours"("day_of_week");
CREATE INDEX IF NOT EXISTS "idx_user_leaves_user_id" ON "user_leaves"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_leaves_dates" ON "user_leaves"("start_date", "end_date");
CREATE INDEX IF NOT EXISTS "idx_user_leaves_status" ON "user_leaves"("status");

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Show all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Show lookup counts
SELECT "LookupType", COUNT(*) as count 
FROM "LookupItems" 
GROUP BY "LookupType" 
ORDER BY "LookupType";

-- =====================================================
-- MIGRATION COMPLETE: 13_complete_schema_setup.sql
-- =====================================================
