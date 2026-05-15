-- =====================================================
-- Role Permissions Module Tables
-- =====================================================

-- Role Permissions Table
CREATE TABLE IF NOT EXISTS "RolePermissions" (
    "Id" SERIAL PRIMARY KEY,
    "RoleId" INTEGER NOT NULL,
    "Module" VARCHAR(50) NOT NULL,
    "Action" VARCHAR(50) NOT NULL,
    "Granted" BOOLEAN NOT NULL DEFAULT false,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE,
    "CreatedBy" VARCHAR(100) DEFAULT 'system',
    "ModifiedBy" VARCHAR(100),
    CONSTRAINT "FK_RolePermissions_Roles" FOREIGN KEY ("RoleId") 
        REFERENCES "Roles"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_RolePermissions_Role_Module_Action" UNIQUE ("RoleId", "Module", "Action")
);

-- Indexes for Role Permissions
CREATE INDEX IF NOT EXISTS "IX_RolePermissions_RoleId" ON "RolePermissions"("RoleId");
CREATE INDEX IF NOT EXISTS "IX_RolePermissions_Module_Action" ON "RolePermissions"("Module", "Action");

-- =====================================================
-- Helper Function: Check if user has a specific permission
-- Uses SECURITY DEFINER to avoid RLS recursion issues
-- =====================================================
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

-- =====================================================
-- Helper Function: Get all permissions for a user
-- Returns a table of module:action pairs
-- =====================================================
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

-- =====================================================
-- Seed default permissions for Administrator role
-- =====================================================
DO $$
DECLARE
    admin_role_id INTEGER;
    modules TEXT[] := ARRAY[
        'contacts', 'articles', 'offers', 'sales', 'calendar', 
        'planning', 'dispatches', 'installations', 'service_orders', 
        'projects', 'tasks', 'users', 'roles', 'skills', 
        'settings', 'reports', 'dashboard', 'notifications'
    ];
    actions_map JSONB := '{
        "contacts": ["view", "create", "edit", "delete", "export", "import"],
        "articles": ["view", "create", "edit", "delete", "export", "import"],
        "offers": ["view", "create", "edit", "delete", "export", "send", "approve"],
        "sales": ["view", "create", "edit", "delete", "export", "approve"],
        "calendar": ["view", "create", "edit", "delete"],
        "planning": ["view", "create", "edit", "delete", "assign"],
        "dispatches": ["view", "create", "edit", "delete", "assign", "complete"],
        "installations": ["view", "create", "edit", "delete", "schedule"],
        "service_orders": ["view", "create", "edit", "delete", "assign", "complete"],
        "projects": ["view", "create", "edit", "delete", "assign"],
        "tasks": ["view", "create", "edit", "delete", "assign", "complete"],
        "users": ["view", "create", "edit", "delete", "assign_roles"],
        "roles": ["view", "create", "edit", "delete", "manage_permissions"],
        "skills": ["view", "create", "edit", "delete", "assign"],
        "settings": ["view", "edit"],
        "reports": ["view", "create", "export"],
        "dashboard": ["view", "customize"],
        "notifications": ["view", "manage"]
    }';
    mod TEXT;
    act TEXT;
BEGIN
    -- Get Administrator role ID
    SELECT "Id" INTO admin_role_id FROM "Roles" WHERE "Name" = 'Administrator' AND "IsActive" = true LIMIT 1;
    
    -- If no Administrator role exists, create one
    IF admin_role_id IS NULL THEN
        INSERT INTO "Roles" ("Name", "Description", "IsActive", "CreatedBy")
        VALUES ('Administrator', 'Full system access with all permissions', true, 'system')
        RETURNING "Id" INTO admin_role_id;
    END IF;
    
    -- Grant all permissions to Administrator
    FOREACH mod IN ARRAY modules LOOP
        FOR act IN SELECT jsonb_array_elements_text(actions_map->mod) LOOP
            INSERT INTO "RolePermissions" ("RoleId", "Module", "Action", "Granted", "CreatedBy")
            VALUES (admin_role_id, mod, act, true, 'system')
            ON CONFLICT ("RoleId", "Module", "Action") DO UPDATE SET "Granted" = true;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Administrator role (ID: %) has been granted all permissions', admin_role_id;
END $$;
