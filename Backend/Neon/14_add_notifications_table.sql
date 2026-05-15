-- =====================================================
-- MIGRATION: 14_add_notifications_table.sql
-- DATE: 2026-01-21
-- DESCRIPTION: Creates the Notifications table for the 
-- notification system
-- =====================================================

-- =====================================================
-- 1. NOTIFICATIONS TABLE
-- =====================================================

-- Notifications Table (PascalCase to match Entity Framework)
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
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId" ON "Notifications"("UserId");
CREATE INDEX IF NOT EXISTS "IX_Notifications_IsRead" ON "Notifications"("IsRead");
CREATE INDEX IF NOT EXISTS "IX_Notifications_CreatedAt" ON "Notifications"("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId_IsRead" ON "Notifications"("UserId", "IsRead");

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

-- Verify table was created
SELECT 'Notifications table created successfully' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Notifications'
);

-- Show table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Notifications'
ORDER BY ordinal_position;

-- =====================================================
-- MIGRATION COMPLETE: 14_add_notifications_table.sql
-- =====================================================
