-- =====================================================
-- FULL DATABASE SCHEMA - FlowService Backend
-- DATE: 2026-01-27
-- DESCRIPTION: Complete database schema with all tables
-- 
-- USAGE:
--   Option 1: Fresh install (drop all tables first):
--     Run the DROP section, then the CREATE section
--   Option 2: Safe migration (keeps existing data):
--     Skip DROP section, run only CREATE IF NOT EXISTS
-- =====================================================

-- =====================================================
-- OPTIONAL: DROP ALL TABLES (for fresh install)
-- Uncomment this section if you want to reset the database
-- Tables are dropped in reverse dependency order
-- =====================================================

/*
DROP TABLE IF EXISTS "TaskAttachments" CASCADE;
DROP TABLE IF EXISTS "TaskComments" CASCADE;
DROP TABLE IF EXISTS "DailyTasks" CASCADE;
DROP TABLE IF EXISTS "ProjectTasks" CASCADE;
DROP TABLE IF EXISTS "ProjectColumns" CASCADE;
DROP TABLE IF EXISTS "Projects" CASCADE;
DROP TABLE IF EXISTS "MaintenanceHistory" CASCADE;
DROP TABLE IF EXISTS "Installations" CASCADE;
DROP TABLE IF EXISTS "event_reminders" CASCADE;
DROP TABLE IF EXISTS "event_attendees" CASCADE;
DROP TABLE IF EXISTS "calendar_events" CASCADE;
DROP TABLE IF EXISTS "event_types" CASCADE;
DROP TABLE IF EXISTS "sale_activities" CASCADE;
DROP TABLE IF EXISTS "sale_items" CASCADE;
DROP TABLE IF EXISTS "sales" CASCADE;
DROP TABLE IF EXISTS "offer_activities" CASCADE;
DROP TABLE IF EXISTS "offer_items" CASCADE;
DROP TABLE IF EXISTS "offers" CASCADE;
DROP TABLE IF EXISTS "InventoryTransactions" CASCADE;
DROP TABLE IF EXISTS "Articles" CASCADE;
DROP TABLE IF EXISTS "ArticleCategories" CASCADE;
DROP TABLE IF EXISTS "Locations" CASCADE;
DROP TABLE IF EXISTS "ContactTagAssignments" CASCADE;
DROP TABLE IF EXISTS "ContactTags" CASCADE;
DROP TABLE IF EXISTS "ContactNotes" CASCADE;
DROP TABLE IF EXISTS "Contacts" CASCADE;
DROP TABLE IF EXISTS "RolePermissions" CASCADE;
DROP TABLE IF EXISTS "RoleSkills" CASCADE;
DROP TABLE IF EXISTS "UserSkills" CASCADE;
DROP TABLE IF EXISTS "UserRoles" CASCADE;
DROP TABLE IF EXISTS "Skills" CASCADE;
DROP TABLE IF EXISTS "Roles" CASCADE;
DROP TABLE IF EXISTS "UserPreferences" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;
DROP TABLE IF EXISTS "MainAdminUsers" CASCADE;
DROP TABLE IF EXISTS "LookupItems" CASCADE;
DROP TABLE IF EXISTS "Currencies" CASCADE;
DROP TABLE IF EXISTS "Notifications" CASCADE;
DROP TABLE IF EXISTS "SystemLogs" CASCADE;

DROP FUNCTION IF EXISTS cleanup_old_system_logs(INTEGER);
DROP FUNCTION IF EXISTS public.has_permission(INTEGER, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS public.get_user_permissions(INTEGER);
*/

-- =====================================================
-- 1. CORE AUTH & USERS MODULE
-- =====================================================

-- Main Admin Users Table (Super Admin accounts)
CREATE TABLE IF NOT EXISTS "MainAdminUsers" (
    "Id" SERIAL PRIMARY KEY,
    "Username" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(255) NOT NULL UNIQUE,
    "PasswordHash" VARCHAR(500) NOT NULL,
    "FirstName" VARCHAR(100) NOT NULL,
    "LastName" VARCHAR(100) NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "LastLoginDate" TIMESTAMP WITH TIME ZONE,
    "OnboardingCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "AccessToken" TEXT,
    "RefreshToken" TEXT,
    "TokenExpiresAt" TIMESTAMP,
    "PhoneNumber" VARCHAR(20),
    "Country" VARCHAR(2),
    "Industry" VARCHAR(100) DEFAULT '',
    "CompanyName" VARCHAR(255),
    "CompanyWebsite" VARCHAR(500),
    "PreferencesJson" TEXT,
    "UpdatedAt" TIMESTAMP,
    "LastLoginAt" TIMESTAMP
);

-- Users Table (Regular staff users)
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" SERIAL PRIMARY KEY,
    "FirstName" VARCHAR(100) NOT NULL,
    "LastName" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(255) NOT NULL UNIQUE,
    "Phone" VARCHAR(20),
    "PasswordHash" VARCHAR(500) NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedBy" VARCHAR(100) NOT NULL,
    "ModifiedDate" TIMESTAMP WITH TIME ZONE,
    "ModifiedBy" VARCHAR(100),
    "DeletedDate" TIMESTAMP WITH TIME ZONE,
    "DeletedBy" VARCHAR(100),
    "AccessToken" TEXT,
    "RefreshToken" TEXT,
    "TokenExpiresAt" TIMESTAMP,
    "CurrentStatus" VARCHAR(50) DEFAULT 'offline',
    "LocationJson" TEXT,
    "Country" VARCHAR(2) DEFAULT 'US',
    "LastLoginAt" TIMESTAMP,
    "CreatedUser" VARCHAR(100) DEFAULT 'system',
    "ModifyUser" VARCHAR(100),
    "ModifyDate" TIMESTAMP,
    "Role" VARCHAR(50) DEFAULT 'User',
    "Skills" TEXT,
    "PhoneNumber" VARCHAR(20)
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS "UserPreferences" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "PreferencesJson" JSONB NOT NULL DEFAULT '{}',
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_UserPreferences_Users" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE
);

-- =====================================================
-- 2. ROLES & SKILLS MODULE
-- =====================================================

-- Roles Table
CREATE TABLE IF NOT EXISTS "Roles" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE,
    "CreatedBy" VARCHAR(100) DEFAULT 'system',
    "ModifiedBy" VARCHAR(100),
    "CreatedUser" VARCHAR(100) DEFAULT 'system',
    "ModifyUser" VARCHAR(100)
);

-- Skills Table
CREATE TABLE IF NOT EXISTS "Skills" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "Category" VARCHAR(100),
    "Level" VARCHAR(20),
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE,
    "CreatedBy" VARCHAR(100) DEFAULT 'system',
    "ModifiedBy" VARCHAR(100),
    "CreatedUser" VARCHAR(100) DEFAULT 'system',
    "ModifyUser" VARCHAR(100)
);

-- User Roles Junction Table
CREATE TABLE IF NOT EXISTS "UserRoles" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "RoleId" INTEGER NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "AssignedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "AssignedBy" VARCHAR(100) NOT NULL DEFAULT 'system',
    CONSTRAINT "FK_UserRoles_Users" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_UserRoles_Roles" FOREIGN KEY ("RoleId") REFERENCES "Roles"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_UserRoles_User_Role" UNIQUE ("UserId", "RoleId")
);

-- User Skills Junction Table
CREATE TABLE IF NOT EXISTS "UserSkills" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "SkillId" INTEGER NOT NULL,
    "ProficiencyLevel" VARCHAR(20),
    "YearsOfExperience" INTEGER,
    "Certifications" VARCHAR(500),
    "Notes" VARCHAR(1000),
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "AssignedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "AssignedBy" VARCHAR(100) NOT NULL DEFAULT 'system',
    CONSTRAINT "FK_UserSkills_Users" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_UserSkills_Skills" FOREIGN KEY ("SkillId") REFERENCES "Skills"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_UserSkills_User_Skill" UNIQUE ("UserId", "SkillId")
);

-- Role Skills Junction Table
CREATE TABLE IF NOT EXISTS "RoleSkills" (
    "Id" SERIAL PRIMARY KEY,
    "RoleId" INTEGER NOT NULL,
    "SkillId" INTEGER NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "AssignedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "AssignedBy" VARCHAR(100) NOT NULL DEFAULT 'system',
    "Notes" VARCHAR(500),
    CONSTRAINT "FK_RoleSkills_Roles" FOREIGN KEY ("RoleId") REFERENCES "Roles"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_RoleSkills_Skills" FOREIGN KEY ("SkillId") REFERENCES "Skills"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_RoleSkills_Role_Skill" UNIQUE ("RoleId", "SkillId")
);

-- Role Permissions Table
CREATE TABLE IF NOT EXISTS "RolePermissions" (
    "Id" SERIAL PRIMARY KEY,
    "RoleId" INTEGER NOT NULL,
    "Module" VARCHAR(50) NOT NULL,
    "Action" VARCHAR(50) NOT NULL,
    "Granted" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE,
    "CreatedBy" VARCHAR(100) DEFAULT 'system',
    "ModifiedBy" VARCHAR(100),
    CONSTRAINT "FK_RolePermissions_Roles" FOREIGN KEY ("RoleId") REFERENCES "Roles"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_RolePermissions_Role_Module_Action" UNIQUE ("RoleId", "Module", "Action")
);

-- =====================================================
-- 3. CONTACTS MODULE
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
    CONSTRAINT "FK_ContactNotes_Contacts" FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE CASCADE
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
    CONSTRAINT "FK_ContactTagAssignments_Contacts" FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ContactTagAssignments_Tags" FOREIGN KEY ("TagId") REFERENCES "ContactTags"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_ContactTagAssignments_Contact_Tag" UNIQUE ("ContactId", "TagId")
);

-- =====================================================
-- 4. ARTICLES MODULE (Materials & Services)
-- =====================================================

-- Article Categories Table
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

-- Locations Table
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

-- Articles Table
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

-- Inventory Transactions Table
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
    CONSTRAINT "FK_InventoryTransactions_Articles" FOREIGN KEY ("ArticleId") REFERENCES "Articles"("Id") ON DELETE CASCADE
);

-- =====================================================
-- 5. OFFERS MODULE
-- =====================================================

-- Offers Table
CREATE TABLE IF NOT EXISTS "offers" (
    "id" VARCHAR(50) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "contact_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TND',
    "taxes" DECIMAL(15,2) DEFAULT 0,
    "discount" DECIMAL(15,2) DEFAULT 0,
    "total_amount" DECIMAL(15,2) GENERATED ALWAYS AS ("amount" + COALESCE("taxes", 0) - COALESCE("discount", 0)) STORED,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "category" VARCHAR(50),
    "source" VARCHAR(50),
    "billing_address" TEXT,
    "billing_postal_code" VARCHAR(20),
    "billing_country" VARCHAR(100),
    "delivery_address" TEXT,
    "delivery_postal_code" VARCHAR(20),
    "delivery_country" VARCHAR(100),
    "valid_until" TIMESTAMP,
    "assigned_to" VARCHAR(50),
    "assigned_to_name" VARCHAR(255),
    "tags" TEXT[],
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL,
    "last_activity" TIMESTAMP,
    "converted_to_sale_id" VARCHAR(50),
    "converted_to_service_order_id" VARCHAR(50),
    "converted_at" TIMESTAMP,
    CONSTRAINT "FK_offers_Contacts" FOREIGN KEY ("contact_id") REFERENCES "Contacts"("Id") ON DELETE RESTRICT
);

-- Offer Items Table
CREATE TABLE IF NOT EXISTS "offer_items" (
    "id" VARCHAR(50) PRIMARY KEY,
    "offer_id" VARCHAR(50) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "article_id" VARCHAR(50) NOT NULL,
    "item_name" VARCHAR(255) NOT NULL,
    "item_code" VARCHAR(100),
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(15,2) GENERATED ALWAYS AS ("quantity" * "unit_price" * (1 - COALESCE("discount", 0) / 100)) STORED,
    "discount" DECIMAL(15,2) DEFAULT 0,
    "discount_type" VARCHAR(20) DEFAULT 'percentage',
    "installation_id" VARCHAR(50),
    "installation_name" VARCHAR(255),
    CONSTRAINT "FK_offer_items_offers" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE
);

-- Offer Activities Table
CREATE TABLE IF NOT EXISTS "offer_activities" (
    "id" VARCHAR(50) PRIMARY KEY,
    "offer_id" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "details" TEXT,
    "old_value" VARCHAR(255),
    "new_value" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL,
    "created_by_name" VARCHAR(255) NOT NULL,
    CONSTRAINT "FK_offer_activities_offers" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE
);

-- =====================================================
-- 6. SALES MODULE
-- =====================================================

-- Sales Table
CREATE TABLE IF NOT EXISTS "sales" (
    "id" VARCHAR(50) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "contact_id" INTEGER NOT NULL,
    "offer_id" VARCHAR(50),
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TND',
    "taxes" DECIMAL(15,2) DEFAULT 0,
    "discount" DECIMAL(15,2) DEFAULT 0,
    "total_amount" DECIMAL(15,2) GENERATED ALWAYS AS ("amount" + COALESCE("taxes", 0) - COALESCE("discount", 0)) STORED,
    "status" VARCHAR(20) NOT NULL DEFAULT 'new_offer',
    "stage" VARCHAR(20) NOT NULL DEFAULT 'offer',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "billing_address" TEXT,
    "billing_postal_code" VARCHAR(20),
    "billing_country" VARCHAR(100),
    "delivery_address" TEXT,
    "delivery_postal_code" VARCHAR(20),
    "delivery_country" VARCHAR(100),
    "estimated_close_date" TIMESTAMP,
    "actual_close_date" TIMESTAMP,
    "valid_until" TIMESTAMP,
    "assigned_to" VARCHAR(50),
    "assigned_to_name" VARCHAR(255),
    "tags" TEXT[],
    "lost_reason" TEXT,
    "materials_fulfillment" VARCHAR(20),
    "service_orders_status" VARCHAR(20),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL,
    "last_activity" TIMESTAMP,
    CONSTRAINT "FK_sales_Contacts" FOREIGN KEY ("contact_id") REFERENCES "Contacts"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_sales_offers" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL
);

-- Sale Items Table
CREATE TABLE IF NOT EXISTS "sale_items" (
    "id" VARCHAR(50) PRIMARY KEY,
    "sale_id" VARCHAR(50) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "article_id" VARCHAR(50) NOT NULL,
    "item_name" VARCHAR(255) NOT NULL,
    "item_code" VARCHAR(100),
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(15,2) GENERATED ALWAYS AS ("quantity" * "unit_price" * (1 - COALESCE("discount", 0) / 100)) STORED,
    "discount" DECIMAL(15,2) DEFAULT 0,
    "discount_type" VARCHAR(20) DEFAULT 'percentage',
    "installation_id" VARCHAR(50),
    "installation_name" VARCHAR(255),
    CONSTRAINT "FK_sale_items_sales" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE
);

-- Sale Activities Table
CREATE TABLE IF NOT EXISTS "sale_activities" (
    "id" VARCHAR(50) PRIMARY KEY,
    "sale_id" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "details" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL,
    "created_by_name" VARCHAR(255) NOT NULL,
    CONSTRAINT "FK_sale_activities_sales" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE
);

-- =====================================================
-- 7. CALENDAR MODULE
-- =====================================================

-- Event Types Table
CREATE TABLE IF NOT EXISTS "event_types" (
    "Id" VARCHAR(50) PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" TEXT,
    "Color" VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS "calendar_events" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Title" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "Start" TIMESTAMP NOT NULL,
    "End" TIMESTAMP NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT FALSE,
    "Type" VARCHAR(50) NOT NULL,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    "Priority" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "Category" VARCHAR(50),
    "Color" VARCHAR(7),
    "Location" TEXT,
    "Attendees" JSONB,
    "related_type" VARCHAR(20),
    "related_id" UUID,
    "contact_id" INTEGER,
    "Reminders" JSONB,
    "Recurring" JSONB,
    "is_private" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "modified_by" UUID,
    CONSTRAINT "FK_calendar_events_Contacts" FOREIGN KEY ("contact_id") REFERENCES "Contacts"("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_calendar_events_event_types" FOREIGN KEY ("Type") REFERENCES "event_types"("Id") ON DELETE RESTRICT
);

-- Event Attendees Table
CREATE TABLE IF NOT EXISTS "event_attendees" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "user_id" UUID,
    "Email" VARCHAR(200),
    "Name" VARCHAR(100),
    "Status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "Response" TEXT,
    "responded_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_event_attendees_calendar_events" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("Id") ON DELETE CASCADE
);

-- Event Reminders Table
CREATE TABLE IF NOT EXISTS "event_reminders" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "Type" VARCHAR(20) NOT NULL DEFAULT 'email',
    "minutes_before" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "sent_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_event_reminders_calendar_events" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("Id") ON DELETE CASCADE
);

-- =====================================================
-- 8. INSTALLATIONS MODULE
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
    CONSTRAINT "FK_Installations_Contacts" FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE SET NULL
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
    CONSTRAINT "FK_MaintenanceHistory_Installations" FOREIGN KEY ("InstallationId") REFERENCES "Installations"("Id") ON DELETE CASCADE
);

-- =====================================================
-- 9. PROJECTS MODULE
-- =====================================================

-- Projects Table
CREATE TABLE IF NOT EXISTS "Projects" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(255) NOT NULL,
    "Description" VARCHAR(1000),
    "ContactId" INTEGER,
    "OwnerId" INTEGER NOT NULL,
    "OwnerName" VARCHAR(255) NOT NULL,
    "TeamMembers" VARCHAR(1000),
    "Budget" DECIMAL(18,2),
    "Currency" VARCHAR(3),
    "Status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "Type" VARCHAR(50) NOT NULL DEFAULT 'service',
    "Priority" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "Progress" INTEGER NOT NULL DEFAULT 0,
    "StartDate" TIMESTAMP,
    "EndDate" TIMESTAMP,
    "ActualStartDate" TIMESTAMP,
    "ActualEndDate" TIMESTAMP,
    "Tags" VARCHAR(1000),
    "IsArchived" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" VARCHAR(255),
    "ModifiedBy" VARCHAR(255),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "FK_Projects_Contacts" FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE SET NULL
);

-- Project Columns Table
CREATE TABLE IF NOT EXISTS "ProjectColumns" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectId" INTEGER NOT NULL,
    "Title" VARCHAR(255) NOT NULL,
    "Color" VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    "Position" INTEGER NOT NULL,
    "IsDefault" BOOLEAN NOT NULL DEFAULT FALSE,
    "TaskLimit" INTEGER,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_ProjectColumns_Projects" FOREIGN KEY ("ProjectId") REFERENCES "Projects"("Id") ON DELETE CASCADE
);

-- Project Tasks Table
CREATE TABLE IF NOT EXISTS "ProjectTasks" (
    "Id" SERIAL PRIMARY KEY,
    "Title" VARCHAR(255) NOT NULL,
    "Description" VARCHAR(2000),
    "ProjectId" INTEGER NOT NULL,
    "ContactId" INTEGER,
    "AssigneeId" INTEGER,
    "AssigneeName" VARCHAR(255),
    "Status" VARCHAR(50) NOT NULL DEFAULT 'todo',
    "Priority" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "ColumnId" INTEGER NOT NULL,
    "Position" INTEGER NOT NULL,
    "ParentTaskId" INTEGER,
    "DueDate" TIMESTAMP,
    "StartDate" TIMESTAMP,
    "EstimatedHours" DECIMAL(18,2),
    "ActualHours" DECIMAL(18,2),
    "Tags" VARCHAR(1000),
    "Attachments" VARCHAR(2000),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CompletedAt" TIMESTAMP,
    "CreatedBy" VARCHAR(255),
    "ModifiedBy" VARCHAR(255),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "FK_ProjectTasks_Projects" FOREIGN KEY ("ProjectId") REFERENCES "Projects"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ProjectTasks_Columns" FOREIGN KEY ("ColumnId") REFERENCES "ProjectColumns"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_ProjectTasks_Contacts" FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_ProjectTasks_Parent" FOREIGN KEY ("ParentTaskId") REFERENCES "ProjectTasks"("Id") ON DELETE SET NULL
);

-- Daily Tasks Table
CREATE TABLE IF NOT EXISTS "DailyTasks" (
    "Id" SERIAL PRIMARY KEY,
    "Title" VARCHAR(255) NOT NULL,
    "Description" VARCHAR(2000),
    "UserId" INTEGER NOT NULL,
    "UserName" VARCHAR(255) NOT NULL,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'todo',
    "Priority" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "Position" INTEGER NOT NULL,
    "DueDate" TIMESTAMP,
    "EstimatedHours" DECIMAL(18,2),
    "ActualHours" DECIMAL(18,2),
    "Tags" VARCHAR(1000),
    "Attachments" VARCHAR(2000),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CompletedAt" TIMESTAMP,
    "CreatedBy" VARCHAR(255),
    "ModifiedBy" VARCHAR(255),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Task Comments Table
CREATE TABLE IF NOT EXISTS "TaskComments" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectTaskId" INTEGER,
    "DailyTaskId" INTEGER,
    "Content" VARCHAR(2000) NOT NULL,
    "AuthorId" INTEGER NOT NULL,
    "AuthorName" VARCHAR(255) NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "FK_TaskComments_ProjectTasks" FOREIGN KEY ("ProjectTaskId") REFERENCES "ProjectTasks"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskComments_DailyTasks" FOREIGN KEY ("DailyTaskId") REFERENCES "DailyTasks"("Id") ON DELETE CASCADE
);

-- Task Attachments Table
CREATE TABLE IF NOT EXISTS "TaskAttachments" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectTaskId" INTEGER,
    "DailyTaskId" INTEGER,
    "FileName" VARCHAR(255) NOT NULL,
    "OriginalFileName" VARCHAR(255) NOT NULL,
    "FileUrl" VARCHAR(500) NOT NULL,
    "MimeType" VARCHAR(100),
    "FileSize" BIGINT NOT NULL,
    "UploadedBy" INTEGER NOT NULL,
    "UploadedByName" VARCHAR(255) NOT NULL,
    "UploadedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Caption" VARCHAR(500),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "FK_TaskAttachments_ProjectTasks" FOREIGN KEY ("ProjectTaskId") REFERENCES "ProjectTasks"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskAttachments_DailyTasks" FOREIGN KEY ("DailyTaskId") REFERENCES "DailyTasks"("Id") ON DELETE CASCADE
);

-- =====================================================
-- 10. LOOKUPS MODULE
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

-- =====================================================
-- 11. NOTIFICATIONS MODULE
-- =====================================================

-- Notifications Table
CREATE TABLE IF NOT EXISTS "Notifications" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "Title" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500) NOT NULL,
    "Type" VARCHAR(50) NOT NULL DEFAULT 'info',
    "Category" VARCHAR(50) NOT NULL DEFAULT 'system',
    "Link" VARCHAR(255),
    "RelatedEntityId" INTEGER,
    "RelatedEntityType" VARCHAR(50),
    "IsRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "ReadAt" TIMESTAMP,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 12. SYSTEM LOGS MODULE
-- =====================================================

-- SystemLogs Table
CREATE TABLE IF NOT EXISTS "SystemLogs" (
    "Id" SERIAL PRIMARY KEY,
    "Timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "Level" VARCHAR(20) NOT NULL CHECK ("Level" IN ('info', 'warning', 'error', 'success')),
    "Message" TEXT NOT NULL,
    "Module" VARCHAR(100) NOT NULL,
    "Action" VARCHAR(50) NOT NULL DEFAULT 'other' CHECK ("Action" IN ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'other')),
    "UserId" VARCHAR(100),
    "UserName" VARCHAR(200),
    "EntityType" VARCHAR(100),
    "EntityId" VARCHAR(100),
    "Details" TEXT,
    "IpAddress" VARCHAR(45),
    "UserAgent" TEXT,
    "Metadata" JSONB
);

-- =====================================================
-- 13. ALL INDEXES
-- =====================================================

-- Auth & Users Indexes
CREATE INDEX IF NOT EXISTS "idx_mainadminusers_email" ON "MainAdminUsers"("Email");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "Users"("Email");
CREATE INDEX IF NOT EXISTS "idx_users_isdeleted" ON "Users"("IsDeleted");
CREATE INDEX IF NOT EXISTS "idx_users_isactive" ON "Users"("IsActive");
CREATE INDEX IF NOT EXISTS "idx_userpreferences_userid" ON "UserPreferences"("UserId");

-- Roles & Skills Indexes
CREATE INDEX IF NOT EXISTS "idx_roles_name" ON "Roles"("Name");
CREATE INDEX IF NOT EXISTS "idx_roles_isactive" ON "Roles"("IsActive");
CREATE INDEX IF NOT EXISTS "idx_skills_name" ON "Skills"("Name");
CREATE INDEX IF NOT EXISTS "idx_skills_category" ON "Skills"("Category");
CREATE INDEX IF NOT EXISTS "idx_skills_isactive" ON "Skills"("IsActive");
CREATE INDEX IF NOT EXISTS "idx_userroles_userid" ON "UserRoles"("UserId");
CREATE INDEX IF NOT EXISTS "idx_userroles_roleid" ON "UserRoles"("RoleId");
CREATE INDEX IF NOT EXISTS "idx_userskills_userid" ON "UserSkills"("UserId");
CREATE INDEX IF NOT EXISTS "idx_userskills_skillid" ON "UserSkills"("SkillId");
CREATE INDEX IF NOT EXISTS "idx_roleskills_roleid" ON "RoleSkills"("RoleId");
CREATE INDEX IF NOT EXISTS "idx_roleskills_skillid" ON "RoleSkills"("SkillId");
CREATE INDEX IF NOT EXISTS "IX_RolePermissions_RoleId" ON "RolePermissions"("RoleId");
CREATE INDEX IF NOT EXISTS "IX_RolePermissions_Module_Action" ON "RolePermissions"("Module", "Action");

-- Contacts Indexes
CREATE INDEX IF NOT EXISTS "idx_contacts_email" ON "Contacts"("Email");
CREATE INDEX IF NOT EXISTS "idx_contacts_name" ON "Contacts"("Name");
CREATE INDEX IF NOT EXISTS "idx_contacts_status" ON "Contacts"("Status");
CREATE INDEX IF NOT EXISTS "idx_contacts_company" ON "Contacts"("Company");
CREATE INDEX IF NOT EXISTS "idx_contactnotes_contact" ON "ContactNotes"("ContactId");
CREATE INDEX IF NOT EXISTS "idx_contacttagassignments_contact" ON "ContactTagAssignments"("ContactId");
CREATE INDEX IF NOT EXISTS "idx_contacttagassignments_tag" ON "ContactTagAssignments"("TagId");

-- Articles Indexes
CREATE INDEX IF NOT EXISTS "idx_articles_type" ON "Articles"("Type");
CREATE INDEX IF NOT EXISTS "idx_articles_category" ON "Articles"("Category");
CREATE INDEX IF NOT EXISTS "idx_articles_status" ON "Articles"("Status");
CREATE INDEX IF NOT EXISTS "idx_articles_name" ON "Articles"("Name");
CREATE INDEX IF NOT EXISTS "idx_inventorytransactions_article" ON "InventoryTransactions"("ArticleId");
CREATE INDEX IF NOT EXISTS "idx_inventorytransactions_type" ON "InventoryTransactions"("Type");

-- Offers Indexes
CREATE INDEX IF NOT EXISTS "idx_offers_contact" ON "offers"("contact_id");
CREATE INDEX IF NOT EXISTS "idx_offers_status" ON "offers"("status");
CREATE INDEX IF NOT EXISTS "idx_offers_created_at" ON "offers"("created_at");
CREATE INDEX IF NOT EXISTS "idx_offer_items_offer" ON "offer_items"("offer_id");
CREATE INDEX IF NOT EXISTS "idx_offer_activities_offer" ON "offer_activities"("offer_id");

-- Sales Indexes
CREATE INDEX IF NOT EXISTS "idx_sales_contact" ON "sales"("contact_id");
CREATE INDEX IF NOT EXISTS "idx_sales_offer" ON "sales"("offer_id");
CREATE INDEX IF NOT EXISTS "idx_sales_status" ON "sales"("status");
CREATE INDEX IF NOT EXISTS "idx_sales_stage" ON "sales"("stage");
CREATE INDEX IF NOT EXISTS "idx_sales_created_at" ON "sales"("created_at");
CREATE INDEX IF NOT EXISTS "idx_sale_items_sale" ON "sale_items"("sale_id");
CREATE INDEX IF NOT EXISTS "idx_sale_activities_sale" ON "sale_activities"("sale_id");

-- Calendar Indexes
CREATE INDEX IF NOT EXISTS "idx_calendar_events_start" ON "calendar_events"("Start");
CREATE INDEX IF NOT EXISTS "idx_calendar_events_type" ON "calendar_events"("Type");
CREATE INDEX IF NOT EXISTS "idx_calendar_events_contact" ON "calendar_events"("contact_id");
CREATE INDEX IF NOT EXISTS "idx_event_attendees_event" ON "event_attendees"("event_id");
CREATE INDEX IF NOT EXISTS "idx_event_reminders_event" ON "event_reminders"("event_id");

-- Installations Indexes
CREATE INDEX IF NOT EXISTS "idx_installations_status" ON "Installations"("Status");
CREATE INDEX IF NOT EXISTS "idx_installations_contact" ON "Installations"("ContactId");
CREATE INDEX IF NOT EXISTS "idx_installations_category" ON "Installations"("Category");
CREATE INDEX IF NOT EXISTS "idx_maintenancehistory_installation" ON "MaintenanceHistory"("InstallationId");

-- Projects Indexes
CREATE INDEX IF NOT EXISTS "idx_projects_contact" ON "Projects"("ContactId");
CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "Projects"("Status");
CREATE INDEX IF NOT EXISTS "idx_projectcolumns_project" ON "ProjectColumns"("ProjectId");
CREATE INDEX IF NOT EXISTS "idx_projecttasks_project" ON "ProjectTasks"("ProjectId");
CREATE INDEX IF NOT EXISTS "idx_projecttasks_column" ON "ProjectTasks"("ColumnId");
CREATE INDEX IF NOT EXISTS "idx_projecttasks_contact" ON "ProjectTasks"("ContactId");
CREATE INDEX IF NOT EXISTS "idx_dailytasks_user" ON "DailyTasks"("UserId");
CREATE INDEX IF NOT EXISTS "idx_taskcomments_projecttask" ON "TaskComments"("ProjectTaskId");
CREATE INDEX IF NOT EXISTS "idx_taskcomments_dailytask" ON "TaskComments"("DailyTaskId");

-- Lookups Indexes
CREATE INDEX IF NOT EXISTS "idx_lookupitems_type" ON "LookupItems"("LookupType");
CREATE INDEX IF NOT EXISTS "idx_lookupitems_name" ON "LookupItems"("Name");
CREATE INDEX IF NOT EXISTS "idx_lookupitems_active" ON "LookupItems"("IsActive");
CREATE INDEX IF NOT EXISTS "idx_currencies_code" ON "Currencies"("Code");

-- Notifications Indexes
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId" ON "Notifications"("UserId");
CREATE INDEX IF NOT EXISTS "IX_Notifications_IsRead" ON "Notifications"("IsRead");
CREATE INDEX IF NOT EXISTS "IX_Notifications_CreatedAt" ON "Notifications"("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId_IsRead" ON "Notifications"("UserId", "IsRead");

-- SystemLogs Indexes
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Timestamp" ON "SystemLogs" ("Timestamp" DESC);
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Level" ON "SystemLogs" ("Level");
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Module" ON "SystemLogs" ("Module");
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_UserId" ON "SystemLogs" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Action" ON "SystemLogs" ("Action");
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_EntityType_EntityId" ON "SystemLogs" ("EntityType", "EntityId");
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Level_Module_Timestamp" ON "SystemLogs" ("Level", "Module", "Timestamp" DESC);

-- =====================================================
-- 14. HELPER FUNCTIONS
-- =====================================================

-- Permission check function
CREATE OR REPLACE FUNCTION public.has_permission(
    _user_id INTEGER,
    _module VARCHAR(50),
    _action VARCHAR(50)
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM "RolePermissions" rp
        INNER JOIN "UserRoles" ur ON ur."RoleId" = rp."RoleId"
        WHERE ur."UserId" = _user_id
          AND ur."IsActive" = true
          AND rp."Module" = _module
          AND rp."Action" = _action
          AND rp."Granted" = true
    )
$$;

-- Get user permissions function
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id INTEGER)
RETURNS TABLE(permission TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT DISTINCT rp."Module" || ':' || rp."Action" as permission
    FROM "RolePermissions" rp
    INNER JOIN "UserRoles" ur ON ur."RoleId" = rp."RoleId"
    WHERE ur."UserId" = _user_id
      AND ur."IsActive" = true
      AND rp."Granted" = true
    ORDER BY permission
$$;

-- System logs cleanup function (7-day retention)
CREATE OR REPLACE FUNCTION cleanup_old_system_logs(days_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "SystemLogs" WHERE "Timestamp" < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO "SystemLogs" ("Timestamp", "Level", "Message", "Module", "Action")
    VALUES (NOW(), 'info', 'System logs cleanup: Deleted ' || deleted_count || ' logs older than ' || days_to_keep || ' days', 'SystemLogs', 'delete');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 15. DEFAULT DATA SEEDING
-- =====================================================

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
    -- Event Types
    ('event_meeting', 'Meeting', 'Meeting event', 'event-type', 1, '#3b82f6', 'system'),
    ('event_call', 'Call', 'Phone call', 'event-type', 2, '#22c55e', 'system'),
    ('event_task', 'Task', 'Task event', 'event-type', 3, '#FFA500', 'system'),
    -- Offer Statuses
    ('offer_draft', 'Draft', 'Offer in draft', 'offer-status', 1, '#808080', 'system'),
    ('offer_sent', 'Sent', 'Offer sent', 'offer-status', 2, '#3b82f6', 'system'),
    ('offer_accepted', 'Accepted', 'Offer accepted', 'offer-status', 3, '#22c55e', 'system'),
    ('offer_rejected', 'Rejected', 'Offer rejected', 'offer-status', 4, '#FF0000', 'system')
ON CONFLICT ("Id") DO NOTHING;

-- Insert default currencies
INSERT INTO "Currencies" ("Id", "Name", "Symbol", "Code", "IsDefault", "SortOrder", "CreatedUser")
VALUES 
    ('USD', 'US Dollar', '$', 'USD', FALSE, 1, 'system'),
    ('EUR', 'Euro', '€', 'EUR', FALSE, 2, 'system'),
    ('GBP', 'British Pound', '£', 'GBP', FALSE, 3, 'system'),
    ('TND', 'Tunisian Dinar', 'د.ت', 'TND', TRUE, 0, 'system')
ON CONFLICT ("Id") DO NOTHING;

-- Create default Administrator role if not exists
INSERT INTO "Roles" ("Name", "Description", "IsActive", "CreatedBy")
SELECT 'Administrator', 'Full system access with all permissions', true, 'system'
WHERE NOT EXISTS (SELECT 1 FROM "Roles" WHERE "Name" = 'Administrator');

-- =====================================================
-- 16. VERIFICATION QUERIES
-- =====================================================

-- Show all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
