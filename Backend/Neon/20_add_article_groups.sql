-- ============================================================================
-- Migration: Add Article Group Support
-- Date: 2026-02-20
-- Description: Adds GroupId column to Articles table to support grouping
-- using the existing Lookups system (similar to Location)
-- ============================================================================

-- Add GroupId column to Articles table
ALTER TABLE Articles
ADD GroupId INT NULL;

-- Add foreign key constraint to reference LookupItems table
ALTER TABLE Articles
ADD CONSTRAINT FK_Articles_LookupItems_GroupId
FOREIGN KEY (GroupId) REFERENCES LookupItems(Id)
ON DELETE SET NULL;

-- Create index for performance optimization
CREATE INDEX IX_Articles_GroupId ON Articles(GroupId);

-- Seed default article groups (optional - can be modified per client needs)
INSERT INTO LookupItems (Category, LookupType, Name, DisplayOrder, IsActive, CreatedDate, CreatedUser, SortOrder)
VALUES
    ('article-group', 'article-group', 'Default Group', 1, 1, NOW(), 'system', 1),
    ('article-group', 'article-group', 'Special Items', 2, 1, NOW(), 'system', 2),
    ('article-group', 'article-group', 'Emergency Items', 3, 1, NOW(), 'system', 3),
    ('article-group', 'article-group', 'Consumables', 4, 1, NOW(), 'system', 4),
    ('article-group', 'article-group', 'Equipment', 5, 1, NOW(), 'system', 5);

-- Verify the migration
SELECT COUNT(*) as TotalGroups FROM LookupItems WHERE LookupType = 'article-group';
SELECT TOP 3 * FROM LookupItems WHERE LookupType = 'article-group' ORDER BY DisplayOrder;

-- ============================================================================
-- Rollback Script (if needed):
-- ============================================================================
-- DROP INDEX IX_Articles_GroupId ON Articles;
-- ALTER TABLE Articles DROP CONSTRAINT FK_Articles_LookupItems_GroupId;
-- ALTER TABLE Articles DROP COLUMN GroupId;
-- DELETE FROM LookupItems WHERE LookupType = 'article-group';
