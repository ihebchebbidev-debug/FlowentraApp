-- =====================================================
-- Contact ↔ User Group assignments (many-to-many)
-- Re-runnable: CREATE TABLE / INDEX IF NOT EXISTS.
-- =====================================================

CREATE TABLE IF NOT EXISTS "ContactUserGroups" (
    "Id"          SERIAL PRIMARY KEY,
    "TenantId"    INTEGER NOT NULL,
    "ContactId"   INTEGER NOT NULL,
    "UserGroupId" INTEGER NOT NULL,
    "AssignedAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "AssignedBy"  VARCHAR(100),
    FOREIGN KEY ("ContactId")   REFERENCES "Contacts"("Id")   ON DELETE CASCADE,
    FOREIGN KEY ("UserGroupId") REFERENCES "UserGroups"("Id") ON DELETE CASCADE,
    UNIQUE ("ContactId", "UserGroupId")
);

CREATE INDEX IF NOT EXISTS "idx_contactusergroups_contact" ON "ContactUserGroups"("ContactId");
CREATE INDEX IF NOT EXISTS "idx_contactusergroups_group"   ON "ContactUserGroups"("UserGroupId");
CREATE INDEX IF NOT EXISTS "idx_contactusergroups_tenant"  ON "ContactUserGroups"("TenantId");
