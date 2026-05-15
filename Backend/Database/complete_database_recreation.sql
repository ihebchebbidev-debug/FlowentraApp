-- =====================================================================
-- Flow Service Backend - Complete Database Recreation Script
-- =====================================================================
-- This script will DROP all existing tables and recreate the entire database schema
-- Based on all migrations and current ApplicationDbContext configuration
-- 
-- WARNING: This will DELETE ALL EXISTING DATA!
-- Only run this script on clean environments or when you want to reset everything
-- =====================================================================

-- Drop all tables in reverse dependency order to avoid foreign key conflicts
-- =====================================================================

-- Drop junction and child tables first
DROP TABLE IF EXISTS "event_reminders" CASCADE;
DROP TABLE IF EXISTS "event_attendees" CASCADE;
DROP TABLE IF EXISTS "calendar_events" CASCADE;
DROP TABLE IF EXISTS "event_types" CASCADE;

DROP TABLE IF EXISTS "Articles" CASCADE;

DROP TABLE IF EXISTS "ContactTagAssignments" CASCADE;
DROP TABLE IF EXISTS "ContactNotes" CASCADE;
DROP TABLE IF EXISTS "Contacts" CASCADE;
DROP TABLE IF EXISTS "ContactTags" CASCADE;

DROP TABLE IF EXISTS "RoleSkills" CASCADE;
DROP TABLE IF EXISTS "UserSkills" CASCADE;
DROP TABLE IF EXISTS "Skills" CASCADE;

DROP TABLE IF EXISTS "UserRoles" CASCADE;
DROP TABLE IF EXISTS "Roles" CASCADE;

DROP TABLE IF EXISTS "Users" CASCADE;
DROP TABLE IF EXISTS "UserPreferences" CASCADE;
DROP TABLE IF EXISTS "MainAdminUsers" CASCADE;

DROP TABLE IF EXISTS "LookupItems" CASCADE;
DROP TABLE IF EXISTS "Currencies" CASCADE;

-- Now recreate all tables in proper dependency order
-- =====================================================================

-- 1. Main Admin Users (Base user table)
-- =====================================================================
CREATE TABLE "MainAdminUsers" (
    "Id" SERIAL PRIMARY KEY,
    "Email" VARCHAR(255) NOT NULL UNIQUE,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "FirstName" VARCHAR(100) NOT NULL,
    "LastName" VARCHAR(100) NOT NULL,
    "PhoneNumber" VARCHAR(20),
    "Country" VARCHAR(2) NOT NULL,
    "Industry" VARCHAR(100) NOT NULL,
    "AccessToken" VARCHAR(500),
    "RefreshToken" VARCHAR(500),
    "TokenExpiresAt" TIMESTAMPTZ,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "LastLoginAt" TIMESTAMPTZ,
    "CompanyName" VARCHAR(255),
    "CompanyWebsite" VARCHAR(500),
    "Preferences" TEXT,
    "OnboardingCompleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for MainAdminUsers
CREATE INDEX "IX_MainAdminUsers_Email" ON "MainAdminUsers" ("Email");
CREATE INDEX "IX_MainAdminUsers_CreatedAt" ON "MainAdminUsers" ("CreatedAt");
CREATE INDEX "IX_MainAdminUsers_IsActive" ON "MainAdminUsers" ("IsActive");

-- 2. User Preferences
-- =====================================================================
CREATE TABLE "UserPreferences" (
    "Id" TEXT PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "Theme" VARCHAR(20) NOT NULL DEFAULT 'system',
    "Language" VARCHAR(5) NOT NULL DEFAULT 'en',
    "PrimaryColor" VARCHAR(20) NOT NULL DEFAULT 'blue',
    "LayoutMode" VARCHAR(20) NOT NULL DEFAULT 'sidebar',
    "DataView" VARCHAR(10) NOT NULL DEFAULT 'table',
    "Timezone" VARCHAR(100),
    "DateFormat" VARCHAR(20) NOT NULL DEFAULT 'MM/DD/YYYY',
    "TimeFormat" VARCHAR(5) NOT NULL DEFAULT '12h',
    "Currency" VARCHAR(5) NOT NULL DEFAULT 'USD',
    "NumberFormat" VARCHAR(10) NOT NULL DEFAULT 'comma',
    "Notifications" TEXT DEFAULT '{}',
    "SidebarCollapsed" BOOLEAN NOT NULL DEFAULT FALSE,
    "CompactMode" BOOLEAN NOT NULL DEFAULT FALSE,
    "ShowTooltips" BOOLEAN NOT NULL DEFAULT TRUE,
    "AnimationsEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "SoundEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "AutoSave" BOOLEAN NOT NULL DEFAULT TRUE,
    "WorkArea" VARCHAR(100),
    "DashboardLayout" TEXT,
    "QuickAccessItems" TEXT DEFAULT '[]',
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("UserId") REFERENCES "MainAdminUsers"("Id") ON DELETE CASCADE
);

-- Create indexes for UserPreferences
CREATE UNIQUE INDEX "IX_UserPreferences_UserId" ON "UserPreferences" ("UserId");

-- 3. Regular Users Table
-- =====================================================================
CREATE TABLE "Users" (
    "Id" SERIAL PRIMARY KEY,
    "Email" VARCHAR(255) NOT NULL UNIQUE,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "FirstName" VARCHAR(100) NOT NULL,
    "LastName" VARCHAR(100) NOT NULL,
    "PhoneNumber" VARCHAR(20),
    "Country" VARCHAR(2) NOT NULL,
    "CreatedUser" VARCHAR(100) NOT NULL,
    "ModifyUser" VARCHAR(100),
    "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifyDate" TIMESTAMPTZ,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "Role" VARCHAR(50),
    "LastLoginAt" TIMESTAMPTZ,
    "AccessToken" VARCHAR(500),
    "RefreshToken" VARCHAR(500),
    "TokenExpiresAt" TIMESTAMPTZ
);

-- Create indexes for Users
CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");

-- 4. Roles System
-- =====================================================================
CREATE TABLE "Roles" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL UNIQUE,
    "Description" VARCHAR(500),
    "CreatedUser" VARCHAR(100) NOT NULL,
    "ModifyUser" VARCHAR(100),
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for Roles
CREATE UNIQUE INDEX "IX_Roles_Name" ON "Roles" ("Name");

-- 5. User Roles Junction Table
-- =====================================================================
CREATE TABLE "UserRoles" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "RoleId" INTEGER NOT NULL,
    "AssignedBy" VARCHAR(100) NOT NULL,
    "AssignedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY ("UserId") REFERENCES "MainAdminUsers"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("RoleId") REFERENCES "Roles"("Id") ON DELETE CASCADE
);

-- Create indexes for UserRoles
CREATE INDEX "IX_UserRoles_RoleId" ON "UserRoles" ("RoleId");
CREATE INDEX "IX_UserRoles_UserId_RoleId" ON "UserRoles" ("UserId", "RoleId");

-- 6. Skills System
-- =====================================================================
CREATE TABLE "Skills" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL UNIQUE,
    "Description" VARCHAR(500),
    "Category" VARCHAR(100) NOT NULL,
    "Level" VARCHAR(20),
    "CreatedUser" VARCHAR(100) NOT NULL,
    "ModifyUser" VARCHAR(100),
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for Skills
CREATE UNIQUE INDEX "IX_Skills_Name" ON "Skills" ("Name");
CREATE INDEX "IX_Skills_Category" ON "Skills" ("Category");

-- 7. User Skills Junction Table
-- =====================================================================
CREATE TABLE "UserSkills" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "SkillId" INTEGER NOT NULL,
    "ProficiencyLevel" VARCHAR(20),
    "YearsOfExperience" INTEGER,
    "Certifications" VARCHAR(500),
    "Notes" VARCHAR(1000),
    "AssignedBy" VARCHAR(100) NOT NULL,
    "AssignedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("SkillId") REFERENCES "Skills"("Id") ON DELETE CASCADE
);

-- Create indexes for UserSkills
CREATE INDEX "IX_UserSkills_SkillId" ON "UserSkills" ("SkillId");
CREATE INDEX "IX_UserSkills_UserId_SkillId" ON "UserSkills" ("UserId", "SkillId");

-- 8. Role Skills Junction Table
-- =====================================================================
CREATE TABLE "RoleSkills" (
    "Id" SERIAL PRIMARY KEY,
    "RoleId" INTEGER NOT NULL,
    "SkillId" INTEGER NOT NULL,
    "AssignedBy" VARCHAR(100) NOT NULL,
    "AssignedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "Notes" VARCHAR(500),
    FOREIGN KEY ("RoleId") REFERENCES "Roles"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("SkillId") REFERENCES "Skills"("Id") ON DELETE CASCADE
);

-- Create indexes for RoleSkills
CREATE INDEX "IX_RoleSkills_RoleId_SkillId" ON "RoleSkills" ("RoleId", "SkillId");
CREATE INDEX "IX_RoleSkills_SkillId" ON "RoleSkills" ("SkillId");

-- 9. Contacts System
-- =====================================================================
CREATE TABLE "ContactTags" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Color" VARCHAR(50) NOT NULL DEFAULT '#3b82f6',
    "Description" VARCHAR(500),
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for ContactTags
CREATE UNIQUE INDEX "IX_ContactTags_Name" ON "ContactTags" ("Name") WHERE "IsDeleted" = FALSE;
CREATE INDEX "IX_ContactTags_IsDeleted" ON "ContactTags" ("IsDeleted");

CREATE TABLE "Contacts" (
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
    "LastContactDate" TIMESTAMPTZ,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "CreatedBy" VARCHAR(255),
    "ModifiedBy" VARCHAR(255),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for Contacts
CREATE INDEX "IX_Contacts_Email" ON "Contacts" ("Email");
CREATE INDEX "IX_Contacts_Name" ON "Contacts" ("Name");
CREATE INDEX "IX_Contacts_Status" ON "Contacts" ("Status");
CREATE INDEX "IX_Contacts_Type" ON "Contacts" ("Type");
CREATE INDEX "IX_Contacts_CreatedAt" ON "Contacts" ("CreatedAt");
CREATE INDEX "IX_Contacts_IsDeleted" ON "Contacts" ("IsDeleted");

CREATE TABLE "ContactNotes" (
    "Id" SERIAL PRIMARY KEY,
    "ContactId" INTEGER NOT NULL,
    "Content" VARCHAR(2000) NOT NULL,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "CreatedBy" VARCHAR(255),
    FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE CASCADE
);

-- Create indexes for ContactNotes
CREATE INDEX "IX_ContactNotes_ContactId" ON "ContactNotes" ("ContactId");
CREATE INDEX "IX_ContactNotes_CreatedAt" ON "ContactNotes" ("CreatedAt");

CREATE TABLE "ContactTagAssignments" (
    "Id" SERIAL PRIMARY KEY,
    "ContactId" INTEGER NOT NULL,
    "TagId" INTEGER NOT NULL,
    "AssignedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "AssignedBy" VARCHAR(255),
    FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("TagId") REFERENCES "ContactTags"("Id") ON DELETE CASCADE
);

-- Create indexes for ContactTagAssignments
CREATE INDEX "IX_ContactTagAssignments_ContactId" ON "ContactTagAssignments" ("ContactId");
CREATE INDEX "IX_ContactTagAssignments_TagId" ON "ContactTagAssignments" ("TagId");
CREATE UNIQUE INDEX "IX_ContactTagAssignments_ContactId_TagId" ON "ContactTagAssignments" ("ContactId", "TagId");

-- 10. Articles (Materials & Services)
-- =====================================================================
CREATE TABLE "Articles" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "Category" VARCHAR(100) NOT NULL,
    "Type" VARCHAR(20) NOT NULL CHECK ("Type" IN ('material','service')),
    "Status" VARCHAR(50) NOT NULL,
    "Tags" TEXT,
    "Notes" TEXT,
    
    -- Material-specific fields
    "SKU" VARCHAR(50),
    "Stock" INTEGER,
    "MinStock" INTEGER,
    "CostPrice" DECIMAL(10,2),
    "SellPrice" DECIMAL(10,2),
    "Supplier" VARCHAR(200),
    "Location" VARCHAR(200),
    "SubLocation" VARCHAR(200),
    
    -- Service-specific fields
    "BasePrice" DECIMAL(10,2),
    "Duration" INTEGER,
    "SkillsRequired" TEXT,
    "MaterialsNeeded" TEXT,
    "PreferredUsers" TEXT,
    "HourlyRate" DECIMAL(10,2),
    "EstimatedDuration" VARCHAR(100),
    "MaterialsIncluded" BOOLEAN,
    "WarrantyCoverage" VARCHAR(200),
    "ServiceArea" VARCHAR(100),
    "Inclusions" TEXT,
    "AddOnServices" TEXT,
    
    -- Common audit fields
    "LastUsed" TIMESTAMPTZ,
    "LastUsedBy" VARCHAR(100),
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "CreatedBy" VARCHAR(100) NOT NULL,
    "ModifiedBy" VARCHAR(100),
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create indexes for Articles
CREATE INDEX "IX_Articles_Type" ON "Articles" ("Type");
CREATE INDEX "IX_Articles_Category" ON "Articles" ("Category");
CREATE INDEX "IX_Articles_Status" ON "Articles" ("Status");
CREATE INDEX "IX_Articles_CreatedAt" ON "Articles" ("CreatedAt");
CREATE INDEX "IX_Articles_IsActive" ON "Articles" ("IsActive");

-- 11. Calendar System
-- =====================================================================
CREATE TABLE "event_types" (
    "Id" VARCHAR(50) PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" TEXT,
    "Color" VARCHAR(7) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "calendar_events" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Title" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "Start" TIMESTAMPTZ NOT NULL,
    "End" TIMESTAMPTZ NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT FALSE,
    "Type" VARCHAR(50) NOT NULL,
    "Status" VARCHAR(20) NOT NULL CHECK ("Status" IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
    "Priority" VARCHAR(10) NOT NULL CHECK ("Priority" IN ('low', 'medium', 'high', 'urgent')),
    "Category" VARCHAR(50),
    "Color" VARCHAR(7),
    "Location" TEXT,
    "Attendees" JSONB,
    "related_type" VARCHAR(20) CHECK ("related_type" IN ('contact', 'sale', 'offer', 'project', 'service_order')),
    "related_id" UUID,
    "contact_id" UUID,
    "Reminders" JSONB,
    "Recurring" JSONB,
    "is_private" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "created_by" UUID NOT NULL,
    "modified_by" UUID,
    FOREIGN KEY ("Type") REFERENCES "event_types"("Id") ON DELETE CASCADE
);

-- Create indexes for calendar_events
CREATE INDEX "IX_calendar_events_Start" ON "calendar_events" ("Start");
CREATE INDEX "IX_calendar_events_End" ON "calendar_events" ("End");
CREATE INDEX "IX_calendar_events_Type" ON "calendar_events" ("Type");
CREATE INDEX "IX_calendar_events_Status" ON "calendar_events" ("Status");
CREATE INDEX "IX_calendar_events_contact_id" ON "calendar_events" ("contact_id");
CREATE INDEX "IX_calendar_events_related_type" ON "calendar_events" ("related_type");
CREATE INDEX "IX_calendar_events_related_id" ON "calendar_events" ("related_id");

CREATE TABLE "event_attendees" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "user_id" UUID,
    "Email" VARCHAR(200),
    "Name" VARCHAR(100),
    "Status" VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK ("Status" IN ('pending', 'accepted', 'declined', 'tentative')),
    "Response" TEXT,
    "responded_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("event_id") REFERENCES "calendar_events"("Id") ON DELETE CASCADE
);

-- Create indexes for event_attendees
CREATE INDEX "IX_event_attendees_event_id" ON "event_attendees" ("event_id");

CREATE TABLE "event_reminders" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "Type" VARCHAR(20) NOT NULL DEFAULT 'email' CHECK ("Type" IN ('email', 'notification', 'sms')),
    "minutes_before" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("event_id") REFERENCES "calendar_events"("Id") ON DELETE CASCADE
);

-- Create indexes for event_reminders
CREATE INDEX "IX_event_reminders_event_id" ON "event_reminders" ("event_id");

-- 12. Lookups System
-- =====================================================================
CREATE TABLE "LookupItems" (
    "Id" VARCHAR(50) PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "Color" VARCHAR(20),
    "LookupType" VARCHAR(50) NOT NULL,
    "IsActive" BOOLEAN NOT NULL,
    "SortOrder" INTEGER NOT NULL,
    "CreatedUser" VARCHAR(100) NOT NULL,
    "ModifyUser" VARCHAR(100),
    "CreatedAt" TIMESTAMPTZ NOT NULL,
    "UpdatedAt" TIMESTAMPTZ,
    "IsDeleted" BOOLEAN NOT NULL,
    "Level" INTEGER,
    "IsCompleted" BOOLEAN,
    "DefaultDuration" INTEGER,
    "IsAvailable" BOOLEAN,
    "IsPaid" BOOLEAN,
    "Category" VARCHAR(100)
);

-- Create indexes for LookupItems
CREATE INDEX "IX_LookupItems_LookupType_IsDeleted" ON "LookupItems" ("LookupType", "IsDeleted");
CREATE INDEX "IX_LookupItems_SortOrder" ON "LookupItems" ("SortOrder");

CREATE TABLE "Currencies" (
    "Id" VARCHAR(3) PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Symbol" VARCHAR(10) NOT NULL,
    "Code" VARCHAR(3) NOT NULL UNIQUE,
    "IsActive" BOOLEAN NOT NULL,
    "IsDefault" BOOLEAN NOT NULL,
    "SortOrder" INTEGER NOT NULL,
    "CreatedUser" VARCHAR(100) NOT NULL,
    "ModifyUser" VARCHAR(100),
    "CreatedAt" TIMESTAMPTZ NOT NULL,
    "UpdatedAt" TIMESTAMPTZ,
    "IsDeleted" BOOLEAN NOT NULL
);

-- Create indexes for Currencies
CREATE UNIQUE INDEX "IX_Currencies_Code" ON "Currencies" ("Code");
CREATE INDEX "IX_Currencies_SortOrder" ON "Currencies" ("SortOrder");

-- =====================================================================
-- INSERT SEED DATA
-- =====================================================================

-- Insert default event types
INSERT INTO "event_types" ("Id", "Name", "Description", "Color", "is_default", "is_active") VALUES
('meeting', 'Meeting', 'General meetings and discussions', '#3B82F6', TRUE, TRUE),
('appointment', 'Appointment', 'Client appointments', '#10B981', FALSE, TRUE),
('call', 'Phone Call', 'Scheduled phone calls', '#F59E0B', FALSE, TRUE),
('task', 'Task', 'Task reminders and deadlines', '#EF4444', FALSE, TRUE),
('event', 'Event', 'Special events and occasions', '#8B5CF6', FALSE, TRUE),
('reminder', 'Reminder', 'General reminders', '#6B7280', FALSE, TRUE);

-- Insert lookup items - Article Categories
INSERT INTO "LookupItems" ("Id", "Name", "LookupType", "IsActive", "SortOrder", "CreatedUser", "CreatedAt", "IsDeleted") VALUES
('general', 'General', 'article-category', TRUE, 0, 'system', NOW(), FALSE),
('hardware', 'Hardware', 'article-category', TRUE, 1, 'system', NOW(), FALSE),
('software', 'Software', 'article-category', TRUE, 2, 'system', NOW(), FALSE),
('accessories', 'Accessories', 'article-category', TRUE, 3, 'system', NOW(), FALSE);

-- Insert lookup items - Task Statuses
INSERT INTO "LookupItems" ("Id", "Name", "Color", "Description", "LookupType", "IsActive", "SortOrder", "CreatedUser", "CreatedAt", "IsDeleted") VALUES
('todo', 'To Do', '#64748b', 'Tasks to be started', 'task-status', TRUE, 0, 'system', NOW(), FALSE),
('progress', 'In Progress', '#3b82f6', 'Currently working on', 'task-status', TRUE, 1, 'system', NOW(), FALSE),
('review', 'Review', '#f59e0b', 'Ready for review', 'task-status', TRUE, 2, 'system', NOW(), FALSE),
('done', 'Done', '#10b981', 'Completed tasks', 'task-status', TRUE, 3, 'system', NOW(), FALSE);

-- Insert currencies
INSERT INTO "Currencies" ("Id", "Name", "Symbol", "Code", "IsActive", "IsDefault", "SortOrder", "CreatedUser", "CreatedAt", "IsDeleted") VALUES
('USD', 'USD ($)', '$', 'USD', TRUE, TRUE, 0, 'system', NOW(), FALSE),
('EUR', 'EUR (€)', '€', 'EUR', TRUE, FALSE, 1, 'system', NOW(), FALSE),
('GBP', 'GBP (£)', '£', 'GBP', TRUE, FALSE, 2, 'system', NOW(), FALSE),
('TND', 'TND (د.ت)', 'د.ت', 'TND', TRUE, FALSE, 3, 'system', NOW(), FALSE);

-- =====================================================================
-- SCRIPT COMPLETION MESSAGE
-- =====================================================================
-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '=====================================================================';
    RAISE NOTICE 'Flow Service Database Recreation Completed Successfully!';
    RAISE NOTICE '=====================================================================';
    RAISE NOTICE 'Tables Created:';
    RAISE NOTICE '• MainAdminUsers (% rows)', (SELECT COUNT(*) FROM "MainAdminUsers");
    RAISE NOTICE '• UserPreferences (% rows)', (SELECT COUNT(*) FROM "UserPreferences");
    RAISE NOTICE '• Users (% rows)', (SELECT COUNT(*) FROM "Users");
    RAISE NOTICE '• Roles (% rows)', (SELECT COUNT(*) FROM "Roles");
    RAISE NOTICE '• UserRoles (% rows)', (SELECT COUNT(*) FROM "UserRoles");
    RAISE NOTICE '• Skills (% rows)', (SELECT COUNT(*) FROM "Skills");
    RAISE NOTICE '• UserSkills (% rows)', (SELECT COUNT(*) FROM "UserSkills");
    RAISE NOTICE '• RoleSkills (% rows)', (SELECT COUNT(*) FROM "RoleSkills");
    RAISE NOTICE '• Contacts (% rows)', (SELECT COUNT(*) FROM "Contacts");
    RAISE NOTICE '• ContactTags (% rows)', (SELECT COUNT(*) FROM "ContactTags");
    RAISE NOTICE '• ContactNotes (% rows)', (SELECT COUNT(*) FROM "ContactNotes");
    RAISE NOTICE '• ContactTagAssignments (% rows)', (SELECT COUNT(*) FROM "ContactTagAssignments");
    RAISE NOTICE '• Articles (% rows)', (SELECT COUNT(*) FROM "Articles");
    RAISE NOTICE '• calendar_events (% rows)', (SELECT COUNT(*) FROM "calendar_events");
    RAISE NOTICE '• event_types (% rows)', (SELECT COUNT(*) FROM "event_types");
    RAISE NOTICE '• event_attendees (% rows)', (SELECT COUNT(*) FROM "event_attendees");
    RAISE NOTICE '• event_reminders (% rows)', (SELECT COUNT(*) FROM "event_reminders");
    RAISE NOTICE '• LookupItems (% rows)', (SELECT COUNT(*) FROM "LookupItems");
    RAISE NOTICE '• Currencies (% rows)', (SELECT COUNT(*) FROM "Currencies");
    RAISE NOTICE '=====================================================================';
    RAISE NOTICE 'Database is ready for use!';
    RAISE NOTICE 'You can now run your FlowServiceBackend application.';
    RAISE NOTICE '=====================================================================';
END $$;
