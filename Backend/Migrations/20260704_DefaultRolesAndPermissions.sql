-- =============================================================================
-- Default company roles + full permission catalog
-- =============================================================================
-- Run on EACH tenant PostgreSQL database after schema is in place.
--
-- Creates 4 standard roles every company needs:
--   • Administrator  — ALL 138 permissions granted (matches Grant All in API)
--   • Manager        — ALL 138 permissions granted
--   • Employee       — operational CRUD + limited read
--   • Viewer         — read-only
--
-- Permission catalog mirrors PermissionService.AvailablePermissions exactly:
--   Backend/Modules/Roles/Services/PermissionService.cs
--
-- TENANT ID RULE (critical — read before running):
--   Data-table TenantId is NOT always Tenants.Id (see TenantSlugCache.cs):
--     • Default company (Tenants.IsDefault = true)  → use TenantId = 0
--     • Any other company (Tenants.Id = N)        → use TenantId = N
--
--   Set p_tenant_id below, OR set p_tenants_row_id to look up automatically.
--
-- Safe to re-run: idempotent (NOT EXISTS + ON CONFLICT).
-- =============================================================================

-- ─── Multi-company fix: role names must be unique PER company, not globally ──
-- EF RoleConfiguration has HasIndex(Name).IsUnique() which breaks a 2nd company
-- in the same DB. This replaces it with a composite unique index.
DROP INDEX IF EXISTS "IX_Roles_Name";
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Roles_Name_TenantId"
    ON "Roles" ("Name", "TenantId");

-- ─── Configure target company ───────────────────────────────────────────────
DO $$
DECLARE
    -- Option A: set data TenantId directly (0 = default company)
    p_tenant_id INTEGER := 0;

    -- Option B: uncomment and set Tenants.Id — script resolves data TenantId
    -- p_tenants_row_id INTEGER := 1;

    p_tenants_row_id INTEGER := NULL;

    v_admin_id     INTEGER;
    v_manager_id   INTEGER;
    v_employee_id  INTEGER;
    v_viewer_id    INTEGER;

    v_catalog_count INTEGER;
    v_admin_granted INTEGER;
BEGIN
    -- Resolve data TenantId from Tenants row when Option B is used
    IF p_tenants_row_id IS NOT NULL THEN
        SELECT CASE WHEN t."IsDefault" THEN 0 ELSE t."Id" END
        INTO p_tenant_id
        FROM "Tenants" t
        WHERE t."Id" = p_tenants_row_id AND t."IsActive" = TRUE;

        IF p_tenant_id IS NULL THEN
            RAISE EXCEPTION 'Tenants row % not found or inactive', p_tenants_row_id;
        END IF;
    END IF;

    RAISE NOTICE 'Seeding default roles for data TenantId = %', p_tenant_id;

    -- ─── 1. Roles ────────────────────────────────────────────────────────────
    INSERT INTO "Roles" ("Name", "Description", "IsActive", "IsDeleted", "CreatedBy", "CreatedAt", "TenantId")
    SELECT v.name, v.description, TRUE, FALSE, 'system', NOW(), p_tenant_id
    FROM (VALUES
        ('Administrator', 'Full system access — all modules and actions'),
        ('Manager',       'Management access — full permissions by default'),
        ('Employee',      'Standard staff — create/view/edit on operational modules'),
        ('Viewer',        'Read-only access across modules')
    ) AS v(name, description)
    WHERE NOT EXISTS (
        SELECT 1 FROM "Roles" r
        WHERE r."Name" = v.name
          AND r."TenantId" = p_tenant_id
          AND r."IsDeleted" = FALSE
    );

    SELECT "Id" INTO v_admin_id
    FROM "Roles"
    WHERE "Name" = 'Administrator' AND "TenantId" = p_tenant_id AND "IsActive" = TRUE AND "IsDeleted" = FALSE
    LIMIT 1;

    SELECT "Id" INTO v_manager_id
    FROM "Roles"
    WHERE "Name" = 'Manager' AND "TenantId" = p_tenant_id AND "IsActive" = TRUE AND "IsDeleted" = FALSE
    LIMIT 1;

    SELECT "Id" INTO v_employee_id
    FROM "Roles"
    WHERE "Name" = 'Employee' AND "TenantId" = p_tenant_id AND "IsActive" = TRUE AND "IsDeleted" = FALSE
    LIMIT 1;

    SELECT "Id" INTO v_viewer_id
    FROM "Roles"
    WHERE "Name" = 'Viewer' AND "TenantId" = p_tenant_id AND "IsActive" = TRUE AND "IsDeleted" = FALSE
    LIMIT 1;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Administrator role could not be created for TenantId % (check IX_Roles_Name conflicts)', p_tenant_id;
    END IF;

    -- ─── 2. Full permission catalog — 138 rows, matches PermissionService ──
    CREATE TEMP TABLE _perm_catalog (
        module TEXT NOT NULL,
        action TEXT NOT NULL,
        PRIMARY KEY (module, action)
    ) ON COMMIT DROP;

    INSERT INTO _perm_catalog (module, action) VALUES
        ('contacts', 'create'), ('contacts', 'read'), ('contacts', 'update'), ('contacts', 'delete'),
        ('contacts', 'export'), ('contacts', 'import'), ('contacts', 'archive'), ('contacts', 'restore'),
        ('contacts', 'bulk_edit'), ('contacts', 'bulk_delete'), ('contacts', 'print'),
        ('articles', 'create'), ('articles', 'read'), ('articles', 'update'), ('articles', 'delete'),
        ('articles', 'export'), ('articles', 'import'), ('articles', 'archive'), ('articles', 'duplicate'),
        ('articles', 'bulk_edit'),
        ('offers', 'create'), ('offers', 'read'), ('offers', 'update'), ('offers', 'delete'),
        ('offers', 'export'), ('offers', 'approve'), ('offers', 'reject'), ('offers', 'send'),
        ('offers', 'print'), ('offers', 'duplicate'), ('offers', 'convert'), ('offers', 'archive'),
        ('sales', 'create'), ('sales', 'read'), ('sales', 'update'), ('sales', 'delete'),
        ('sales', 'export'), ('sales', 'approve'), ('sales', 'convert'), ('sales', 'archive'),
        ('sales', 'print'), ('sales', 'bulk_edit'),
        ('deals', 'create'), ('deals', 'read'), ('deals', 'update'), ('deals', 'delete'),
        ('purchases', 'create'), ('purchases', 'read'), ('purchases', 'update'), ('purchases', 'delete'),
        ('installations', 'create'), ('installations', 'read'), ('installations', 'update'), ('installations', 'delete'),
        ('installations', 'export'), ('installations', 'import'), ('installations', 'archive'),
        ('service_orders', 'create'), ('service_orders', 'read'), ('service_orders', 'update'), ('service_orders', 'delete'),
        ('service_orders', 'export'), ('service_orders', 'assign'), ('service_orders', 'approve'),
        ('service_orders', 'archive'), ('service_orders', 'print'), ('service_orders', 'convert'),
        ('dispatches', 'create'), ('dispatches', 'read'), ('dispatches', 'update'), ('dispatches', 'delete'),
        ('dispatches', 'assign'), ('dispatches', 'approve'),
        ('dispatcher', 'create'), ('dispatcher', 'read'), ('dispatcher', 'update'), ('dispatcher', 'delete'),
        ('dispatcher', 'assign'), ('dispatcher', 'manage'),
        ('time_tracking', 'create'), ('time_tracking', 'read'), ('time_tracking', 'update'), ('time_tracking', 'delete'),
        ('time_tracking', 'approve'), ('time_tracking', 'export'), ('time_tracking', 'view_all'), ('time_tracking', 'view_own'),
        ('expenses', 'create'), ('expenses', 'read'), ('expenses', 'update'), ('expenses', 'delete'),
        ('expenses', 'approve'), ('expenses', 'reject'), ('expenses', 'export'), ('expenses', 'view_all'), ('expenses', 'view_own'),
        ('stock_management', 'read'), ('stock_management', 'add_stock'), ('stock_management', 'remove_stock'), ('stock_management', 'read_logs'),
        ('users', 'create'), ('users', 'read'), ('users', 'update'), ('users', 'delete'),
        ('users', 'assign'), ('users', 'archive'), ('users', 'restore'), ('users', 'bulk_edit'),
        ('roles', 'create'), ('roles', 'read'), ('roles', 'update'), ('roles', 'delete'),
        ('roles', 'assign'), ('roles', 'manage'),
        ('settings', 'create'), ('settings', 'read'), ('settings', 'update'), ('settings', 'delete'),
        ('settings', 'configure'), ('settings', 'manage'), ('settings', 'switch_company'),
        ('audit_logs', 'read'), ('audit_logs', 'export'), ('audit_logs', 'delete'),
        ('documents', 'read'),
        ('dynamic_forms', 'create'), ('dynamic_forms', 'read'), ('dynamic_forms', 'update'), ('dynamic_forms', 'delete'),
        ('ai_assistant', 'read'),
        ('hr', 'create'), ('hr', 'read'), ('hr', 'update'), ('hr', 'delete'),
        ('external_endpoints', 'create'), ('external_endpoints', 'read'), ('external_endpoints', 'update'), ('external_endpoints', 'delete');

    SELECT COUNT(*) INTO v_catalog_count FROM _perm_catalog;
    IF v_catalog_count <> 138 THEN
        RAISE EXCEPTION 'Permission catalog count is %, expected 138 — aborting', v_catalog_count;
    END IF;

    -- ─── 3. Administrator + Manager → ALL permissions granted ────────────────
    INSERT INTO "RolePermissions" ("RoleId", "Module", "Action", "Granted", "CreatedAt", "CreatedBy", "TenantId")
    SELECT v_admin_id, c.module, c.action, TRUE, NOW(), 'system', p_tenant_id
    FROM _perm_catalog c
    ON CONFLICT ("RoleId", "Module", "Action")
    DO UPDATE SET "Granted" = TRUE, "UpdatedAt" = NOW(), "ModifiedBy" = 'system';

    IF v_manager_id IS NOT NULL THEN
        INSERT INTO "RolePermissions" ("RoleId", "Module", "Action", "Granted", "CreatedAt", "CreatedBy", "TenantId")
        SELECT v_manager_id, c.module, c.action, TRUE, NOW(), 'system', p_tenant_id
        FROM _perm_catalog c
        ON CONFLICT ("RoleId", "Module", "Action")
        DO UPDATE SET "Granted" = TRUE, "UpdatedAt" = NOW(), "ModifiedBy" = 'system';
    END IF;

    -- ─── 4. Employee → CRUD on business modules + read elsewhere ─────────────
    IF v_employee_id IS NOT NULL THEN
        INSERT INTO "RolePermissions" ("RoleId", "Module", "Action", "Granted", "CreatedAt", "CreatedBy", "TenantId")
        SELECT v_employee_id, c.module, c.action,
            CASE
                WHEN c.module IN (
                    'contacts', 'articles', 'offers', 'sales', 'deals', 'purchases',
                    'installations', 'service_orders', 'dispatches', 'dispatcher',
                    'time_tracking', 'expenses', 'stock_management', 'dynamic_forms', 'hr'
                ) AND c.action IN ('create', 'read', 'update', 'view_own', 'read_logs', 'add_stock', 'remove_stock')
                    THEN TRUE
                WHEN c.module IN ('documents', 'ai_assistant') AND c.action = 'read'
                    THEN TRUE
                WHEN c.module = 'settings' AND c.action = 'read'
                    THEN TRUE
                ELSE FALSE
            END,
            NOW(), 'system', p_tenant_id
        FROM _perm_catalog c
        ON CONFLICT ("RoleId", "Module", "Action")
        DO UPDATE SET "Granted" = EXCLUDED."Granted", "UpdatedAt" = NOW(), "ModifiedBy" = 'system';
    END IF;

    -- ─── 5. Viewer → read-only ───────────────────────────────────────────────
    IF v_viewer_id IS NOT NULL THEN
        INSERT INTO "RolePermissions" ("RoleId", "Module", "Action", "Granted", "CreatedAt", "CreatedBy", "TenantId")
        SELECT v_viewer_id, c.module, c.action,
            CASE WHEN c.action IN ('read', 'view_own', 'read_logs') THEN TRUE ELSE FALSE END,
            NOW(), 'system', p_tenant_id
        FROM _perm_catalog c
        ON CONFLICT ("RoleId", "Module", "Action")
        DO UPDATE SET "Granted" = EXCLUDED."Granted", "UpdatedAt" = NOW(), "ModifiedBy" = 'system';
    END IF;

    -- ─── 6. Self-check ───────────────────────────────────────────────────────
    SELECT COUNT(*) INTO v_admin_granted
    FROM "RolePermissions"
    WHERE "RoleId" = v_admin_id AND "Granted" = TRUE;

    IF v_admin_granted <> 138 THEN
        RAISE EXCEPTION 'Administrator has % granted permissions, expected 138', v_admin_granted;
    END IF;

    RAISE NOTICE 'OK — TenantId=% | Admin Id=% (% perms) | Manager Id=% | Employee Id=% | Viewer Id=%',
        p_tenant_id, v_admin_id, v_admin_granted, v_manager_id, v_employee_id, v_viewer_id;
END $$;

-- ─── Verification (uncomment to run) ─────────────────────────────────────────
-- SELECT r."TenantId", r."Name",
--        COUNT(*) FILTER (WHERE rp."Granted") AS granted,
--        COUNT(*) AS total_rows
-- FROM "Roles" r
-- LEFT JOIN "RolePermissions" rp ON rp."RoleId" = r."Id"
-- WHERE r."Name" IN ('Administrator', 'Manager', 'Employee', 'Viewer')
-- GROUP BY r."TenantId", r."Name"
-- ORDER BY 1, 2;
