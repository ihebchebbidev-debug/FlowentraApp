-- =============================================================================
-- Default lookup values + currencies + numbering (TenantId = 0 baseline)
-- =============================================================================
-- Run on EACH tenant PostgreSQL database after schema is in place.
--
-- Seeds logical defaults for every LookupType exposed by LookupsController /
-- LookupService.cs so that:
--   • Settings → Lookups has usable dropdowns on day one
--   • TenantSeeder can clone rows into new companies (source TenantId = 0)
--
-- LookupType strings MUST match LookupService exactly (kebab-case singular):
--   article-category, task-status, offer-status, service-order-status, …
--
-- Status lookups (offer/sale/service-order/dispatch) use Value = backend status
-- slug — aligned with src/config/entity-statuses/*.config.ts
--
-- TENANT ID RULE (same as roles migration):
--   Default company → TenantId = 0
--   Other company   → TenantId = N (Tenants.Id)
--
-- Safe to re-run: idempotent (NOT EXISTS per TenantId + LookupType + Name).
-- =============================================================================

DO $$
DECLARE
    p_TenantId       INTEGER := 0;
    p_tenants_row_id INTEGER := NULL;

    v_type_count     INTEGER;
    v_lookup_total   INTEGER;
    v_currency_count INTEGER;
    v_numbering_count INTEGER;

    -- Expected lookup types (must all have ≥1 row after seed)
    v_expected_types TEXT[] := ARRAY[
        'article-category', 'article-group', 'article-status',
        'country', 'dispatch-status', 'document-type', 'event-type',
        'expense-type', 'form-category', 'installation-category',
        'installation-type', 'leave-type', 'location',
        'offer-category', 'offer-source', 'offer-status',
        'priority', 'project-status', 'project-type',
        'sale-status', 'service-category', 'service-order-status',
        'skill', 'task-status', 'technician-status', 'work-type'
    ];
    v_missing_type   TEXT;
BEGIN
    IF p_tenants_row_id IS NOT NULL THEN
        SELECT CASE WHEN t."IsDefault" THEN 0 ELSE t."Id" END
        INTO p_TenantId
        FROM "Tenants" t
        WHERE t."Id" = p_tenants_row_id AND t."IsActive" = TRUE;

        IF p_TenantId IS NULL THEN
            RAISE EXCEPTION 'Tenants row % not found or inactive', p_tenants_row_id;
        END IF;
    END IF;

    RAISE NOTICE 'Seeding default lookups for data TenantId = %', p_TenantId;

    -- ─── Helper: bulk seed from VALUES ───────────────────────────────────────
    -- Columns: lookup_type, name, description, color, value, sort_order, is_default, is_paid, category
    INSERT INTO "LookupItems" (
        "TenantId", "LookupType", "Name", "Description", "Color", "Value",
        "SortOrder", "IsActive", "IsDeleted", "CreatedUser", "CreatedAt", "IsDefault", "IsPaid", "Category"
    )
    SELECT
        p_TenantId, v.lookup_type, v.name, v.description, v.color, v.value,
        v.sort_order, TRUE, FALSE, 'system', NOW(), v.is_default, v.is_paid, v.category
    FROM (VALUES
        -- ── Task statuses (Kanban) ───────────────────────────────────────────
        ('task-status', 'To Do',        'Not started yet',              '#64748b', 'todo',        1, TRUE,  NULL::boolean, NULL),
        ('task-status', 'In Progress',  'Currently being worked on',    '#3b82f6', 'in_progress', 2, FALSE, NULL,          NULL),
        ('task-status', 'Review',       'Awaiting review or approval',  '#f59e0b', 'review',      3, FALSE, NULL,          NULL),
        ('task-status', 'Done',         'Completed',                    '#10b981', 'done',        4, FALSE, NULL,          NULL),

        -- ── Priorities ───────────────────────────────────────────────────────
        ('priority', 'Low',    'Low priority — handle when capacity allows', '#84cc16', 'low',    1, FALSE, NULL, NULL),
        ('priority', 'Medium', 'Normal priority',                            '#3b82f6', 'medium', 2, TRUE,  NULL, NULL),
        ('priority', 'High',   'High priority — address soon',               '#f59e0b', 'high',   3, FALSE, NULL, NULL),
        ('priority', 'Urgent', 'Critical — immediate attention',             '#ef4444', 'urgent', 4, FALSE, NULL, NULL),

        -- ── Service categories (field / service business) ────────────────────
        ('service-category', 'Installation',  'New equipment or system installation', '#3b82f6', 'installation',  1, TRUE,  NULL, NULL),
        ('service-category', 'Maintenance',   'Preventive or scheduled maintenance',  '#10b981', 'maintenance',   2, FALSE, NULL, NULL),
        ('service-category', 'Repair',        'Break-fix and corrective work',        '#f59e0b', 'repair',        3, FALSE, NULL, NULL),
        ('service-category', 'Inspection',    'Audit, inspection, or compliance visit','#8b5cf6', 'inspection',    4, FALSE, NULL, NULL),
        ('service-category', 'Emergency',     'Urgent / after-hours call-out',        '#ef4444', 'emergency',     5, FALSE, NULL, NULL),

        -- ── Article categories ───────────────────────────────────────────────
        ('article-category', 'Products',          'Finished goods for sale',           '#3b82f6', 'products',          1, TRUE,  NULL, NULL),
        ('article-category', 'Parts & Materials', 'Components and consumables',        '#10b981', 'parts',             2, FALSE, NULL, NULL),
        ('article-category', 'Services',          'Billable labour or service items',  '#8b5cf6', 'services',          3, FALSE, NULL, NULL),
        ('article-category', 'Subscriptions',     'Recurring subscription products',     '#06b6d4', 'subscriptions',     4, FALSE, NULL, NULL),
        ('article-category', 'Equipment',         'Tools and capital equipment',       '#64748b', 'equipment',         5, FALSE, NULL, NULL),

        -- ── Article statuses ─────────────────────────────────────────────────
        ('article-status', 'Active',        'Available for sale or use',     '#10b981', 'active',        1, TRUE,  NULL, NULL),
        ('article-status', 'Inactive',      'Temporarily unavailable',       '#64748b', 'inactive',      2, FALSE, NULL, NULL),
        ('article-status', 'Discontinued',  'No longer offered',             '#ef4444', 'discontinued',  3, FALSE, NULL, NULL),
        ('article-status', 'Out of Stock',  'Awaiting replenishment',        '#f59e0b', 'out_of_stock',  4, FALSE, NULL, NULL),

        -- ── Article groups (inventory grouping) ──────────────────────────────
        ('article-group', 'Standard',    'Default product line',              '#64748b', 'standard',    1, TRUE,  NULL, NULL),
        ('article-group', 'Premium',     'Premium / high-margin items',       '#8b5cf6', 'premium',     2, FALSE, NULL, NULL),
        ('article-group', 'Bundle',      'Packaged multi-item offers',        '#3b82f6', 'bundle',      3, FALSE, NULL, NULL),
        ('article-group', 'Spare Parts', 'Replacement and spare components',  '#10b981', 'spare_parts', 4, FALSE, NULL, NULL),

        -- ── Locations (warehouses / sites — customize per company) ───────────
        ('location', 'Main Office',   'Head office / primary site',     '#3b82f6', 'main_office',   1, TRUE,  NULL, NULL),
        ('location', 'Warehouse',     'Central stock location',         '#10b981', 'warehouse',     2, FALSE, NULL, NULL),
        ('location', 'Workshop',      'Internal workshop or depot',     '#f59e0b', 'workshop',      3, FALSE, NULL, NULL),
        ('location', 'Customer Site', 'On-site at customer premises',   '#8b5cf6', 'customer_site', 4, FALSE, NULL, NULL),

        -- ── Leave types (HR) ─────────────────────────────────────────────────
        ('leave-type', 'Annual Leave',   'Paid vacation / annual entitlement', '#3b82f6', 'annual',    1, FALSE, TRUE,  NULL),
        ('leave-type', 'Sick Leave',     'Paid sick absence',                  '#ef4444', 'sick',      2, FALSE, TRUE,  NULL),
        ('leave-type', 'Unpaid Leave',   'Leave without pay',                  '#64748b', 'unpaid',    3, FALSE, FALSE, NULL),
        ('leave-type', 'Personal Day',   'Short personal absence',             '#f59e0b', 'personal',  4, FALSE, TRUE,  NULL),
        ('leave-type', 'Parental Leave', 'Maternity / paternity / parental',   '#8b5cf6', 'parental',  5, FALSE, TRUE,  NULL),

        -- ── Offer / sales pipeline categories ────────────────────────────────
        ('offer-category', 'New Business',  'First-time customer opportunity',  '#3b82f6', 'new_business', 1, TRUE,  NULL, NULL),
        ('offer-category', 'Renewal',       'Contract or subscription renewal', '#10b981', 'renewal',      2, FALSE, NULL, NULL),
        ('offer-category', 'Upsell',        'Expansion with existing customer', '#8b5cf6', 'upsell',       3, FALSE, NULL, NULL),
        ('offer-category', 'Project Quote', 'Fixed-scope project quotation',    '#f59e0b', 'project',      4, FALSE, NULL, NULL),

        -- ── Lead / offer sources ─────────────────────────────────────────────
        ('offer-source', 'Website',            'Inbound from company website',   '#3b82f6', 'website',     1, FALSE, NULL, NULL),
        ('offer-source', 'Referral',           'Referred by existing contact',   '#10b981', 'referral',    2, FALSE, NULL, NULL),
        ('offer-source', 'Cold Outreach',      'Outbound sales prospecting',     '#64748b', 'cold',        3, FALSE, NULL, NULL),
        ('offer-source', 'Trade Show',         'Event or exhibition lead',       '#f59e0b', 'trade_show',  4, FALSE, NULL, NULL),
        ('offer-source', 'Partner',            'Partner or reseller channel',    '#8b5cf6', 'partner',     5, FALSE, NULL, NULL),
        ('offer-source', 'Existing Customer',  'Repeat business / cross-sell',   '#06b6d4', 'existing',    6, TRUE,  NULL, NULL),

        -- ── Installation categories ──────────────────────────────────────────
        ('installation-category', 'HVAC',        'Heating, ventilation, air conditioning', '#f59e0b', 'hvac',        1, TRUE,  NULL, NULL),
        ('installation-category', 'Electrical',  'Electrical systems and wiring',            '#8b5cf6', 'electrical',  2, FALSE, NULL, NULL),
        ('installation-category', 'Plumbing',    'Plumbing and water systems',               '#06b6d4', 'plumbing',    3, FALSE, NULL, NULL),
        ('installation-category', 'Security',    'Security and access control',              '#ef4444', 'security',    4, FALSE, NULL, NULL),
        ('installation-category', 'Network',     'Network and connectivity',                 '#10b981', 'network',     5, FALSE, NULL, NULL),
        ('installation-category', 'Server / IT', 'Server and IT infrastructure',             '#3b82f6', 'server',      6, FALSE, NULL, NULL),
        ('installation-category', 'Other',       'Other installation types',                 '#64748b', 'other',       7, FALSE, NULL, NULL),

        -- ── Installation types ───────────────────────────────────────────────
        ('installation-type', 'New Install',   'Brand-new installation',              '#3b82f6', 'new',           1, TRUE,  NULL, NULL),
        ('installation-type', 'Upgrade',       'Upgrade of existing installation',    '#10b981', 'upgrade',       2, FALSE, NULL, NULL),
        ('installation-type', 'Replacement',   'Replace failed or end-of-life unit',  '#f59e0b', 'replacement',   3, FALSE, NULL, NULL),
        ('installation-type', 'Decommission',  'Remove or decommission equipment',    '#64748b', 'decommission',  4, FALSE, NULL, NULL),

        -- ── Work types (time tracking) ───────────────────────────────────────
        ('work-type', 'Billable',     'Chargeable client work',        '#10b981', 'billable',     1, TRUE,  NULL, NULL),
        ('work-type', 'Non-Billable', 'Internal non-chargeable work',  '#64748b', 'non_billable', 2, FALSE, NULL, NULL),
        ('work-type', 'Travel',       'Travel time to/from site',      '#3b82f6', 'travel',       3, FALSE, NULL, NULL),
        ('work-type', 'Training',     'Training and certification',    '#8b5cf6', 'training',     4, FALSE, NULL, NULL),

        -- ── Expense types ────────────────────────────────────────────────────
        ('expense-type', 'Materials',      'Parts and materials purchased on job', '#3b82f6', 'materials',      1, FALSE, NULL, NULL),
        ('expense-type', 'Travel',         'Transport, fuel, parking',             '#10b981', 'travel',         2, FALSE, NULL, NULL),
        ('expense-type', 'Accommodation',  'Hotels and lodging',                   '#8b5cf6', 'accommodation',  3, FALSE, NULL, NULL),
        ('expense-type', 'Tools',          'Tools and small equipment',            '#f59e0b', 'tools',          4, FALSE, NULL, NULL),
        ('expense-type', 'Subcontractor',  'Third-party subcontractor costs',      '#06b6d4', 'subcontractor',  5, FALSE, NULL, NULL),
        ('expense-type', 'Other',          'Miscellaneous expenses',               '#64748b', 'other',          6, FALSE, NULL, NULL),

        -- ── Project types ────────────────────────────────────────────────────
        ('project-type', 'Service',       'Customer service delivery project', '#3b82f6', 'service',   1, TRUE,  NULL, NULL),
        ('project-type', 'Sales',         'Sales-driven implementation',       '#10b981', 'sales',     2, FALSE, NULL, NULL),
        ('project-type', 'Internal',      'Internal improvement project',      '#64748b', 'internal',  3, FALSE, NULL, NULL),
        ('project-type', 'Installation',  'Multi-site installation rollout',   '#f59e0b', 'install',   4, FALSE, NULL, NULL),

        -- ── Project statuses ─────────────────────────────────────────────────
        ('project-status', 'Planning',   'Scope and planning phase',     '#64748b', 'planning',   1, TRUE,  NULL, NULL),
        ('project-status', 'Active',     'Work in progress',             '#3b82f6', 'active',     2, FALSE, NULL, NULL),
        ('project-status', 'On Hold',    'Paused — waiting on input',    '#f59e0b', 'on_hold',    3, FALSE, NULL, NULL),
        ('project-status', 'Completed',  'Successfully delivered',       '#10b981', 'completed',  4, FALSE, NULL, NULL),
        ('project-status', 'Cancelled',  'Cancelled before completion',  '#ef4444', 'cancelled',  5, FALSE, NULL, NULL),

        -- ── Event types (calendar) ───────────────────────────────────────────
        ('event-type', 'Meeting',    'Internal or client meeting',     '#3b82f6', 'meeting',    1, TRUE,  NULL, NULL),
        ('event-type', 'Call',       'Phone or video call',            '#10b981', 'call',       2, FALSE, NULL, NULL),
        ('event-type', 'Site Visit', 'On-site customer visit',         '#f59e0b', 'site_visit', 3, FALSE, NULL, NULL),
        ('event-type', 'Training',   'Training session',               '#8b5cf6', 'training',   4, FALSE, NULL, NULL),
        ('event-type', 'Reminder',   'General reminder',               '#64748b', 'reminder',   5, FALSE, NULL, NULL),

        -- ── Form categories (dynamic forms) ──────────────────────────────────
        ('form-category', 'Customer',    'Forms filled by customers',       '#3b82f6', 'customer',    1, FALSE, NULL, NULL),
        ('form-category', 'Internal',    'Internal staff checklists',       '#64748b', 'internal',    2, FALSE, NULL, NULL),
        ('form-category', 'Inspection',  'Site inspection forms',           '#f59e0b', 'inspection',  3, FALSE, NULL, NULL),
        ('form-category', 'Compliance',  'Regulatory / compliance forms',   '#ef4444', 'compliance',  4, FALSE, NULL, NULL),

        -- ── Document types ───────────────────────────────────────────────────
        ('document-type', 'Contract',     'Signed contracts and agreements', '#3b82f6', 'contract',     1, FALSE, NULL, NULL),
        ('document-type', 'Invoice',      'Invoices and billing documents',  '#10b981', 'invoice',      2, FALSE, NULL, NULL),
        ('document-type', 'Report',       'Service or inspection reports',   '#8b5cf6', 'report',       3, FALSE, NULL, NULL),
        ('document-type', 'Photo',        'Site photos and evidence',        '#f59e0b', 'photo',        4, FALSE, NULL, NULL),
        ('document-type', 'Certificate',  'Certificates and compliance docs','#06b6d4', 'certificate',  5, FALSE, NULL, NULL),
        ('document-type', 'Manual',       'User manuals and technical docs', '#64748b', 'manual',       6, FALSE, NULL, NULL),

        -- ── Technician statuses (dispatcher / field) ─────────────────────────
        ('technician-status', 'Available',  'Ready to accept new jobs',     '#10b981', 'available',  1, TRUE,  NULL, NULL),
        ('technician-status', 'On Job',     'Currently on a service call',  '#3b82f6', 'on_job',     2, FALSE, NULL, NULL),
        ('technician-status', 'On Break',   'Temporarily unavailable',      '#f59e0b', 'on_break',   3, FALSE, NULL, NULL),
        ('technician-status', 'Off Duty',   'End of shift / not working',   '#64748b', 'off_duty',   4, FALSE, NULL, NULL),
        ('technician-status', 'Sick',       'Sick leave',                   '#ef4444', 'sick',       5, FALSE, NULL, NULL),

        -- ── Skills (technician competencies — Category = domain) ───────────────
        ('skill', 'HVAC',              'Heating and cooling systems',        '#f59e0b', 'hvac',              1, FALSE, NULL, 'Technical'),
        ('skill', 'Electrical',        'Electrical installation and repair', '#8b5cf6', 'electrical',        2, FALSE, NULL, 'Technical'),
        ('skill', 'Plumbing',          'Plumbing systems',                   '#06b6d4', 'plumbing',          3, FALSE, NULL, 'Technical'),
        ('skill', 'Refrigeration',     'Commercial refrigeration',           '#3b82f6', 'refrigeration',     4, FALSE, NULL, 'Technical'),
        ('skill', 'Network / IT',      'Network and IT support',             '#6366f1', 'network_it',        5, FALSE, NULL, 'Technical'),
        ('skill', 'Customer Service',  'Client communication',               '#10b981', 'customer_service',  6, FALSE, NULL, 'Soft Skills'),
        ('skill', 'Safety / HSE',      'Health, safety, environment',        '#ef4444', 'safety',            7, FALSE, NULL, 'Compliance'),
        ('skill', 'Team Lead',         'Supervision and coordination',       '#64748b', 'team_lead',         8, FALSE, NULL, 'Management'),

        -- ── Countries (Value = ISO 3166-1 alpha-2) ───────────────────────────
        ('country', 'Tunisia',        'Republic of Tunisia',          NULL,      'TN', 1, TRUE,  NULL, NULL),
        ('country', 'France',         'French Republic',              NULL,      'FR', 2, FALSE, NULL, NULL),
        ('country', 'Germany',        'Federal Republic of Germany',  NULL,      'DE', 3, FALSE, NULL, NULL),
        ('country', 'United Kingdom', 'United Kingdom of GB and NI',  NULL,      'GB', 4, FALSE, NULL, NULL),
        ('country', 'United States',  'United States of America',     NULL,      'US', 5, FALSE, NULL, NULL),
        ('country', 'Canada',         'Canada',                       NULL,      'CA', 6, FALSE, NULL, NULL),

        -- ── Offer statuses (entity-statuses/offer.config.ts) ───────────────────
        ('offer-status', 'Draft',     'Offer being prepared',              '#64748b', 'draft',     1, TRUE,  NULL, NULL),
        ('offer-status', 'Sent',      'Sent to customer',                  '#3b82f6', 'sent',      2, FALSE, NULL, NULL),
        ('offer-status', 'Accepted',  'Customer accepted — won',           '#10b981', 'accepted',  3, FALSE, NULL, NULL),
        ('offer-status', 'Declined',  'Customer declined — lost',            '#ef4444', 'declined',  4, FALSE, NULL, NULL),
        ('offer-status', 'Modified',  'Revised after customer feedback',   '#f59e0b', 'modified',  5, FALSE, NULL, NULL),
        ('offer-status', 'Cancelled', 'Cancelled before decision',         '#64748b', 'cancelled', 6, FALSE, NULL, NULL),

        -- ── Sale statuses (entity-statuses/sale.config.ts) ───────────────────
        ('sale-status', 'Created',            'Sale record created',              '#64748b', 'created',            1, TRUE,  NULL, NULL),
        ('sale-status', 'In Progress',        'Active fulfilment',                '#3b82f6', 'in_progress',        2, FALSE, NULL, NULL),
        ('sale-status', 'Partially Invoiced', 'Some lines invoiced',              '#f59e0b', 'partially_invoiced', 3, FALSE, NULL, NULL),
        ('sale-status', 'Invoiced',           'Fully invoiced',                   '#8b5cf6', 'invoiced',           4, FALSE, NULL, NULL),
        ('sale-status', 'Closed',             'Completed and closed',             '#10b981', 'closed',             5, FALSE, NULL, NULL),
        ('sale-status', 'Cancelled',          'Cancelled sale',                   '#ef4444', 'cancelled',          6, FALSE, NULL, NULL),

        -- ── Service order statuses (entity-statuses/service-order.config.ts) ───
        ('service-order-status', 'Draft',                 'Draft service order',                    '#64748b', 'draft',                 1,  FALSE, NULL, NULL),
        ('service-order-status', 'Pending',               'Awaiting triage',                        '#f59e0b', 'pending',               2,  TRUE,  NULL, NULL),
        ('service-order-status', 'Ready for Planning',  'Ready to be scheduled',                  '#3b82f6', 'ready_for_planning',    3,  FALSE, NULL, NULL),
        ('service-order-status', 'Scheduled',           'Visit scheduled',                        '#6366f1', 'scheduled',             4,  FALSE, NULL, NULL),
        ('service-order-status', 'In Progress',         'Work underway on site',                  '#3b82f6', 'in_progress',           5,  FALSE, NULL, NULL),
        ('service-order-status', 'On Hold',             'Paused — blocked or waiting',            '#f59e0b', 'on_hold',               6,  FALSE, NULL, NULL),
        ('service-order-status', 'Partially Completed', 'Some dispatches done',                   '#f59e0b', 'partially_completed',   7,  FALSE, NULL, NULL),
        ('service-order-status', 'Technically Completed','Field work finished',                   '#10b981', 'technically_completed', 8,  FALSE, NULL, NULL),
        ('service-order-status', 'Ready for Invoice',   'Awaiting billing',                       '#8b5cf6', 'ready_for_invoice',     9,  FALSE, NULL, NULL),
        ('service-order-status', 'Invoiced',            'Invoice issued',                         '#6366f1', 'invoiced',              10, FALSE, NULL, NULL),
        ('service-order-status', 'Closed',              'Closed — fully complete',                '#10b981', 'closed',                11, FALSE, NULL, NULL),
        ('service-order-status', 'Cancelled',           'Cancelled service order',                '#ef4444', 'cancelled',             12, FALSE, NULL, NULL),

        -- ── Dispatch statuses (entity-statuses/dispatch.config.ts) ─────────────
        ('dispatch-status', 'Pending',     'Created — not yet planned',        '#64748b', 'pending',     1, TRUE,  NULL, NULL),
        ('dispatch-status', 'Planned',     'Scheduled date assigned',            '#3b82f6', 'planned',     2, FALSE, NULL, NULL),
        ('dispatch-status', 'Assigned',    'Technician assigned',                '#6366f1', 'assigned',    3, FALSE, NULL, NULL),
        ('dispatch-status', 'Confirmed',   'Technician confirmed attendance',    '#10b981', 'confirmed',   4, FALSE, NULL, NULL),
        ('dispatch-status', 'Rejected',    'Technician declined the dispatch',   '#ef4444', 'rejected',    5, FALSE, NULL, NULL),
        ('dispatch-status', 'In Progress', 'Technician on site / working',       '#3b82f6', 'in_progress', 6, FALSE, NULL, NULL),
        ('dispatch-status', 'Completed',   'Dispatch finished successfully',     '#10b981', 'completed',   7, FALSE, NULL, NULL),
        ('dispatch-status', 'Cancelled',   'Dispatch cancelled',                 '#64748b', 'cancelled',   8, FALSE, NULL, NULL)

    ) AS v(lookup_type, name, description, color, value, sort_order, is_default, is_paid, category)
    WHERE NOT EXISTS (
        SELECT 1 FROM "LookupItems" li
        WHERE li."TenantId" = p_TenantId
          AND li."LookupType" = v.lookup_type
          AND li."Name" = v.name
          AND li."IsDeleted" = FALSE
    );

    GET DIAGNOSTICS v_lookup_total = ROW_COUNT;
    RAISE NOTICE 'LookupItems inserted (this run): %', v_lookup_total;

    -- ─── Currencies (separate table — cloned by TenantSeeder) ────────────────
    INSERT INTO "Currencies" (
        "TenantId", "Code", "Name", "Symbol",
        "IsActive", "IsDefault", "SortOrder", "CreatedUser", "CreatedAt", "IsDeleted"
    )
    SELECT p_TenantId, v.code, v.name, v.symbol, TRUE, v.is_default, v.sort_order, 'system', NOW(), FALSE
    FROM (VALUES
        ('TND', 'Tunisian Dinar',  'د.ت', TRUE,  0),
        ('EUR', 'Euro',            '€',   FALSE, 1),
        ('USD', 'US Dollar',       '$',   FALSE, 2),
        ('GBP', 'British Pound',   '£',   FALSE, 3)
    ) AS v(code, name, symbol, is_default, sort_order)
    WHERE NOT EXISTS (
        SELECT 1 FROM "Currencies" c
        WHERE c."TenantId" = p_TenantId
          AND c."Code" = v.code
          AND c."IsDeleted" = FALSE
    );

    GET DIAGNOSTICS v_currency_count = ROW_COUNT;
    RAISE NOTICE 'Currencies inserted (this run): %', v_currency_count;

    -- ─── Numbering settings (document numbers — cloned by TenantSeeder) ──────
    INSERT INTO "NumberingSettings" (
        "TenantId", "entity_name", "is_enabled", "template",
        "strategy", "reset_frequency", "start_value", "padding",
        "created_at", "updated_at"
    )
    SELECT
        p_TenantId, v.entity_name, FALSE, v.template,
        v.strategy, v.reset_frequency, 1, 6, NOW(), NOW()
    FROM (VALUES
        ('Offer',        'OFR-{YEAR}-{SEQ:6}',  'atomic_counter', 'yearly'),
        ('Sale',         'SALE-{YEAR}-{SEQ:6}', 'atomic_counter', 'yearly'),
        ('ServiceOrder', 'SO-{YEAR}-{SEQ:6}',   'atomic_counter', 'yearly'),
        ('Dispatch',     'DISP-{YEAR}-{SEQ:6}', 'atomic_counter', 'yearly')
    ) AS v(entity_name, template, strategy, reset_frequency)
    WHERE NOT EXISTS (
        SELECT 1 FROM "NumberingSettings" ns
        WHERE ns."TenantId" = p_TenantId
          AND ns."entity_name" = v.entity_name
    );

    GET DIAGNOSTICS v_numbering_count = ROW_COUNT;
    RAISE NOTICE 'NumberingSettings inserted (this run): %', v_numbering_count;

    -- ─── Self-check: every expected LookupType must have rows ────────────────
    FOREACH v_missing_type IN ARRAY v_expected_types LOOP
        SELECT COUNT(*) INTO v_type_count
        FROM "LookupItems"
        WHERE "TenantId" = p_TenantId
          AND "LookupType" = v_missing_type
          AND "IsDeleted" = FALSE;

        IF v_type_count = 0 THEN
            RAISE EXCEPTION 'Self-check failed: LookupType "%" has 0 rows for TenantId %',
                v_missing_type, p_TenantId;
        END IF;
    END LOOP;

    SELECT COUNT(*) INTO v_lookup_total
    FROM "LookupItems"
    WHERE "TenantId" = p_TenantId AND "IsDeleted" = FALSE;

    RAISE NOTICE '✅ Lookup seed complete — % total LookupItems for TenantId %', v_lookup_total, p_TenantId;
END $$;

-- ─── Verification (optional — run manually) ─────────────────────────────────
-- SELECT "LookupType", COUNT(*) AS cnt
-- FROM "LookupItems"
-- WHERE "TenantId" = 0 AND "IsDeleted" = FALSE
-- GROUP BY "LookupType"
-- ORDER BY "LookupType";
