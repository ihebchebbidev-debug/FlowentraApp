-- =====================================================
-- COMPLETE DATABASE CLEANUP SCRIPT
-- This will drop ALL tables in the correct order
-- Run this on your Neon database before running migrations
-- =====================================================

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS "DispatchHistory" CASCADE;
DROP TABLE IF EXISTS "TechnicianStatusHistory" CASCADE;
DROP TABLE IF EXISTS "TechnicianLeave" CASCADE;
DROP TABLE IF EXISTS "TechnicianWorkingHours" CASCADE;

-- Planning Module
DROP TABLE IF EXISTS "user_working_hours" CASCADE;
DROP TABLE IF EXISTS "user_leaves" CASCADE;

DROP TABLE IF EXISTS "TaskAttachments" CASCADE;
DROP TABLE IF EXISTS "TaskComments" CASCADE;
DROP TABLE IF EXISTS "DailyTasks" CASCADE;
DROP TABLE IF EXISTS "ProjectTasks" CASCADE;
DROP TABLE IF EXISTS "ProjectColumns" CASCADE;
DROP TABLE IF EXISTS "Projects" CASCADE;

DROP TABLE IF EXISTS "Attachments" CASCADE;
DROP TABLE IF EXISTS "Notes" CASCADE;
DROP TABLE IF EXISTS "MaterialUsage" CASCADE;
DROP TABLE IF EXISTS "Expenses" CASCADE;
DROP TABLE IF EXISTS "TimeEntries" CASCADE;
DROP TABLE IF EXISTS "DispatchTechnicians" CASCADE;
DROP TABLE IF EXISTS "Dispatches" CASCADE;

DROP TABLE IF EXISTS "ServiceOrderJobs" CASCADE;
DROP TABLE IF EXISTS "ServiceOrders" CASCADE;

DROP TABLE IF EXISTS "MaintenanceHistory" CASCADE;
DROP TABLE IF EXISTS "Installations" CASCADE;

DROP TABLE IF EXISTS "SaleActivities" CASCADE;
DROP TABLE IF EXISTS "SaleItems" CASCADE;
DROP TABLE IF EXISTS "Sales" CASCADE;

DROP TABLE IF EXISTS "OfferActivities" CASCADE;
DROP TABLE IF EXISTS "OfferItems" CASCADE;
DROP TABLE IF EXISTS "Offers" CASCADE;

DROP TABLE IF EXISTS "InventoryTransactions" CASCADE;
DROP TABLE IF EXISTS "Articles" CASCADE;
DROP TABLE IF EXISTS "ArticleCategories" CASCADE;
DROP TABLE IF EXISTS "Locations" CASCADE;

DROP TABLE IF EXISTS "EventReminders" CASCADE;
DROP TABLE IF EXISTS "EventAttendees" CASCADE;
DROP TABLE IF EXISTS "CalendarEvents" CASCADE;
DROP TABLE IF EXISTS "EventTypes" CASCADE;

DROP TABLE IF EXISTS "ContactTagAssignments" CASCADE;
DROP TABLE IF EXISTS "ContactTags" CASCADE;
DROP TABLE IF EXISTS "ContactNotes" CASCADE;
DROP TABLE IF EXISTS "Contacts" CASCADE;

DROP TABLE IF EXISTS "UserSkills" CASCADE;
DROP TABLE IF EXISTS "UserRoles" CASCADE;
DROP TABLE IF EXISTS "RoleSkills" CASCADE;
DROP TABLE IF EXISTS "Roles" CASCADE;
DROP TABLE IF EXISTS "Skills" CASCADE;

DROP TABLE IF EXISTS "UserPreferences" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

DROP TABLE IF EXISTS "MainAdminUsers" CASCADE;

DROP TABLE IF EXISTS "LookupItems" CASCADE;
DROP TABLE IF EXISTS "Currencies" CASCADE;

-- Drop migrations history table
DROP TABLE IF EXISTS "__EFMigrationsHistory" CASCADE;

-- Verify all tables are dropped
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
