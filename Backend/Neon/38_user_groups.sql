-- =====================================================
-- User Groups Module
-- Groups of users (many-to-many) scoped by tenant.
-- =====================================================

CREATE TABLE IF NOT EXISTS "UserGroups" (
    "Id"          SERIAL PRIMARY KEY,
    "TenantId"    INTEGER NOT NULL,
    "Name"        VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "IsActive"    BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDeleted"   BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedBy"   VARCHAR(100) DEFAULT 'system',
    "UpdatedAt"   TIMESTAMP WITH TIME ZONE,
    "ModifiedBy"  VARCHAR(100),
    UNIQUE ("TenantId", "Name")
);

CREATE TABLE IF NOT EXISTS "UserGroupMembers" (
    "Id"         SERIAL PRIMARY KEY,
    "TenantId"   INTEGER NOT NULL,
    "GroupId"    INTEGER NOT NULL,
    "UserId"     INTEGER NOT NULL,
    "IsActive"   BOOLEAN NOT NULL DEFAULT TRUE,
    "AssignedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "AssignedBy" VARCHAR(100),
    FOREIGN KEY ("GroupId") REFERENCES "UserGroups"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("UserId")  REFERENCES "Users"("Id")      ON DELETE CASCADE,
    UNIQUE ("GroupId", "UserId")
);

CREATE INDEX IF NOT EXISTS "idx_usergroups_tenant"       ON "UserGroups"("TenantId");
CREATE INDEX IF NOT EXISTS "idx_usergroups_isactive"     ON "UserGroups"("IsActive");
CREATE INDEX IF NOT EXISTS "idx_usergroupmembers_group"  ON "UserGroupMembers"("GroupId");
CREATE INDEX IF NOT EXISTS "idx_usergroupmembers_user"   ON "UserGroupMembers"("UserId");
CREATE INDEX IF NOT EXISTS "idx_usergroupmembers_tenant" ON "UserGroupMembers"("TenantId");
