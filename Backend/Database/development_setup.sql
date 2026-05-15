-- =====================================================================
-- Flow Service Backend - Development Setup Script
-- =====================================================================
-- This script provides a quick development setup with sample data
-- Safe to run multiple times - includes DROP IF EXISTS
-- =====================================================================

-- Create development database if it doesn't exist
-- Note: Run this as a superuser if database doesn't exist
-- CREATE DATABASE flowservice_dev;

-- Drop tables if they exist (for clean development setup)
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

-- Now run the complete recreation script
\i complete_database_recreation.sql

-- =====================================================================
-- DEVELOPMENT SAMPLE DATA
-- =====================================================================

-- Insert sample admin user (dev@flowservice.com / password123)
INSERT INTO "MainAdminUsers" ("Email", "PasswordHash", "FirstName", "LastName", "Country", "Industry", "CompanyName", "OnboardingCompleted") VALUES
('dev@flowservice.com', '$2a$11$F1YqZzZzZzZzZzZzZzZzZOHYxIcjEOYDYJxYxZxZxZxZxZxZxZxZx', 'Developer', 'User', 'US', 'Technology', 'Flow Service Dev', TRUE),
('admin@flowservice.com', '$2a$11$F1YqZzZzZzZzZzZzZzZzZOHYxIcjEOYDYJxYxZxZxZxZxZxZxZxZx', 'Admin', 'User', 'US', 'Technology', 'Flow Service Inc', TRUE);

-- Insert sample user preferences
INSERT INTO "UserPreferences" ("Id", "UserId", "Theme", "Language", "PrimaryColor") VALUES
('dev-prefs-1', 1, 'dark', 'en', 'blue'),
('admin-prefs-2', 2, 'light', 'en', 'green');

-- Insert sample regular users
INSERT INTO "Users" ("Email", "PasswordHash", "FirstName", "LastName", "Country", "CreatedUser", "Role") VALUES
('user1@flowservice.com', '$2a$11$F1YqZzZzZzZzZzZzZzZzZOHYxIcjEOYDYJxYxZxZxZxZxZxZxZxZx', 'John', 'Doe', 'US', 'system', 'Employee'),
('user2@flowservice.com', '$2a$11$F1YqZzZzZzZzZzZzZzZzZOHYxIcjEOYDYJxYxZxZxZxZxZxZxZxZx', 'Jane', 'Smith', 'CA', 'system', 'Manager');

-- Insert sample roles
INSERT INTO "Roles" ("Name", "Description", "CreatedUser") VALUES
('Administrator', 'Full system access', 'system'),
('Manager', 'Management level access', 'system'),
('Employee', 'Standard employee access', 'system'),
('Viewer', 'Read-only access', 'system');

-- Insert sample user roles
INSERT INTO "UserRoles" ("UserId", "RoleId", "AssignedBy") VALUES
(1, 1, 'system'), -- dev@flowservice.com -> Administrator
(2, 1, 'system'); -- admin@flowservice.com -> Administrator

-- Insert sample skills
INSERT INTO "Skills" ("Name", "Description", "Category", "CreatedUser") VALUES
('JavaScript', 'JavaScript programming language', 'Programming', 'system'),
('React', 'React.js framework', 'Frontend', 'system'),
('.NET Core', 'Microsoft .NET Core framework', 'Backend', 'system'),
('PostgreSQL', 'PostgreSQL database management', 'Database', 'system'),
('Project Management', 'Managing projects and teams', 'Management', 'system');

-- Insert sample user skills
INSERT INTO "UserSkills" ("UserId", "SkillId", "ProficiencyLevel", "YearsOfExperience", "AssignedBy") VALUES
(1, 1, 'Expert', 5, 'system'),
(1, 2, 'Advanced', 3, 'system'),
(1, 3, 'Advanced', 4, 'system'),
(2, 5, 'Expert', 8, 'system');

-- Insert sample role skills
INSERT INTO "RoleSkills" ("RoleId", "SkillId", "AssignedBy", "Notes") VALUES
(3, 1, 'system', 'Required for development tasks'),
(3, 2, 'system', 'Frontend development'),
(2, 5, 'system', 'Management responsibilities');

-- Insert sample contact tags
INSERT INTO "ContactTags" ("Name", "Color", "Description") VALUES
('VIP Client', '#ef4444', 'Very important clients'),
('Prospect', '#f59e0b', 'Potential customers'),
('Partner', '#10b981', 'Business partners'),
('Supplier', '#3b82f6', 'Service suppliers');

-- Insert sample contacts
INSERT INTO "Contacts" ("Name", "Email", "Phone", "Company", "Position", "CreatedBy") VALUES
('Alice Johnson', 'alice@techcorp.com', '+1-555-0101', 'TechCorp Inc', 'CTO', 'dev@flowservice.com'),
('Bob Wilson', 'bob@designstudio.com', '+1-555-0102', 'Design Studio', 'Creative Director', 'dev@flowservice.com'),
('Carol Brown', 'carol@startup.io', '+1-555-0103', 'Startup.io', 'Founder', 'dev@flowservice.com'),
('David Lee', 'david@consulting.com', '+1-555-0104', 'Lee Consulting', 'Senior Consultant', 'dev@flowservice.com');

-- Insert sample contact tag assignments
INSERT INTO "ContactTagAssignments" ("ContactId", "TagId", "AssignedBy") VALUES
(1, 1, 'dev@flowservice.com'), -- Alice -> VIP Client
(2, 3, 'dev@flowservice.com'), -- Bob -> Partner
(3, 2, 'dev@flowservice.com'), -- Carol -> Prospect
(4, 4, 'dev@flowservice.com'); -- David -> Supplier

-- Insert sample contact notes
INSERT INTO "ContactNotes" ("ContactId", "Content", "CreatedBy") VALUES
(1, 'Initial meeting went very well. Interested in our premium services.', 'dev@flowservice.com'),
(1, 'Follow up call scheduled for next week.', 'dev@flowservice.com'),
(2, 'Great collaboration on the design project. Looking for long-term partnership.', 'dev@flowservice.com'),
(3, 'Startup with great potential. Currently evaluating our solution.', 'dev@flowservice.com');

-- Insert sample articles (materials)
INSERT INTO "Articles" ("Name", "Description", "Category", "Type", "Status", "SKU", "Stock", "CostPrice", "SellPrice", "CreatedBy") VALUES
('Laptop Dell XPS 13', 'High-performance ultrabook for development', 'Electronics', 'material', 'active', 'DELL-XPS13-001', 5, 1200.00, 1500.00, 'system'),
('Wireless Mouse', 'Ergonomic wireless mouse', 'Accessories', 'material', 'active', 'MOUSE-WL-001', 25, 25.00, 45.00, 'system'),
('Office Chair Pro', 'Ergonomic office chair with lumbar support', 'Furniture', 'material', 'active', 'CHAIR-PRO-001', 8, 300.00, 450.00, 'system');

-- Insert sample articles (services)
INSERT INTO "Articles" ("Name", "Description", "Category", "Type", "Status", "BasePrice", "Duration", "HourlyRate", "CreatedBy") VALUES
('Website Development', 'Custom website development service', 'Development', 'service', 'active', 5000.00, 160, 75.00, 'system'),
('IT Consultation', 'Technical consultation and advice', 'Consulting', 'service', 'active', 150.00, 2, 150.00, 'system'),
('Database Setup', 'Database design and setup service', 'Technical', 'service', 'active', 800.00, 16, 100.00, 'system');

-- Insert sample calendar events
INSERT INTO "calendar_events" ("Title", "Description", "Start", "End", "Type", "Status", "Priority", "created_by") VALUES
('Team Meeting', 'Weekly team sync meeting', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', 'meeting', 'scheduled', 'medium', gen_random_uuid()),
('Client Presentation', 'Presentation to TechCorp client', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '2 hours', 'meeting', 'confirmed', 'high', gen_random_uuid()),
('Project Deadline', 'Website project completion deadline', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '1 hour', 'task', 'scheduled', 'urgent', gen_random_uuid());

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '=====================================================================';
    RAISE NOTICE 'Development Setup Completed Successfully!';
    RAISE NOTICE '=====================================================================';
    RAISE NOTICE 'Sample Data Created:';
    RAISE NOTICE '• Admin Users: %', (SELECT COUNT(*) FROM "MainAdminUsers");
    RAISE NOTICE '• Regular Users: %', (SELECT COUNT(*) FROM "Users");
    RAISE NOTICE '• Roles: %', (SELECT COUNT(*) FROM "Roles");
    RAISE NOTICE '• Skills: %', (SELECT COUNT(*) FROM "Skills");
    RAISE NOTICE '• Contacts: %', (SELECT COUNT(*) FROM "Contacts");
    RAISE NOTICE '• Articles: %', (SELECT COUNT(*) FROM "Articles");
    RAISE NOTICE '• Calendar Events: %', (SELECT COUNT(*) FROM "calendar_events");
    RAISE NOTICE '=====================================================================';
    RAISE NOTICE 'Development Login Credentials:';
    RAISE NOTICE '• Email: dev@flowservice.com';
    RAISE NOTICE '• Email: admin@flowservice.com'; 
    RAISE NOTICE '• Password: password123 (for both)';
    RAISE NOTICE '• Note: Passwords are hashed - use actual auth API';
    RAISE NOTICE '=====================================================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Start the FlowServiceBackend application';
    RAISE NOTICE '2. Navigate to /api-docs for Swagger documentation';
    RAISE NOTICE '3. Use /api/dev/token to generate test tokens';
    RAISE NOTICE '4. Test API endpoints with sample data';
    RAISE NOTICE '=====================================================================';
END $$;
