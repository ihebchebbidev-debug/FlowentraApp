-- Migration: Remove ArticleGroups table and use Lookups system instead
-- Date: 2026-02-21
-- Purpose: Consolidate ArticleGroups into the generic Lookups system
--          Articles.GroupId will now point to LookupItems.Id where LookupType='article-groups'

-- Step 1: Drop the foreign key constraint
ALTER TABLE "Articles" DROP CONSTRAINT IF EXISTS "FK_Articles_ArticleGroups_GroupId";

-- Step 2: Drop the index on GroupId (it will still work as a regular column)
DROP INDEX IF EXISTS "IX_Articles_GroupId";

-- Step 3: Migrate existing ArticleGroups data to LookupItems
-- This preserves existing group associations
INSERT INTO "LookupItems" ("LookupType", "Name", "Description", "IsActive", "SortOrder", "CreatedDate", "CreatedUser", "ModifyDate", "ModifyUser", "Color")
SELECT 
    'article-groups' AS "LookupType",
    "Name",
    "Description",
    "IsActive",
    0 AS "SortOrder",
    "CreatedDate",
    NULL AS "CreatedUser",
    NOW() AS "ModifyDate",
    NULL AS "ModifyUser",
    NULL AS "Color"
FROM "ArticleGroups" ag
WHERE NOT EXISTS (
    SELECT 1 FROM "LookupItems" li 
    WHERE li."LookupType" = 'article-groups' AND li."Name" = ag."Name"
);

-- Step 4: Drop the ArticleGroups table
DROP TABLE IF EXISTS "ArticleGroups";

-- Step 5: Add a comment explaining the change
COMMENT ON COLUMN "Articles"."GroupId" IS 'Foreign key to LookupItems table where LookupType=''article-groups''. Stores the lookup ID, not a reference to a separate ArticleGroups table.';
