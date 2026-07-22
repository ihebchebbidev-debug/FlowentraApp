-- =====================================================================
-- MASTER MIGRATION — All schema fixes + all missing tables
-- Date: 2026-05-30  (idempotent — safe to run multiple times)
-- Combines:
--   • 20260530_SchemaFixes_And_MissingTables.sql
--   • 20260530_Comprehensive_Missing_Tables.sql
--   • 20260530_Supplement_Additional_Missing_Tables.sql
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- PART A: SCHEMA FIXES
-- ─────────────────────────────────────────────────────────────────────

-- FIX 1: GoodsReceipts.Status CHECK constraint
--   DB allowed: partial | received | rejected | closed
--   Code writes: partial | complete  ← constraint violation on full delivery
--   Fix: add 'complete' to the allowed set
DO $$
DECLARE cname text;
BEGIN
    SELECT conname INTO cname
      FROM pg_constraint
     WHERE conrelid = '"GoodsReceipts"'::regclass
       AND contype  = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%Status%';
    IF cname IS NOT NULL THEN
        EXECUTE format('ALTER TABLE "GoodsReceipts" DROP CONSTRAINT %I', cname);
    END IF;
END $$;

ALTER TABLE "GoodsReceipts"
    ADD CONSTRAINT "GoodsReceipts_Status_check"
    CHECK (("Status")::text = ANY (
        ARRAY['partial'::text, 'complete'::text, 'received'::text, 'rejected'::text, 'closed'::text]
    ));

-- FIX 2: ArticleSuppliers — drop erroneous per-column UNIQUE constraints
--   The composite UNIQUE (TenantId, ArticleId, SupplierId) is the correct one.
ALTER TABLE "ArticleSuppliers" DROP CONSTRAINT IF EXISTS "ArticleSuppliers_TenantId_key";
ALTER TABLE "ArticleSuppliers" DROP CONSTRAINT IF EXISTS "ArticleSuppliers_ArticleId_key";
ALTER TABLE "ArticleSuppliers" DROP CONSTRAINT IF EXISTS "ArticleSuppliers_SupplierId_key";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = '"ArticleSuppliers"'::regclass
           AND conname  = 'ArticleSuppliers_TenantId_ArticleId_SupplierId_key'
    ) THEN
        ALTER TABLE "ArticleSuppliers"
            ADD CONSTRAINT "ArticleSuppliers_TenantId_ArticleId_SupplierId_key"
            UNIQUE ("TenantId", "ArticleId", "SupplierId");
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "ux_article_suppliers_tenant_article_supplier"
    ON "ArticleSuppliers" ("TenantId", "ArticleId", "SupplierId")
    WHERE "IsDeleted" = FALSE;

-- COLUMN ADDITIONS: OverrunFlag / OverrunReason on TimeEntries
ALTER TABLE "TimeEntries"
    ADD COLUMN IF NOT EXISTS "OverrunFlag"   BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "OverrunReason" VARCHAR(500) NULL;

-- ─────────────────────────────────────────────────────────────────────
-- PART B: PLANNING MODULE (snake_case tables)
--   Pattern: id (lowercase), "TenantId" (quoted PascalCase), rest snake_case
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_leaves (
    id          SERIAL       PRIMARY KEY,
    "TenantId"  INTEGER      NOT NULL DEFAULT 0,
    user_id     INTEGER      NOT NULL,
    leave_type  VARCHAR(100) NOT NULL,
    start_date  TIMESTAMP    NOT NULL,
    end_date    TIMESTAMP    NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'approved',
    reason      TEXT,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_user_leaves_user_id" ON user_leaves (user_id);
CREATE INDEX IF NOT EXISTS "IX_user_leaves_dates"   ON user_leaves (start_date, end_date);
CREATE INDEX IF NOT EXISTS "IX_user_leaves_status"  ON user_leaves (status);

CREATE TABLE IF NOT EXISTS user_working_hours (
    id              SERIAL    PRIMARY KEY,
    "TenantId"      INTEGER   NOT NULL DEFAULT 0,
    user_id         INTEGER   NOT NULL,
    day_of_week     INTEGER   NOT NULL,
    start_time      TIME      NOT NULL,
    end_time        TIME      NOT NULL,
    is_active       BOOLEAN   NOT NULL DEFAULT TRUE,
    effective_from  TIMESTAMP,
    effective_until TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "UX_user_working_hours_user_day"
    ON user_working_hours (user_id, day_of_week);
CREATE INDEX IF NOT EXISTS "IX_user_working_hours_user_id" ON user_working_hours (user_id);

CREATE TABLE IF NOT EXISTS user_status_history (
    id              SERIAL      PRIMARY KEY,
    "TenantId"      INTEGER     NOT NULL DEFAULT 0,
    user_id         INTEGER     NOT NULL,
    new_status      VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50),
    reason          TEXT,
    changed_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    changed_by      INTEGER
);
CREATE INDEX IF NOT EXISTS "IX_user_status_history_user_id" ON user_status_history (user_id);

CREATE TABLE IF NOT EXISTS dispatch_history (
    id          SERIAL      PRIMARY KEY,
    "TenantId"  INTEGER     NOT NULL DEFAULT 0,
    dispatch_id VARCHAR(50) NOT NULL,
    action      VARCHAR(50) NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    changed_by  VARCHAR(50),
    changed_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    metadata    JSONB
);
CREATE INDEX IF NOT EXISTS "IX_dispatch_history_dispatch_id" ON dispatch_history (dispatch_id);
CREATE INDEX IF NOT EXISTS "IX_dispatch_history_TenantId"    ON dispatch_history ("TenantId");

CREATE TABLE IF NOT EXISTS technician_status_history (
    id            SERIAL      PRIMARY KEY,
    "TenantId"    INTEGER     NOT NULL DEFAULT 0,
    technician_id INTEGER     NOT NULL,
    status        VARCHAR(50) NOT NULL,
    changed_from  VARCHAR(50),
    changed_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
    changed_by    INTEGER,
    reason        TEXT,
    metadata      JSONB
);
CREATE INDEX IF NOT EXISTS "IX_technician_status_history_tech"
    ON technician_status_history (technician_id);
CREATE INDEX IF NOT EXISTS "IX_technician_status_history_TenantId"
    ON technician_status_history ("TenantId");

-- PlannedLineEntries
CREATE TABLE IF NOT EXISTS "PlannedLineEntries" (
    "Id"                SERIAL        PRIMARY KEY,
    "TenantId"          INTEGER       NOT NULL,
    "ParentType"        VARCHAR(30)   NOT NULL,
    "ParentId"          INTEGER       NOT NULL,
    "OriginOfferItemId" INTEGER,
    "Kind"              VARCHAR(20)   NOT NULL,
    "PlannedMinutes"    INTEGER,
    "TechnicianCount"   INTEGER,
    "HourlyRate"        DECIMAL(18,2),
    "ExpenseType"       VARCHAR(30),
    "PlannedAmount"     DECIMAL(18,2),
    "Currency"          VARCHAR(3),
    "Description"       VARCHAR(500),
    "CreatedAt"         TIMESTAMP     NOT NULL DEFAULT NOW(),
    "CreatedBy"         VARCHAR(100),
    "ModifiedAt"        TIMESTAMP,
    "ModifiedBy"        VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "IX_PlannedLineEntries_Parent"
    ON "PlannedLineEntries" ("TenantId", "ParentType", "ParentId");
CREATE INDEX IF NOT EXISTS "IX_PlannedLineEntries_Origin"
    ON "PlannedLineEntries" ("TenantId", "OriginOfferItemId");

-- planning_profiles + user_active_planning_profile
CREATE TABLE IF NOT EXISTS "planning_profiles" (
    "id"               SERIAL       PRIMARY KEY,
    "tenant_id"        INTEGER      NOT NULL,
    "owner_user_id"    VARCHAR(64)  NOT NULL,
    "name"             VARCHAR(120) NOT NULL,
    "description"      TEXT,
    "color"            VARCHAR(16),
    "icon"             VARCHAR(64),
    "is_shared"        BOOLEAN      NOT NULL DEFAULT FALSE,
    "visible_user_ids"  JSONB       NOT NULL DEFAULT '[]'::jsonb,
    "required_skill_ids" JSONB,
    "settings"         JSONB        NOT NULL DEFAULT '{}'::jsonb,
    "created_at"       TIMESTAMP    NOT NULL DEFAULT NOW(),
    "created_by"       VARCHAR(100),
    "updated_at"       TIMESTAMP    NOT NULL DEFAULT NOW(),
    "updated_by"       VARCHAR(100),
    "deleted_at"       TIMESTAMP,
    "deleted_by"       VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "idx_planning_profiles_tenant_owner"
    ON "planning_profiles" ("tenant_id", "owner_user_id") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_planning_profiles_tenant_shared"
    ON "planning_profiles" ("tenant_id", "is_shared") WHERE "deleted_at" IS NULL;

CREATE TABLE IF NOT EXISTS "user_active_planning_profile" (
    "user_id"    VARCHAR(64) NOT NULL,
    "tenant_id"  INTEGER     NOT NULL,
    "profile_id" INTEGER     NOT NULL REFERENCES "planning_profiles"("id") ON DELETE CASCADE,
    "updated_at" TIMESTAMP   NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("user_id", "tenant_id")
);
CREATE INDEX IF NOT EXISTS "idx_uapp_profile"
    ON "user_active_planning_profile" ("profile_id");

-- ─────────────────────────────────────────────────────────────────────
-- PART C: STOCK MODULE (snake_case, FK → "Articles")
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stock_transactions (
    id                SERIAL        PRIMARY KEY,
    "TenantId"        INTEGER       NOT NULL DEFAULT 0,
    article_id        INTEGER       NOT NULL,
    transaction_type  VARCHAR(50)   NOT NULL,
    quantity          DECIMAL(18,2) NOT NULL,
    previous_stock    DECIMAL(18,2) NOT NULL,
    new_stock         DECIMAL(18,2) NOT NULL,
    reason            VARCHAR(255),
    reference_type    VARCHAR(50),
    reference_id      VARCHAR(50),
    reference_number  VARCHAR(100),
    notes             TEXT,
    performed_by      VARCHAR(100)  NOT NULL,
    performed_by_name VARCHAR(200),
    ip_address        VARCHAR(45),
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_stock_transactions_Articles"
        FOREIGN KEY (article_id) REFERENCES "Articles"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_stock_transactions_article"
    ON stock_transactions ("TenantId", article_id);
CREATE INDEX IF NOT EXISTS "IX_stock_transactions_type"
    ON stock_transactions ("TenantId", transaction_type);
CREATE INDEX IF NOT EXISTS "IX_stock_transactions_created_at"
    ON stock_transactions (created_at);

-- ─────────────────────────────────────────────────────────────────────
-- PART D: PLUGIN REGISTRY
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activated_modules (
    id          SERIAL      PRIMARY KEY,
    "TenantId"  INTEGER     NOT NULL DEFAULT 0,
    plugin_code VARCHAR(40) NOT NULL,
    is_enabled  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_by  INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS "UX_activated_modules_tenant_code"
    ON activated_modules ("TenantId", plugin_code);
CREATE INDEX IF NOT EXISTS "IX_activated_modules_TenantId"
    ON activated_modules ("TenantId");

-- ─────────────────────────────────────────────────────────────────────
-- PART E: HR MODULE (hr_* snake_case tables)
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hr_departments (
    id          SERIAL       PRIMARY KEY,
    "TenantId"  INTEGER      NOT NULL DEFAULT 0,
    name        VARCHAR(150) NOT NULL DEFAULT '',
    code        VARCHAR(50),
    parent_id   INTEGER,
    manager_id  INTEGER,
    description TEXT,
    position    INTEGER,
    is_deleted  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_hr_departments_name" ON hr_departments (name);

CREATE TABLE IF NOT EXISTS hr_employee_salary_configs (
    id                      SERIAL        PRIMARY KEY,
    "TenantId"              INTEGER       NOT NULL DEFAULT 0,
    user_id                 INTEGER       NOT NULL,
    gross_salary            DECIMAL(14,3) NOT NULL DEFAULT 0,
    is_head_of_family       BOOLEAN       NOT NULL DEFAULT FALSE,
    children_count          INTEGER       NOT NULL DEFAULT 0,
    custom_deductions       DECIMAL(14,3),
    bank_account            VARCHAR(100),
    cnss_number             VARCHAR(100),
    hire_date               TIMESTAMP,
    department              VARCHAR(100),
    position                VARCHAR(100),
    employment_type         VARCHAR(50)   NOT NULL DEFAULT 'full_time',
    contract_type           VARCHAR(20),
    contract_end_date       TIMESTAMP,
    cin                     VARCHAR(50),
    birth_date              TIMESTAMP,
    marital_status          VARCHAR(20),
    address_line1           VARCHAR(200),
    address_line2           VARCHAR(200),
    city                    VARCHAR(100),
    postal_code             VARCHAR(20),
    emergency_contact_name  VARCHAR(200),
    emergency_contact_phone VARCHAR(30),
    created_at              TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "UX_hr_salary_config_user"
    ON hr_employee_salary_configs (user_id);

CREATE TABLE IF NOT EXISTS hr_attendance_settings (
    id                       SERIAL        PRIMARY KEY,
    "TenantId"               INTEGER       NOT NULL DEFAULT 0,
    work_days_json           TEXT          NOT NULL DEFAULT '[1,2,3,4,5]',
    standard_hours_per_day   DECIMAL(10,2) NOT NULL DEFAULT 8,
    overtime_threshold_hours DECIMAL(10,2) NOT NULL DEFAULT 8,
    overtime_multiplier      DECIMAL(10,2) NOT NULL DEFAULT 1.75,
    late_threshold_minutes   INTEGER       NOT NULL DEFAULT 15,
    rounding_method          VARCHAR(30)   NOT NULL DEFAULT '15min',
    calculation_method       VARCHAR(30)   NOT NULL DEFAULT 'actual_hours',
    created_at               TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_hr_attendance_settings_tenant
    ON hr_attendance_settings ("TenantId");

CREATE TABLE IF NOT EXISTS hr_cnss_rates (
    id                        SERIAL        PRIMARY KEY,
    "TenantId"                INTEGER       NOT NULL DEFAULT 0,
    effective_from            TIMESTAMP     NOT NULL DEFAULT NOW(),
    employee_rate             DECIMAL(8,6)  NOT NULL DEFAULT 0.0918,
    employer_rate             DECIMAL(8,6)  NOT NULL DEFAULT 0.1657,
    css_rate                  DECIMAL(8,6)  NOT NULL DEFAULT 0.01,
    salary_ceiling            DECIMAL(14,3) NOT NULL DEFAULT 0,
    abattement_head_of_family DECIMAL(14,3) NOT NULL DEFAULT 150,
    abattement_per_child      DECIMAL(14,3) NOT NULL DEFAULT 100,
    irpp_brackets_json        TEXT,
    is_active                 BOOLEAN       NOT NULL DEFAULT TRUE,
    notes                     VARCHAR(300),
    created_at                TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_public_holidays (
    id           SERIAL       PRIMARY KEY,
    "TenantId"   INTEGER      NOT NULL DEFAULT 0,
    date         TIMESTAMP    NOT NULL,
    name         VARCHAR(150) NOT NULL DEFAULT '',
    category     VARCHAR(50)  NOT NULL DEFAULT 'civil',
    is_recurring BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_hr_public_holidays_date" ON hr_public_holidays (date);

CREATE TABLE IF NOT EXISTS hr_attendance (
    id             SERIAL        PRIMARY KEY,
    "TenantId"     INTEGER       NOT NULL DEFAULT 0,
    user_id        INTEGER       NOT NULL,
    date           TIMESTAMP     NOT NULL,
    check_in       TIMESTAMP,
    check_out      TIMESTAMP,
    break_minutes  INTEGER       NOT NULL DEFAULT 0,
    total_hours    DECIMAL(10,2) NOT NULL DEFAULT 0,
    overtime_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    status         VARCHAR(40)   NOT NULL DEFAULT 'present',
    notes          TEXT,
    source         VARCHAR(40)   NOT NULL DEFAULT 'manual',
    created_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_hr_attendance_user_date UNIQUE ("TenantId", user_id, date)
);
CREATE INDEX IF NOT EXISTS "IX_hr_attendance_user_date" ON hr_attendance (user_id, date);
CREATE INDEX IF NOT EXISTS ix_hr_attendance_period ON hr_attendance ("TenantId", date, user_id);

CREATE TABLE IF NOT EXISTS hr_leave_balances (
    id               SERIAL        PRIMARY KEY,
    "TenantId"       INTEGER       NOT NULL DEFAULT 0,
    user_id          INTEGER       NOT NULL,
    year             INTEGER       NOT NULL,
    leave_type       VARCHAR(50)   NOT NULL DEFAULT 'annual',
    annual_allowance DECIMAL(10,2) NOT NULL DEFAULT 0,
    used             DECIMAL(10,2) NOT NULL DEFAULT 0,
    pending          DECIMAL(10,2) NOT NULL DEFAULT 0,
    remaining        DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "UX_hr_leave_balance_user_year_type"
    ON hr_leave_balances (user_id, year, leave_type);

CREATE TABLE IF NOT EXISTS hr_salary_history (
    id             SERIAL        PRIMARY KEY,
    "TenantId"     INTEGER       NOT NULL DEFAULT 0,
    user_id        INTEGER       NOT NULL,
    previous_gross DECIMAL(14,3),
    new_gross      DECIMAL(14,3) NOT NULL,
    currency       VARCHAR(10)   NOT NULL DEFAULT 'TND',
    effective_date TIMESTAMP     NOT NULL DEFAULT NOW(),
    reason         VARCHAR(300),
    changed_by     INTEGER,
    created_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_hr_salary_history_user_id" ON hr_salary_history (user_id);

CREATE TABLE IF NOT EXISTS hr_employee_documents (
    id          SERIAL         PRIMARY KEY,
    "TenantId"  INTEGER        NOT NULL DEFAULT 0,
    user_id     INTEGER        NOT NULL,
    doc_type    VARCHAR(40)    NOT NULL DEFAULT 'other',
    title       VARCHAR(255)   NOT NULL DEFAULT '',
    file_url    VARCHAR(1000)  NOT NULL DEFAULT '',
    file_name   VARCHAR(300),
    mime_type   VARCHAR(120),
    file_size   BIGINT,
    issued_date TIMESTAMP,
    expires_at  TIMESTAMP,
    uploaded_by INTEGER,
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW(),
    is_deleted  BOOLEAN        NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS "IX_hr_employee_documents_user_id" ON hr_employee_documents (user_id);

CREATE TABLE IF NOT EXISTS hr_audit_logs (
    id            SERIAL       PRIMARY KEY,
    "TenantId"    INTEGER      NOT NULL DEFAULT 0,
    user_id       INTEGER      NOT NULL,
    event_type    VARCHAR(60)  NOT NULL DEFAULT '',
    description   VARCHAR(500),
    payload       TEXT,
    actor_user_id INTEGER,
    actor_name    VARCHAR(200),
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_hr_audit_logs_user_event" ON hr_audit_logs (user_id, event_type);

CREATE TABLE IF NOT EXISTS hr_bonus_costs (
    id              SERIAL        PRIMARY KEY,
    "TenantId"      INTEGER       NOT NULL DEFAULT 0,
    user_id         INTEGER       NOT NULL,
    kind            VARCHAR(40)   NOT NULL DEFAULT 'bonus',
    category        VARCHAR(80),
    label           VARCHAR(200)  NOT NULL DEFAULT '',
    amount          DECIMAL(14,3) NOT NULL DEFAULT 0,
    frequency       VARCHAR(20)   NOT NULL DEFAULT 'monthly',
    year            INTEGER       NOT NULL,
    month           INTEGER       NOT NULL,
    affects_payroll BOOLEAN       NOT NULL DEFAULT TRUE,
    subject_to_cnss BOOLEAN       NOT NULL DEFAULT FALSE,
    notes           TEXT,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    created_by      INTEGER,
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS "IX_hr_bonus_costs_user_year_month"
    ON hr_bonus_costs (user_id, year, month);

CREATE TABLE IF NOT EXISTS hr_payroll_runs (
    id           SERIAL        PRIMARY KEY,
    "TenantId"   INTEGER       NOT NULL DEFAULT 0,
    month        INTEGER       NOT NULL,
    year         INTEGER       NOT NULL,
    status       VARCHAR(20)   NOT NULL DEFAULT 'draft',
    total_gross  DECIMAL(14,3) NOT NULL DEFAULT 0,
    total_net    DECIMAL(14,3) NOT NULL DEFAULT 0,
    created_by   INTEGER       NOT NULL DEFAULT 0,
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "IX_hr_payroll_runs_year_month" ON hr_payroll_runs (year, month);

CREATE TABLE IF NOT EXISTS hr_payroll_entries (
    id             SERIAL        PRIMARY KEY,
    "TenantId"     INTEGER       NOT NULL DEFAULT 0,
    payroll_run_id INTEGER       NOT NULL REFERENCES hr_payroll_runs(id) ON DELETE CASCADE,
    user_id        INTEGER       NOT NULL,
    gross_salary   DECIMAL(14,3) NOT NULL DEFAULT 0,
    cnss           DECIMAL(14,3) NOT NULL DEFAULT 0,
    taxable_gross  DECIMAL(14,3) NOT NULL DEFAULT 0,
    abattement     DECIMAL(14,3) NOT NULL DEFAULT 0,
    taxable_base   DECIMAL(14,3) NOT NULL DEFAULT 0,
    irpp           DECIMAL(14,3) NOT NULL DEFAULT 0,
    css            DECIMAL(14,3) NOT NULL DEFAULT 0,
    net_salary     DECIMAL(14,3) NOT NULL DEFAULT 0,
    worked_days    DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_hours    DECIMAL(10,2) NOT NULL DEFAULT 0,
    overtime_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    leave_days     DECIMAL(10,2) NOT NULL DEFAULT 0,
    details        TEXT          NOT NULL DEFAULT '{}',
    created_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_hr_payroll_entries_run_user"
    ON hr_payroll_entries (payroll_run_id, user_id);

CREATE TABLE IF NOT EXISTS hr_review_cycles (
    id                       SERIAL       PRIMARY KEY,
    "TenantId"               INTEGER      NOT NULL DEFAULT 0,
    name                     VARCHAR(200) NOT NULL DEFAULT '',
    description              TEXT,
    frequency                VARCHAR(20)  NOT NULL DEFAULT 'annual',
    period_start             TIMESTAMP    NOT NULL,
    period_end               TIMESTAMP    NOT NULL,
    status                   VARCHAR(20)  NOT NULL DEFAULT 'draft',
    self_assessment_required BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by               INTEGER,
    updated_at               TIMESTAMP    NOT NULL DEFAULT NOW(),
    is_deleted               BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS hr_goals (
    id           SERIAL        PRIMARY KEY,
    "TenantId"   INTEGER       NOT NULL DEFAULT 0,
    user_id      INTEGER       NOT NULL,
    cycle_id     INTEGER       REFERENCES hr_review_cycles(id) ON DELETE SET NULL,
    title        VARCHAR(250)  NOT NULL DEFAULT '',
    description  TEXT,
    category     VARCHAR(40)   NOT NULL DEFAULT 'smart',
    weight       DECIMAL(5,2)  NOT NULL DEFAULT 0,
    target_value VARCHAR(120),
    progress     INTEGER       NOT NULL DEFAULT 0,
    status       VARCHAR(30)   NOT NULL DEFAULT 'not_started',
    due_date     TIMESTAMP,
    score        DECIMAL(4,2),
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    created_by   INTEGER,
    updated_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    is_deleted   BOOLEAN       NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS "IX_hr_goals_user_id" ON hr_goals (user_id);

CREATE TABLE IF NOT EXISTS hr_performance_reviews (
    id                           SERIAL       PRIMARY KEY,
    "TenantId"                   INTEGER      NOT NULL DEFAULT 0,
    user_id                      INTEGER      NOT NULL,
    cycle_id                     INTEGER      NOT NULL REFERENCES hr_review_cycles(id) ON DELETE CASCADE,
    reviewer_user_id             INTEGER,
    status                       VARCHAR(30)  NOT NULL DEFAULT 'pending',
    self_assessment              TEXT,
    self_assessment_submitted_at TIMESTAMP,
    manager_comments             TEXT,
    overall_score                DECIMAL(4,2),
    rating                       VARCHAR(40),
    strengths                    TEXT,
    improvements                 TEXT,
    development_plan             TEXT,
    completed_at                 TIMESTAMP,
    acknowledged_at              TIMESTAMP,
    created_at                   TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by                   INTEGER,
    updated_at                   TIMESTAMP    NOT NULL DEFAULT NOW(),
    is_deleted                   BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS "IX_hr_performance_reviews_user_id" ON hr_performance_reviews (user_id);

CREATE TABLE IF NOT EXISTS hr_job_openings (
    id                     SERIAL        PRIMARY KEY,
    "TenantId"             INTEGER       NOT NULL DEFAULT 0,
    title                  VARCHAR(200)  NOT NULL DEFAULT '',
    department_id          INTEGER,
    location               VARCHAR(200),
    contract_type          VARCHAR(20),
    seniority              VARCHAR(20),
    description            TEXT,
    requirements           TEXT,
    salary_min             DECIMAL(14,3),
    salary_max             DECIMAL(14,3),
    currency               VARCHAR(8)    NOT NULL DEFAULT 'TND',
    openings_count         INTEGER       NOT NULL DEFAULT 1,
    status                 VARCHAR(20)   NOT NULL DEFAULT 'draft',
    hiring_manager_user_id INTEGER,
    opened_at              TIMESTAMP,
    closed_at              TIMESTAMP,
    created_at             TIMESTAMP     NOT NULL DEFAULT NOW(),
    created_by             INTEGER,
    updated_at             TIMESTAMP     NOT NULL DEFAULT NOW(),
    is_deleted             BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS hr_applicants (
    id               SERIAL        PRIMARY KEY,
    "TenantId"       INTEGER       NOT NULL DEFAULT 0,
    opening_id       INTEGER       NOT NULL REFERENCES hr_job_openings(id) ON DELETE CASCADE,
    first_name       VARCHAR(100)  NOT NULL DEFAULT '',
    last_name        VARCHAR(100)  NOT NULL DEFAULT '',
    email            VARCHAR(200),
    phone            VARCHAR(40),
    source           VARCHAR(60),
    resume_url       VARCHAR(500),
    resume_file_name VARCHAR(200),
    stage            VARCHAR(30)   NOT NULL DEFAULT 'applied',
    rating           INTEGER,
    expected_salary  DECIMAL(14,3),
    available_from   TIMESTAMP,
    rejection_reason VARCHAR(300),
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    created_by       INTEGER,
    updated_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS "IX_hr_applicants_opening_id" ON hr_applicants (opening_id);

CREATE TABLE IF NOT EXISTS hr_interviews (
    id                  SERIAL       PRIMARY KEY,
    "TenantId"          INTEGER      NOT NULL DEFAULT 0,
    applicant_id        INTEGER      NOT NULL REFERENCES hr_applicants(id) ON DELETE CASCADE,
    kind                VARCHAR(30)  NOT NULL DEFAULT 'phone',
    scheduled_at        TIMESTAMP    NOT NULL,
    duration_minutes    INTEGER      NOT NULL DEFAULT 45,
    interviewer_user_id INTEGER,
    location            VARCHAR(200),
    meeting_url         VARCHAR(500),
    status              VARCHAR(20)  NOT NULL DEFAULT 'scheduled',
    score               INTEGER,
    feedback            TEXT,
    recommendation      VARCHAR(20),
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by          INTEGER,
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    is_deleted          BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS "IX_hr_interviews_applicant_id" ON hr_interviews (applicant_id);

CREATE TABLE IF NOT EXISTS hr_applicant_notes (
    id             SERIAL    PRIMARY KEY,
    "TenantId"     INTEGER   NOT NULL DEFAULT 0,
    applicant_id   INTEGER   NOT NULL REFERENCES hr_applicants(id) ON DELETE CASCADE,
    author_user_id INTEGER,
    body           TEXT      NOT NULL DEFAULT '',
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_hr_applicant_notes_applicant_id"
    ON hr_applicant_notes (applicant_id);

-- ─────────────────────────────────────────────────────────────────────
-- PART F: EMAIL ACCOUNTS / SYNC (UUID PKs, PascalCase columns)
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ConnectedEmailAccounts" (
    "Id"                                   UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "TenantId"                             INTEGER      NOT NULL DEFAULT 0,
    "UserId"                               INTEGER      NOT NULL,
    "Handle"                               VARCHAR(255) NOT NULL,
    "Provider"                             VARCHAR(50)  NOT NULL,
    "AccessToken"                          TEXT         NOT NULL DEFAULT '',
    "RefreshToken"                         TEXT         NOT NULL DEFAULT '',
    "Scopes"                               TEXT,
    "SyncStatus"                           VARCHAR(50)  NOT NULL DEFAULT 'idle',
    "LastSyncedAt"                         TIMESTAMP,
    "AuthFailedAt"                         TIMESTAMP,
    "EmailVisibility"                      VARCHAR(50)  NOT NULL DEFAULT 'private',
    "CalendarVisibility"                   VARCHAR(50)  NOT NULL DEFAULT 'private',
    "ContactAutoCreationPolicy"            VARCHAR(50)  NOT NULL DEFAULT 'never',
    "IsEmailSyncEnabled"                   BOOLEAN      NOT NULL DEFAULT TRUE,
    "IsCalendarSyncEnabled"                BOOLEAN      NOT NULL DEFAULT FALSE,
    "ExcludeGroupEmails"                   BOOLEAN      NOT NULL DEFAULT FALSE,
    "ExcludeNonProfessionalEmails"         BOOLEAN      NOT NULL DEFAULT FALSE,
    "IsCalendarContactAutoCreationEnabled" BOOLEAN      NOT NULL DEFAULT FALSE,
    "CreatedAt"                            TIMESTAMP    NOT NULL DEFAULT NOW(),
    "UpdatedAt"                            TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_ConnectedEmailAccounts_TenantId"
    ON "ConnectedEmailAccounts" ("TenantId");
CREATE INDEX IF NOT EXISTS "IX_ConnectedEmailAccounts_UserId"
    ON "ConnectedEmailAccounts" ("UserId");

CREATE TABLE IF NOT EXISTS "CustomEmailAccounts" (
    "Id"                UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "TenantId"          INTEGER      NOT NULL DEFAULT 0,
    "UserId"            INTEGER,
    "Email"             VARCHAR(255) NOT NULL,
    "DisplayName"       VARCHAR(255),
    "Provider"          VARCHAR(50)  NOT NULL DEFAULT 'custom',
    "SmtpServer"        VARCHAR(255),
    "SmtpPort"          INTEGER,
    "SmtpSecurity"      VARCHAR(20),
    "ImapServer"        VARCHAR(255),
    "ImapPort"          INTEGER,
    "ImapSecurity"      VARCHAR(20),
    "Pop3Server"        VARCHAR(255),
    "Pop3Port"          INTEGER,
    "Pop3Security"      VARCHAR(20),
    "EncryptedPassword" TEXT,
    "IsActive"          BOOLEAN      NOT NULL DEFAULT TRUE,
    "LastSyncedAt"      TIMESTAMP,
    "CreatedAt"         TIMESTAMP    NOT NULL DEFAULT NOW(),
    "UpdatedAt"         TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_CustomEmailAccounts_TenantId"
    ON "CustomEmailAccounts" ("TenantId");

CREATE TABLE IF NOT EXISTS "EmailBlocklistItems" (
    "Id"                      UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "TenantId"                INTEGER      NOT NULL DEFAULT 0,
    "ConnectedEmailAccountId" UUID         NOT NULL
        REFERENCES "ConnectedEmailAccounts"("Id") ON DELETE CASCADE,
    "Handle"                  VARCHAR(255) NOT NULL,
    "CreatedAt"               TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_EmailBlocklistItems_AccountId"
    ON "EmailBlocklistItems" ("ConnectedEmailAccountId");

CREATE TABLE IF NOT EXISTS "SyncedEmails" (
    "Id"                      UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "TenantId"                INTEGER      NOT NULL DEFAULT 0,
    "ConnectedEmailAccountId" UUID         NOT NULL
        REFERENCES "ConnectedEmailAccounts"("Id") ON DELETE CASCADE,
    "ExternalId"              VARCHAR(255) NOT NULL,
    "ThreadId"                VARCHAR(255),
    "Subject"                 TEXT         NOT NULL DEFAULT '',
    "Snippet"                 TEXT,
    "FromEmail"               VARCHAR(255) NOT NULL DEFAULT '',
    "FromName"                VARCHAR(255),
    "ToEmails"                TEXT,
    "CcEmails"                TEXT,
    "BccEmails"               TEXT,
    "BodyPreview"             TEXT,
    "IsRead"                  BOOLEAN      NOT NULL DEFAULT FALSE,
    "IsStarred"               BOOLEAN      NOT NULL DEFAULT FALSE,
    "HasAttachments"          BOOLEAN      NOT NULL DEFAULT FALSE,
    "Labels"                  TEXT,
    "ReceivedAt"              TIMESTAMP    NOT NULL DEFAULT NOW(),
    "CreatedAt"               TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_SyncedEmails_AccountId"  ON "SyncedEmails" ("ConnectedEmailAccountId");
CREATE INDEX IF NOT EXISTS "IX_SyncedEmails_ExternalId" ON "SyncedEmails" ("ExternalId");
CREATE INDEX IF NOT EXISTS "IX_SyncedEmails_ReceivedAt" ON "SyncedEmails" ("ReceivedAt");

CREATE TABLE IF NOT EXISTS "SyncedEmailAttachments" (
    "Id"                   UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "TenantId"             INTEGER      NOT NULL DEFAULT 0,
    "SyncedEmailId"        UUID         NOT NULL
        REFERENCES "SyncedEmails"("Id") ON DELETE CASCADE,
    "ExternalAttachmentId" VARCHAR(500) NOT NULL,
    "FileName"             VARCHAR(255) NOT NULL,
    "ContentType"          VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
    "Size"                 BIGINT       NOT NULL DEFAULT 0,
    "CreatedAt"            TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_SyncedEmailAttachments_EmailId"
    ON "SyncedEmailAttachments" ("SyncedEmailId");

CREATE TABLE IF NOT EXISTS "SyncedCalendarEvents" (
    "Id"                      UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "TenantId"                INTEGER      NOT NULL DEFAULT 0,
    "ConnectedEmailAccountId" UUID         NOT NULL
        REFERENCES "ConnectedEmailAccounts"("Id") ON DELETE CASCADE,
    "ExternalId"              VARCHAR(255) NOT NULL,
    "Title"                   TEXT         NOT NULL DEFAULT '',
    "Description"             TEXT,
    "Location"                VARCHAR(500),
    "StartTime"               TIMESTAMP    NOT NULL,
    "EndTime"                 TIMESTAMP    NOT NULL,
    "IsAllDay"                BOOLEAN      NOT NULL DEFAULT FALSE,
    "Status"                  VARCHAR(50)  NOT NULL DEFAULT 'confirmed',
    "OrganizerEmail"          VARCHAR(255),
    "Attendees"               TEXT,
    "CreatedAt"               TIMESTAMP    NOT NULL DEFAULT NOW(),
    "UpdatedAt"               TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_SyncedCalendarEvents_AccountId"
    ON "SyncedCalendarEvents" ("ConnectedEmailAccountId");
CREATE INDEX IF NOT EXISTS "IX_SyncedCalendarEvents_StartTime"
    ON "SyncedCalendarEvents" ("StartTime");

-- ─────────────────────────────────────────────────────────────────────
-- PART G: USER SIGNATURES & AI SETTINGS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "UserSignatures" (
    "Id"           SERIAL         PRIMARY KEY,
    "TenantId"     INTEGER        NOT NULL DEFAULT 0,
    "UserId"       INTEGER        NOT NULL,
    "SignatureUrl" VARCHAR(1000)  NOT NULL,
    "CreatedAt"    TIMESTAMP      NOT NULL DEFAULT NOW(),
    "UpdatedAt"    TIMESTAMP      NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_UserSignatures_UserId" ON "UserSignatures" ("UserId");

CREATE TABLE IF NOT EXISTS "UserAiKeys" (
    "Id"        SERIAL       PRIMARY KEY,
    "TenantId"  INTEGER      NOT NULL DEFAULT 0,
    "UserId"    INTEGER      NOT NULL,
    "UserType"  VARCHAR(20)  NOT NULL,
    "Label"     VARCHAR(100) NOT NULL,
    "ApiKey"    TEXT         NOT NULL,
    "Provider"  VARCHAR(50)  NOT NULL,
    "Priority"  INTEGER      NOT NULL DEFAULT 0,
    "IsActive"  BOOLEAN      NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP    NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_UserAiKeys_UserId" ON "UserAiKeys" ("UserId");

CREATE TABLE IF NOT EXISTS "UserAiPreferences" (
    "Id"                 SERIAL       PRIMARY KEY,
    "TenantId"           INTEGER      NOT NULL DEFAULT 0,
    "UserId"             INTEGER      NOT NULL,
    "UserType"           VARCHAR(20)  NOT NULL,
    "DefaultModel"       VARCHAR(200),
    "FallbackModel"      VARCHAR(200),
    "DefaultTemperature" DECIMAL(3,2) NOT NULL DEFAULT 0.70,
    "DefaultMaxTokens"   INTEGER      NOT NULL DEFAULT 4096,
    "UpdatedAt"          TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "UX_UserAiPreferences_UserId"
    ON "UserAiPreferences" ("UserId");

-- ─────────────────────────────────────────────────────────────────────
-- PART H: WEBSITE BUILDER (WB_* prefix)
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "WB_Sites" (
    "Id"              SERIAL       PRIMARY KEY,
    "TenantId"        INTEGER      NOT NULL DEFAULT 0,
    "Name"            VARCHAR(200) NOT NULL,
    "Slug"            VARCHAR(100) NOT NULL,
    "Description"     TEXT,
    "Favicon"         VARCHAR(2000),
    "ThemeJson"       JSONB        NOT NULL DEFAULT '{}',
    "Published"       BOOLEAN      NOT NULL DEFAULT FALSE,
    "PublishedAt"     TIMESTAMP,
    "PublishedUrl"    VARCHAR(500),
    "DefaultLanguage" VARCHAR(10)  NOT NULL DEFAULT 'en',
    "LanguagesJson"   JSONB,
    "CreatedAt"       TIMESTAMP    NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMP,
    "CreatedBy"       VARCHAR(100) NOT NULL DEFAULT 'system',
    "ModifiedBy"      VARCHAR(100),
    "IsDeleted"       BOOLEAN      NOT NULL DEFAULT FALSE,
    "DeletedAt"       TIMESTAMP,
    "DeletedBy"       VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "IX_WB_Sites_TenantId"
    ON "WB_Sites" ("TenantId") WHERE "IsDeleted" = FALSE;

CREATE TABLE IF NOT EXISTS "WB_Pages" (
    "Id"               SERIAL       PRIMARY KEY,
    "TenantId"         INTEGER      NOT NULL DEFAULT 0,
    "SiteId"           INTEGER      NOT NULL
        REFERENCES "WB_Sites"("Id") ON DELETE CASCADE,
    "Title"            VARCHAR(200) NOT NULL,
    "Slug"             VARCHAR(100) NOT NULL DEFAULT '',
    "ComponentsJson"   JSONB        NOT NULL DEFAULT '[]',
    "SeoJson"          JSONB        NOT NULL DEFAULT '{}',
    "TranslationsJson" JSONB,
    "IsHomePage"       BOOLEAN      NOT NULL DEFAULT FALSE,
    "SortOrder"        INTEGER      NOT NULL DEFAULT 0,
    "CreatedAt"        TIMESTAMP    NOT NULL DEFAULT NOW(),
    "UpdatedAt"        TIMESTAMP,
    "CreatedBy"        VARCHAR(100) NOT NULL DEFAULT 'system',
    "ModifiedBy"       VARCHAR(100),
    "IsDeleted"        BOOLEAN      NOT NULL DEFAULT FALSE,
    "DeletedAt"        TIMESTAMP,
    "DeletedBy"        VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "IX_WB_Pages_SiteId"
    ON "WB_Pages" ("SiteId") WHERE "IsDeleted" = FALSE;

CREATE TABLE IF NOT EXISTS "WB_PageVersions" (
    "Id"             SERIAL       PRIMARY KEY,
    "TenantId"       INTEGER      NOT NULL DEFAULT 0,
    "PageId"         INTEGER      NOT NULL
        REFERENCES "WB_Pages"("Id") ON DELETE CASCADE,
    "SiteId"         INTEGER      NOT NULL
        REFERENCES "WB_Sites"("Id") ON DELETE CASCADE,
    "VersionNumber"  INTEGER      NOT NULL DEFAULT 1,
    "ComponentsJson" JSONB        NOT NULL DEFAULT '[]',
    "ChangeMessage"  VARCHAR(500),
    "CreatedAt"      TIMESTAMP    NOT NULL DEFAULT NOW(),
    "CreatedBy"      VARCHAR(100) NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS "IX_WB_PageVersions_PageId" ON "WB_PageVersions" ("PageId");

CREATE TABLE IF NOT EXISTS "WB_GlobalBlocks" (
    "Id"            SERIAL       PRIMARY KEY,
    "TenantId"      INTEGER      NOT NULL DEFAULT 0,
    "Name"          VARCHAR(200) NOT NULL,
    "Description"   TEXT,
    "ComponentJson" JSONB        NOT NULL DEFAULT '{}',
    "Category"      VARCHAR(100),
    "Tags"          TEXT,
    "CreatedAt"     TIMESTAMP    NOT NULL DEFAULT NOW(),
    "UpdatedAt"     TIMESTAMP,
    "CreatedBy"     VARCHAR(100) NOT NULL DEFAULT 'system',
    "ModifiedBy"    VARCHAR(100),
    "IsDeleted"     BOOLEAN      NOT NULL DEFAULT FALSE,
    "DeletedAt"     TIMESTAMP,
    "DeletedBy"     VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "IX_WB_GlobalBlocks_TenantId"
    ON "WB_GlobalBlocks" ("TenantId") WHERE "IsDeleted" = FALSE;

CREATE TABLE IF NOT EXISTS "WB_GlobalBlockUsages" (
    "Id"            SERIAL    PRIMARY KEY,
    "TenantId"      INTEGER   NOT NULL DEFAULT 0,
    "GlobalBlockId" INTEGER   NOT NULL
        REFERENCES "WB_GlobalBlocks"("Id") ON DELETE CASCADE,
    "SiteId"        INTEGER   NOT NULL
        REFERENCES "WB_Sites"("Id") ON DELETE CASCADE,
    "PageId"        INTEGER
        REFERENCES "WB_Pages"("Id") ON DELETE SET NULL,
    "CreatedAt"     TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_WB_GlobalBlockUsages_BlockId"
    ON "WB_GlobalBlockUsages" ("GlobalBlockId");
CREATE INDEX IF NOT EXISTS "IX_WB_GlobalBlockUsages_SiteId"
    ON "WB_GlobalBlockUsages" ("SiteId");

CREATE TABLE IF NOT EXISTS "WB_BrandProfiles" (
    "Id"          SERIAL       PRIMARY KEY,
    "TenantId"    INTEGER      NOT NULL DEFAULT 0,
    "Name"        VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "ThemeJson"   JSONB        NOT NULL DEFAULT '{}',
    "IsBuiltIn"   BOOLEAN      NOT NULL DEFAULT FALSE,
    "CreatedAt"   TIMESTAMP    NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMP,
    "CreatedBy"   VARCHAR(100) NOT NULL DEFAULT 'system',
    "ModifiedBy"  VARCHAR(100),
    "IsDeleted"   BOOLEAN      NOT NULL DEFAULT FALSE,
    "DeletedAt"   TIMESTAMP,
    "DeletedBy"   VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS "WB_FormSubmissions" (
    "Id"              SERIAL       PRIMARY KEY,
    "TenantId"        INTEGER      NOT NULL DEFAULT 0,
    "SiteId"          INTEGER      NOT NULL
        REFERENCES "WB_Sites"("Id") ON DELETE CASCADE,
    "PageId"          INTEGER
        REFERENCES "WB_Pages"("Id") ON DELETE SET NULL,
    "FormComponentId" VARCHAR(100) NOT NULL,
    "FormLabel"       VARCHAR(200) NOT NULL DEFAULT '',
    "PageTitle"       VARCHAR(200) NOT NULL DEFAULT '',
    "DataJson"        JSONB        NOT NULL DEFAULT '{}',
    "Source"          VARCHAR(50)  NOT NULL DEFAULT 'website',
    "WebhookStatus"   VARCHAR(20),
    "WebhookResponse" TEXT,
    "SubmittedAt"     TIMESTAMP    NOT NULL DEFAULT NOW(),
    "IpAddress"       VARCHAR(45)
);
CREATE INDEX IF NOT EXISTS "IX_WB_FormSubmissions_SiteId"
    ON "WB_FormSubmissions" ("SiteId");
CREATE INDEX IF NOT EXISTS "IX_WB_FormSubmissions_SubmittedAt"
    ON "WB_FormSubmissions" ("SubmittedAt");

CREATE TABLE IF NOT EXISTS "WB_Media" (
    "Id"           SERIAL         PRIMARY KEY,
    "TenantId"     INTEGER        NOT NULL DEFAULT 0,
    "SiteId"       INTEGER
        REFERENCES "WB_Sites"("Id") ON DELETE SET NULL,
    "FileName"     VARCHAR(255)   NOT NULL,
    "OriginalName" VARCHAR(500)   NOT NULL,
    "FilePath"     VARCHAR(1000)  NOT NULL,
    "FileUrl"      VARCHAR(2000)  NOT NULL,
    "FileSize"     BIGINT         NOT NULL DEFAULT 0,
    "ContentType"  VARCHAR(100)   NOT NULL DEFAULT 'image/jpeg',
    "Width"        INTEGER,
    "Height"       INTEGER,
    "Folder"       VARCHAR(200),
    "AltText"      VARCHAR(500),
    "UploadedAt"   TIMESTAMP      NOT NULL DEFAULT NOW(),
    "UploadedBy"   VARCHAR(100)   NOT NULL DEFAULT 'system',
    "IsDeleted"    BOOLEAN        NOT NULL DEFAULT FALSE,
    "DeletedAt"    TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "IX_WB_Media_TenantId"
    ON "WB_Media" ("TenantId") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_WB_Media_SiteId" ON "WB_Media" ("SiteId");

CREATE TABLE IF NOT EXISTS "WB_Templates" (
    "Id"              SERIAL        PRIMARY KEY,
    "TenantId"        INTEGER       NOT NULL DEFAULT 0,
    "Name"            VARCHAR(200)  NOT NULL,
    "Description"     TEXT,
    "Category"        VARCHAR(100)  NOT NULL DEFAULT 'general',
    "PreviewImageUrl" VARCHAR(2000),
    "ThemeJson"       JSONB         NOT NULL DEFAULT '{}',
    "PagesJson"       JSONB         NOT NULL DEFAULT '[]',
    "Tags"            TEXT,
    "IsPremium"       BOOLEAN       NOT NULL DEFAULT FALSE,
    "IsBuiltIn"       BOOLEAN       NOT NULL DEFAULT FALSE,
    "SortOrder"       INTEGER       NOT NULL DEFAULT 0,
    "CreatedAt"       TIMESTAMP     NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMP,
    "CreatedBy"       VARCHAR(100)  NOT NULL DEFAULT 'system',
    "ModifiedBy"      VARCHAR(100),
    "IsDeleted"       BOOLEAN       NOT NULL DEFAULT FALSE,
    "DeletedAt"       TIMESTAMP,
    "DeletedBy"       VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS "WB_ActivityLog" (
    "Id"         SERIAL       PRIMARY KEY,
    "TenantId"   INTEGER      NOT NULL DEFAULT 0,
    "SiteId"     INTEGER      NOT NULL
        REFERENCES "WB_Sites"("Id") ON DELETE CASCADE,
    "PageId"     INTEGER,
    "Action"     VARCHAR(50)  NOT NULL,
    "EntityType" VARCHAR(50)  NOT NULL,
    "Details"    TEXT,
    "CreatedAt"  TIMESTAMP    NOT NULL DEFAULT NOW(),
    "CreatedBy"  VARCHAR(100) NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS "IX_WB_ActivityLog_SiteId"
    ON "WB_ActivityLog" ("SiteId");
CREATE INDEX IF NOT EXISTS "IX_WB_ActivityLog_CreatedAt"
    ON "WB_ActivityLog" ("CreatedAt");

-- ─────────────────────────────────────────────────────────────────────
-- PART I: PAYMENTS (snake_case, VARCHAR(50) string PK)
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_plans (
    id                VARCHAR(50)   NOT NULL PRIMARY KEY,
    "TenantId"        INTEGER       NOT NULL DEFAULT 0,
    entity_type       VARCHAR(20)   NOT NULL,
    entity_id         VARCHAR(50)   NOT NULL,
    name              VARCHAR(255)  NOT NULL,
    description       TEXT,
    total_amount      DECIMAL(15,2) NOT NULL,
    currency          VARCHAR(3)    NOT NULL DEFAULT 'TND',
    installment_count INTEGER       NOT NULL DEFAULT 2,
    status            VARCHAR(20)   NOT NULL DEFAULT 'active',
    created_by        VARCHAR(50)   NOT NULL,
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_payment_plans_TenantId"
    ON payment_plans ("TenantId");
CREATE INDEX IF NOT EXISTS "IX_payment_plans_entity"
    ON payment_plans ("TenantId", entity_type, entity_id);

CREATE TABLE IF NOT EXISTS payment_plan_installments (
    id                 VARCHAR(50)   NOT NULL PRIMARY KEY,
    "TenantId"         INTEGER       NOT NULL DEFAULT 0,
    plan_id            VARCHAR(50)   NOT NULL
        REFERENCES payment_plans(id) ON DELETE CASCADE,
    installment_number INTEGER       NOT NULL DEFAULT 1,
    amount             DECIMAL(15,2) NOT NULL,
    due_date           TIMESTAMP     NOT NULL,
    status             VARCHAR(20)   NOT NULL DEFAULT 'pending',
    paid_amount        DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_at            TIMESTAMP,
    notes              TEXT,
    created_at         TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_payment_plan_installments_plan_id"
    ON payment_plan_installments (plan_id);

CREATE TABLE IF NOT EXISTS payments (
    id                VARCHAR(50)   NOT NULL PRIMARY KEY,
    "TenantId"        INTEGER       NOT NULL DEFAULT 0,
    entity_type       VARCHAR(20)   NOT NULL,
    entity_id         VARCHAR(50)   NOT NULL,
    plan_id           VARCHAR(50),
    installment_id    VARCHAR(50),
    amount            DECIMAL(15,2) NOT NULL,
    currency          VARCHAR(3)    NOT NULL DEFAULT 'TND',
    payment_method    VARCHAR(50)   NOT NULL DEFAULT 'cash',
    payment_reference VARCHAR(255),
    payment_date      TIMESTAMP     NOT NULL DEFAULT NOW(),
    status            VARCHAR(20)   NOT NULL DEFAULT 'completed',
    notes             TEXT,
    receipt_number    VARCHAR(100),
    created_by        VARCHAR(50)   NOT NULL,
    created_by_name   VARCHAR(255),
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_payments_TenantId" ON payments ("TenantId");
CREATE INDEX IF NOT EXISTS "IX_payments_entity"   ON payments ("TenantId", entity_type, entity_id);
CREATE INDEX IF NOT EXISTS "IX_payments_plan_id"  ON payments (plan_id);

CREATE TABLE IF NOT EXISTS payment_item_allocations (
    id               VARCHAR(50)   NOT NULL PRIMARY KEY,
    "TenantId"       INTEGER       NOT NULL DEFAULT 0,
    payment_id       VARCHAR(50)   NOT NULL
        REFERENCES payments(id) ON DELETE CASCADE,
    item_id          VARCHAR(50)   NOT NULL,
    item_name        VARCHAR(255)  NOT NULL DEFAULT '',
    allocated_amount DECIMAL(15,2) NOT NULL,
    item_total       DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_payment_item_allocations_payment_id"
    ON payment_item_allocations (payment_id);

-- ─────────────────────────────────────────────────────────────────────
-- PART J: RETENUE À LA SOURCE
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "RSRecords" (
    "Id"                     SERIAL        PRIMARY KEY,
    "TenantId"               INTEGER       NOT NULL DEFAULT 0,
    "EntityType"             VARCHAR(20)   NOT NULL,
    "EntityId"               INTEGER       NOT NULL,
    "EntityNumber"           VARCHAR(50),
    "InvoiceNumber"          VARCHAR(100)  NOT NULL,
    "InvoiceDate"            TIMESTAMP     NOT NULL,
    "InvoiceAmount"          DECIMAL(15,2) NOT NULL,
    "PaymentDate"            TIMESTAMP     NOT NULL,
    "AmountPaid"             DECIMAL(15,2) NOT NULL,
    "RSAmount"               DECIMAL(15,2) NOT NULL,
    "RSTypeCode"             VARCHAR(10)   NOT NULL DEFAULT '10',
    "SupplierName"           VARCHAR(255)  NOT NULL,
    "SupplierTaxId"          VARCHAR(50)   NOT NULL,
    "SupplierAddress"        VARCHAR(500),
    "PayerName"              VARCHAR(255)  NOT NULL,
    "PayerTaxId"             VARCHAR(50)   NOT NULL,
    "PayerAddress"           VARCHAR(500),
    "Status"                 VARCHAR(20)   NOT NULL DEFAULT 'pending',
    "TEJExported"            BOOLEAN       NOT NULL DEFAULT FALSE,
    "TEJFileName"            VARCHAR(255),
    "DeclarationDeadline"    TIMESTAMP,
    "IsOverdue"              BOOLEAN       NOT NULL DEFAULT FALSE,
    "DaysLate"               INTEGER       NOT NULL DEFAULT 0,
    "PenaltyAmount"          DECIMAL(15,2) NOT NULL DEFAULT 0,
    "SupplierType"           VARCHAR(20),
    "IsExemptByTreaty"       BOOLEAN       NOT NULL DEFAULT FALSE,
    "TreatyCode"             VARCHAR(20),
    "TEJAcceptanceNumber"    VARCHAR(255),
    "TEJTransmissionStatus"  VARCHAR(20)   NOT NULL DEFAULT 'pending',
    "Notes"                  VARCHAR(1000),
    "OperationCode"          VARCHAR(20),
    "Cnpc"                   VARCHAR(20),
    "PriseEnCharge"          BOOLEAN       NOT NULL DEFAULT FALSE,
    "AnneeFacturation"       INTEGER,
    "RefCertifChezDeclarant" VARCHAR(50),
    "RsTvaCode"              VARCHAR(20),
    "RsTvaTaux"              DECIMAL(5,2),
    "RsTvaAmount"            DECIMAL(15,2) NOT NULL DEFAULT 0,
    "MontantNetServi"        DECIMAL(15,2) NOT NULL DEFAULT 0,
    "BeneficiaireCategorie"  VARCHAR(2),
    "BeneficiaireIsResident" BOOLEAN       NOT NULL DEFAULT TRUE,
    "BeneficiaireIdType"     SMALLINT,
    "BeneficiaireDateNaissance" TIMESTAMP,
    "BeneficiairePaysCode"   VARCHAR(3)    NOT NULL DEFAULT 'TN',
    "Acte"                   SMALLINT      NOT NULL DEFAULT 0,
    "CreatedAt"              TIMESTAMP     NOT NULL DEFAULT NOW(),
    "CreatedBy"              VARCHAR(100)  NOT NULL DEFAULT '',
    "ModifiedAt"             TIMESTAMP,
    "ModifiedBy"             VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "IX_RSRecords_TenantId"    ON "RSRecords" ("TenantId");
CREATE INDEX IF NOT EXISTS "IX_RSRecords_Entity"      ON "RSRecords" ("TenantId", "EntityType", "EntityId");
CREATE INDEX IF NOT EXISTS "IX_RSRecords_Status"      ON "RSRecords" ("TenantId", "Status");
CREATE INDEX IF NOT EXISTS "IX_RSRecords_TEJExported" ON "RSRecords" ("TenantId", "TEJExported");

CREATE TABLE IF NOT EXISTS "TEJExportLogs" (
    "Id"            SERIAL        PRIMARY KEY,
    "TenantId"      INTEGER       NOT NULL DEFAULT 0,
    "FileName"      VARCHAR(255)  NOT NULL,
    "ExportDate"    TIMESTAMP     NOT NULL DEFAULT NOW(),
    "ExportedBy"    VARCHAR(100)  NOT NULL DEFAULT '',
    "Month"         INTEGER       NOT NULL,
    "Year"          INTEGER       NOT NULL,
    "RecordCount"   INTEGER       NOT NULL DEFAULT 0,
    "TotalRSAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "Status"        VARCHAR(20)   NOT NULL DEFAULT 'success',
    "ErrorMessage"  VARCHAR(2000),
    "DocumentId"    INTEGER
);
CREATE INDEX IF NOT EXISTS "IX_TEJExportLogs_TenantId" ON "TEJExportLogs" ("TenantId");
CREATE INDEX IF NOT EXISTS "IX_TEJExportLogs_YearMonth"
    ON "TEJExportLogs" ("TenantId", "Year", "Month");

-- ─────────────────────────────────────────────────────────────────────
-- PART K: SUPPORT TICKETS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "SupportTickets" (
    "Id"          SERIAL        PRIMARY KEY,
    "TenantId"    INTEGER       NOT NULL DEFAULT 0,
    "Title"       VARCHAR(300)  NOT NULL,
    "Description" TEXT          NOT NULL DEFAULT '',
    "Urgency"     VARCHAR(20),
    "Category"    VARCHAR(50),
    "CurrentPage" VARCHAR(500),
    "RelatedUrl"  VARCHAR(1000),
    "Tenant"      VARCHAR(100)  NOT NULL DEFAULT '',
    "UserEmail"   VARCHAR(255),
    "Status"      VARCHAR(20)   NOT NULL DEFAULT 'open',
    "CreatedAt"   TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_SupportTickets_TenantId" ON "SupportTickets" ("TenantId");
CREATE INDEX IF NOT EXISTS "IX_SupportTickets_Status"   ON "SupportTickets" ("Status");

CREATE TABLE IF NOT EXISTS "SupportTicketAttachments" (
    "Id"              SERIAL        PRIMARY KEY,
    "TenantId"        INTEGER       NOT NULL DEFAULT 0,
    "SupportTicketId" INTEGER       NOT NULL
        REFERENCES "SupportTickets"("Id") ON DELETE CASCADE,
    "FileName"        VARCHAR(500)  NOT NULL,
    "FilePath"        VARCHAR(1000),
    "FileSize"        BIGINT        NOT NULL DEFAULT 0,
    "ContentType"     VARCHAR(200),
    "UploadedAt"      TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_SupportTicketAttachments_TicketId"
    ON "SupportTicketAttachments" ("SupportTicketId");

CREATE TABLE IF NOT EXISTS "SupportTicketComments" (
    "Id"              SERIAL        PRIMARY KEY,
    "TenantId"        INTEGER       NOT NULL DEFAULT 0,
    "SupportTicketId" INTEGER       NOT NULL
        REFERENCES "SupportTickets"("Id") ON DELETE CASCADE,
    "Author"          VARCHAR(255)  NOT NULL DEFAULT '',
    "AuthorEmail"     VARCHAR(255),
    "Text"            TEXT          NOT NULL DEFAULT '',
    "IsInternal"      BOOLEAN       NOT NULL DEFAULT FALSE,
    "CreatedAt"       TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_SupportTicketComments_TicketId"
    ON "SupportTicketComments" ("SupportTicketId");

CREATE TABLE IF NOT EXISTS "SupportTicketLinks" (
    "Id"             SERIAL       PRIMARY KEY,
    "TenantId"       INTEGER      NOT NULL DEFAULT 0,
    "SourceTicketId" INTEGER      NOT NULL
        REFERENCES "SupportTickets"("Id") ON DELETE CASCADE,
    "TargetTicketId" INTEGER      NOT NULL
        REFERENCES "SupportTickets"("Id") ON DELETE CASCADE,
    "LinkType"       VARCHAR(30)  NOT NULL DEFAULT 'related',
    "CreatedAt"      TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_SupportTicketLinks_Source"
    ON "SupportTicketLinks" ("SourceTicketId");
CREATE INDEX IF NOT EXISTS "IX_SupportTicketLinks_Target"
    ON "SupportTicketLinks" ("TargetTicketId");

-- ─────────────────────────────────────────────────────────────────────
-- PART L: WORKFLOW ENGINE
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "WorkflowDefinitions" (
    "Id"          SERIAL       PRIMARY KEY,
    "TenantId"    INTEGER      NOT NULL DEFAULT 0,
    "Name"        VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "Nodes"       JSONB        NOT NULL DEFAULT '[]',
    "Edges"       JSONB        NOT NULL DEFAULT '[]',
    "IsActive"    BOOLEAN      NOT NULL DEFAULT TRUE,
    "Version"     INTEGER      NOT NULL DEFAULT 1,
    "CreatedBy"   VARCHAR(100),
    "CreatedAt"   TIMESTAMP    NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMP,
    "ModifiedBy"  VARCHAR(100),
    "IsDeleted"   BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS "IX_WorkflowDefinitions_TenantId"
    ON "WorkflowDefinitions" ("TenantId") WHERE "IsDeleted" = FALSE;

CREATE TABLE IF NOT EXISTS "WorkflowTriggers" (
    "Id"         SERIAL       PRIMARY KEY,
    "TenantId"   INTEGER      NOT NULL DEFAULT 0,
    "WorkflowId" INTEGER      NOT NULL
        REFERENCES "WorkflowDefinitions"("Id") ON DELETE CASCADE,
    "NodeId"     VARCHAR(50)  NOT NULL,
    "EntityType" VARCHAR(30)  NOT NULL,
    "FromStatus" VARCHAR(50),
    "ToStatus"   VARCHAR(50),
    "IsActive"   BOOLEAN      NOT NULL DEFAULT TRUE,
    "CreatedAt"  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_WorkflowTriggers_WorkflowId" ON "WorkflowTriggers" ("WorkflowId");
CREATE INDEX IF NOT EXISTS "IX_WorkflowTriggers_EntityType" ON "WorkflowTriggers" ("EntityType");

CREATE TABLE IF NOT EXISTS "WorkflowExecutions" (
    "Id"                SERIAL       PRIMARY KEY,
    "TenantId"          INTEGER      NOT NULL DEFAULT 0,
    "WorkflowId"        INTEGER      NOT NULL
        REFERENCES "WorkflowDefinitions"("Id") ON DELETE CASCADE,
    "TriggerEntityType" VARCHAR(30)  NOT NULL,
    "TriggerEntityId"   INTEGER      NOT NULL,
    "Status"            VARCHAR(20)  NOT NULL DEFAULT 'running',
    "CurrentNodeId"     VARCHAR(50),
    "Context"           JSONB        NOT NULL DEFAULT '{}',
    "Error"             VARCHAR(1000),
    "StartedAt"         TIMESTAMP    NOT NULL DEFAULT NOW(),
    "CompletedAt"       TIMESTAMP,
    "TriggeredBy"       VARCHAR(100),
    "ResumeAt"          TIMESTAMP,
    "WaitingNodeId"     VARCHAR(50)
);
CREATE INDEX IF NOT EXISTS "IX_WorkflowExecutions_WorkflowId"
    ON "WorkflowExecutions" ("WorkflowId");
CREATE INDEX IF NOT EXISTS "IX_WorkflowExecutions_Status"
    ON "WorkflowExecutions" ("Status");
CREATE INDEX IF NOT EXISTS "IX_WorkflowExecutions_Entity"
    ON "WorkflowExecutions" ("TriggerEntityType", "TriggerEntityId");
CREATE INDEX IF NOT EXISTS "IX_WorkflowExecutions_ResumeAt"
    ON "WorkflowExecutions" ("ResumeAt") WHERE "ResumeAt" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "WorkflowExecutionLogs" (
    "Id"          SERIAL       PRIMARY KEY,
    "TenantId"    INTEGER      NOT NULL DEFAULT 0,
    "ExecutionId" INTEGER      NOT NULL
        REFERENCES "WorkflowExecutions"("Id") ON DELETE CASCADE,
    "NodeId"      VARCHAR(50)  NOT NULL,
    "NodeType"    VARCHAR(50)  NOT NULL,
    "Status"      VARCHAR(20)  NOT NULL,
    "Input"       JSONB,
    "Output"      JSONB,
    "Error"       VARCHAR(500),
    "Duration"    INTEGER,
    "Timestamp"   TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_WorkflowExecutionLogs_ExecutionId"
    ON "WorkflowExecutionLogs" ("ExecutionId");

CREATE TABLE IF NOT EXISTS "WorkflowApprovals" (
    "Id"           SERIAL       PRIMARY KEY,
    "TenantId"     INTEGER      NOT NULL DEFAULT 0,
    "ExecutionId"  INTEGER      NOT NULL
        REFERENCES "WorkflowExecutions"("Id") ON DELETE CASCADE,
    "NodeId"       VARCHAR(50)  NOT NULL,
    "Title"        VARCHAR(200) NOT NULL,
    "Message"      VARCHAR(1000),
    "ApproverRole" VARCHAR(50)  NOT NULL DEFAULT 'manager',
    "ApprovedById" VARCHAR(100),
    "Status"       VARCHAR(20)  NOT NULL DEFAULT 'pending',
    "ResponseNote" VARCHAR(500),
    "TimeoutHours" INTEGER      NOT NULL DEFAULT 24,
    "CreatedAt"    TIMESTAMP    NOT NULL DEFAULT NOW(),
    "RespondedAt"  TIMESTAMP,
    "ExpiresAt"    TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "IX_WorkflowApprovals_ExecutionId"
    ON "WorkflowApprovals" ("ExecutionId");
CREATE INDEX IF NOT EXISTS "IX_WorkflowApprovals_Status"
    ON "WorkflowApprovals" ("Status");

CREATE TABLE IF NOT EXISTS "WorkflowProcessedEntities" (
    "Id"              SERIAL       PRIMARY KEY,
    "TenantId"        INTEGER      NOT NULL DEFAULT 0,
    "TriggerId"       INTEGER      NOT NULL
        REFERENCES "WorkflowTriggers"("Id") ON DELETE CASCADE,
    "EntityType"      VARCHAR(30)  NOT NULL,
    "EntityId"        INTEGER      NOT NULL,
    "ProcessedStatus" VARCHAR(50),
    "ProcessedAt"     TIMESTAMP    NOT NULL DEFAULT NOW(),
    "ExecutionId"     INTEGER
);
CREATE INDEX IF NOT EXISTS "IX_WorkflowProcessedEntities_Trigger"
    ON "WorkflowProcessedEntities" ("TriggerId");
CREATE INDEX IF NOT EXISTS "IX_WorkflowProcessedEntities_Entity"
    ON "WorkflowProcessedEntities" ("EntityType", "EntityId");
CREATE UNIQUE INDEX IF NOT EXISTS "UX_WorkflowProcessedEntities_TriggerEntity"
    ON "WorkflowProcessedEntities" ("TriggerId", "EntityType", "EntityId");

-- ─────────────────────────────────────────────────────────────────────
-- PART M: SYNC MODULE
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sync_changes (
    "Id"              BIGSERIAL    PRIMARY KEY,
    "TenantId"        INTEGER      NOT NULL DEFAULT 0,
    "EntityType"      VARCHAR(80)  NOT NULL,
    "EntityId"        INTEGER      NOT NULL DEFAULT 0,
    "EntityKey"       VARCHAR(128),
    "Operation"       VARCHAR(20)  NOT NULL DEFAULT 'update',
    "DataJson"        TEXT,
    "ChangedAt"       TIMESTAMP    NOT NULL DEFAULT NOW(),
    "ChangedBy"       VARCHAR(100),
    "ChangedByUserId" INTEGER
);
CREATE INDEX IF NOT EXISTS "IX_sync_changes_tenant_time"
    ON sync_changes ("TenantId", "ChangedAt");
CREATE INDEX IF NOT EXISTS "IX_sync_changes_tenant_entity"
    ON sync_changes ("TenantId", "EntityType", "EntityId");

CREATE TABLE IF NOT EXISTS sync_operation_receipts (
    "Id"              BIGSERIAL    PRIMARY KEY,
    "TenantId"        INTEGER      NOT NULL DEFAULT 0,
    "DeviceId"        VARCHAR(100) NOT NULL,
    "OpId"            VARCHAR(100) NOT NULL,
    "Status"          VARCHAR(40)  NOT NULL DEFAULT 'applied',
    "ServerEntityId"  INTEGER,
    "ServerEntityKey" VARCHAR(128),
    "ResponseJson"    TEXT,
    "OperationJson"   TEXT,
    "CreatedByUser"   VARCHAR(256),
    "CreatedByUserId" INTEGER,
    "CreatedAt"       TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "UX_sync_operation_receipts_tenant_device_op"
    ON sync_operation_receipts ("TenantId", "DeviceId", "OpId");

CREATE TABLE IF NOT EXISTS "SyncFailureLog" (
    "Id"           SERIAL        PRIMARY KEY,
    "DeviceId"     VARCHAR(255)  NOT NULL,
    "UserId"       INTEGER,
    "OpId"         VARCHAR(255)  NOT NULL,
    "EntityType"   VARCHAR(100),
    "Status"       VARCHAR(50),
    "ErrorMessage" TEXT,
    "HttpStatus"   INTEGER,
    "HttpBody"     TEXT,
    "Endpoint"     VARCHAR(500),
    "Method"       VARCHAR(10),
    "Timestamp"    TIMESTAMP     NOT NULL DEFAULT NOW(),
    "Resolved"     BOOLEAN       NOT NULL DEFAULT FALSE,
    "ResolvedAt"   TIMESTAMP,
    "Tenant"       VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS "SyncPerformanceLog" (
    "Id"                  SERIAL       PRIMARY KEY,
    "DeviceId"            VARCHAR(255) NOT NULL,
    "UserId"              INTEGER,
    "SyncDuration"        BIGINT       NOT NULL,
    "OperationsAttempted" INTEGER      NOT NULL,
    "OperationsSucceeded" INTEGER      NOT NULL,
    "OperationsFailed"    INTEGER      NOT NULL,
    "BytesSent"           BIGINT,
    "BytesReceived"       BIGINT,
    "Timestamp"           TIMESTAMP    NOT NULL DEFAULT NOW(),
    "Tenant"              VARCHAR(255),
    "NetworkType"         VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS "TokenRefreshLog" (
    "Id"           SERIAL       PRIMARY KEY,
    "UserId"       INTEGER      NOT NULL,
    "Reason"       VARCHAR(100),
    "Success"      BOOLEAN      NOT NULL,
    "ErrorMessage" TEXT,
    "Timestamp"    TIMESTAMP    NOT NULL DEFAULT NOW(),
    "Tenant"       VARCHAR(255),
    "DeviceId"     VARCHAR(255)
);

-- ─────────────────────────────────────────────────────────────────────
-- PART N: OFFLINE HYDRATION
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "OfflineHydrationPreferences" (
    "Id"          SERIAL    PRIMARY KEY,
    "TenantId"    INTEGER   NOT NULL DEFAULT 0,
    "UserId"      INTEGER   NOT NULL,
    "ModulesJson" JSONB     NOT NULL DEFAULT '[]',
    "UpdatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "UX_OfflineHydrationPreferences_TenantUser"
    ON "OfflineHydrationPreferences" ("TenantId", "UserId");

-- ─────────────────────────────────────────────────────────────────────
-- PART O: EXTERNAL ENDPOINTS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ExternalEndpoints" (
    "Id"               SERIAL        PRIMARY KEY,
    "TenantId"         INTEGER       NOT NULL DEFAULT 0,
    "IsDeleted"        BOOLEAN       NOT NULL DEFAULT FALSE,
    "DeletedAt"        TIMESTAMP,
    "DeletedBy"        VARCHAR(100),
    "Name"             VARCHAR(255)  NOT NULL,
    "Slug"             VARCHAR(100)  NOT NULL,
    "Description"      TEXT,
    "ApiKey"           VARCHAR(128)  NOT NULL,
    "IsActive"         BOOLEAN       NOT NULL DEFAULT TRUE,
    "AllowedMethods"   VARCHAR(50)   NOT NULL DEFAULT 'POST',
    "AllowedOrigins"   TEXT,
    "ExpectedSchema"   TEXT,
    "ResponseTemplate" TEXT,
    "WebhookForwardUrl" TEXT,
    "ForwardSecret"    VARCHAR(128),
    "LogRetentionDays" INTEGER       NOT NULL DEFAULT 30,
    "CreatedAt"        TIMESTAMP     NOT NULL DEFAULT NOW(),
    "UpdatedAt"        TIMESTAMP,
    "CreatedBy"        VARCHAR(100)  NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS "UX_ExternalEndpoints_TenantSlug"
    ON "ExternalEndpoints" ("TenantId", "Slug") WHERE "IsDeleted" = FALSE;

CREATE TABLE IF NOT EXISTS "ExternalEndpointLogs" (
    "Id"           SERIAL       PRIMARY KEY,
    "TenantId"     INTEGER      NOT NULL DEFAULT 0,
    "EndpointId"   INTEGER      NOT NULL
        REFERENCES "ExternalEndpoints"("Id") ON DELETE CASCADE,
    "Method"       VARCHAR(10)  NOT NULL DEFAULT 'POST',
    "Headers"      TEXT,
    "QueryString"  TEXT,
    "Body"         TEXT,
    "SourceIp"     VARCHAR(50),
    "StatusCode"   INTEGER      NOT NULL DEFAULT 200,
    "ResponseBody" TEXT,
    "ReceivedAt"   TIMESTAMP    NOT NULL DEFAULT NOW(),
    "ProcessedAt"  TIMESTAMP,
    "IsRead"       BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS "IX_ExternalEndpointLogs_EndpointId"
    ON "ExternalEndpointLogs" ("EndpointId");
CREATE INDEX IF NOT EXISTS "IX_ExternalEndpointLogs_ReceivedAt"
    ON "ExternalEndpointLogs" ("ReceivedAt");

CREATE TABLE IF NOT EXISTS "WebhookForwardJobs" (
    "Id"             SERIAL        PRIMARY KEY,
    "TenantId"       INTEGER       NOT NULL DEFAULT 0,
    "EndpointId"     INTEGER       NOT NULL
        REFERENCES "ExternalEndpoints"("Id") ON DELETE CASCADE,
    "LogId"          INTEGER,
    "ForwardUrl"     VARCHAR(2048) NOT NULL,
    "Body"           TEXT,
    "Secret"         VARCHAR(128),
    "Status"         VARCHAR(20)   NOT NULL DEFAULT 'pending',
    "Attempts"       INTEGER       NOT NULL DEFAULT 0,
    "MaxAttempts"    INTEGER       NOT NULL DEFAULT 3,
    "NextAttemptAt"  TIMESTAMP     NOT NULL DEFAULT NOW(),
    "LastAttemptAt"  TIMESTAMP,
    "LastStatusCode" INTEGER,
    "LastError"      TEXT,
    "ClaimedAt"      TIMESTAMP,
    "ClaimedBy"      VARCHAR(100),
    "CreatedAt"      TIMESTAMP     NOT NULL DEFAULT NOW(),
    "CompletedAt"    TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "IX_WebhookForwardJobs_Pending"
    ON "WebhookForwardJobs" ("Status", "NextAttemptAt")
    WHERE "Status" = 'pending';
CREATE INDEX IF NOT EXISTS "IX_WebhookForwardJobs_EndpointId"
    ON "WebhookForwardJobs" ("EndpointId");

-- ─────────────────────────────────────────────────────────────────────
-- PART P: PURCHASES MODULE
-- GoodsReceipts and ArticleSuppliers already exist; fixed in Part A.
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PurchaseOrders" (
    "Id"                       SERIAL        PRIMARY KEY,
    "TenantId"                 INTEGER       NOT NULL DEFAULT 0,
    "IsDeleted"                BOOLEAN       NOT NULL DEFAULT FALSE,
    "DeletedAt"                TIMESTAMP,
    "DeletedBy"                VARCHAR(100),
    "OrderNumber"              VARCHAR(50)   NOT NULL DEFAULT '',
    "Title"                    VARCHAR(255),
    "Description"              TEXT,
    "SupplierId"               INTEGER       NOT NULL,
    "SupplierName"             VARCHAR(255)  NOT NULL DEFAULT '',
    "SupplierEmail"            VARCHAR(255),
    "SupplierPhone"            VARCHAR(20),
    "SupplierAddress"          VARCHAR(500),
    "SupplierMatriculeFiscale" VARCHAR(100),
    "Status"                   VARCHAR(30)   NOT NULL DEFAULT 'draft',
    "OrderDate"                TIMESTAMP     NOT NULL DEFAULT NOW(),
    "ExpectedDelivery"         TIMESTAMP,
    "ActualDelivery"           TIMESTAMP,
    "Currency"                 VARCHAR(3)    NOT NULL DEFAULT 'TND',
    "SubTotal"                 DECIMAL(18,2) NOT NULL DEFAULT 0,
    "Discount"                 DECIMAL(18,2) NOT NULL DEFAULT 0,
    "DiscountType"             VARCHAR(20)   NOT NULL DEFAULT 'fixed',
    "TaxAmount"                DECIMAL(18,2) NOT NULL DEFAULT 0,
    "FiscalStamp"              DECIMAL(10,3) NOT NULL DEFAULT 0,
    "GrandTotal"               DECIMAL(18,2) NOT NULL DEFAULT 0,
    "PaymentTerms"             VARCHAR(50)   NOT NULL DEFAULT 'immediate',
    "PaymentStatus"            VARCHAR(20)   NOT NULL DEFAULT 'unpaid',
    "Notes"                    TEXT,
    "Tags"                     TEXT[],
    "BillingAddress"           TEXT,
    "DeliveryAddress"          TEXT,
    "ServiceOrderId"           INTEGER,
    "SaleId"                   INTEGER,
    "ApprovedBy"               VARCHAR(100),
    "ApprovalDate"             TIMESTAMP,
    "SentToSupplierAt"         TIMESTAMP,
    "CreatedDate"              TIMESTAMP     NOT NULL DEFAULT NOW(),
    "CreatedBy"                VARCHAR(100)  NOT NULL DEFAULT '',
    "CreatedByName"            VARCHAR(255),
    "ModifiedDate"             TIMESTAMP,
    "ModifiedBy"               VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "IX_PurchaseOrders_TenantId"
    ON "PurchaseOrders" ("TenantId") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_PurchaseOrders_SupplierId"
    ON "PurchaseOrders" ("SupplierId");
CREATE INDEX IF NOT EXISTS "IX_PurchaseOrders_Status"
    ON "PurchaseOrders" ("TenantId", "Status");

CREATE TABLE IF NOT EXISTS "PurchaseOrderItems" (
    "Id"              SERIAL        PRIMARY KEY,
    "TenantId"        INTEGER       NOT NULL DEFAULT 0,
    "PurchaseOrderId" INTEGER       NOT NULL
        REFERENCES "PurchaseOrders"("Id") ON DELETE CASCADE,
    "ArticleId"       INTEGER,
    "ArticleName"     VARCHAR(255),
    "ArticleNumber"   VARCHAR(50),
    "SupplierRef"     VARCHAR(100),
    "Description"     VARCHAR(500)  NOT NULL DEFAULT '',
    "Quantity"        DECIMAL(18,2) NOT NULL DEFAULT 0,
    "ReceivedQty"     DECIMAL(18,2) NOT NULL DEFAULT 0,
    "UnitPrice"       DECIMAL(18,2) NOT NULL DEFAULT 0,
    "TaxRate"         DECIMAL(5,2)  NOT NULL DEFAULT 0,
    "Discount"        DECIMAL(18,2) NOT NULL DEFAULT 0,
    "DiscountType"    VARCHAR(20)   NOT NULL DEFAULT 'fixed',
    "LineTotal"       DECIMAL(18,2) NOT NULL DEFAULT 0,
    "Unit"            VARCHAR(20)   NOT NULL DEFAULT 'pcs',
    "DisplayOrder"    INTEGER       NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "IX_PurchaseOrderItems_PurchaseOrderId"
    ON "PurchaseOrderItems" ("PurchaseOrderId");

CREATE TABLE IF NOT EXISTS "GoodsReceiptItems" (
    "Id"                  SERIAL        PRIMARY KEY,
    "TenantId"            INTEGER       NOT NULL DEFAULT 0,
    "GoodsReceiptId"      INTEGER       NOT NULL
        REFERENCES "GoodsReceipts"("Id") ON DELETE CASCADE,
    "PurchaseOrderItemId" INTEGER       NOT NULL
        REFERENCES "PurchaseOrderItems"("Id") ON DELETE RESTRICT,
    "ArticleId"           INTEGER,
    "ArticleName"         VARCHAR(255),
    "ArticleNumber"       VARCHAR(50),
    "OrderedQty"          DECIMAL(18,2) NOT NULL DEFAULT 0,
    "QuantityReceived"    DECIMAL(18,2) NOT NULL DEFAULT 0,
    "QuantityRejected"    DECIMAL(18,2) NOT NULL DEFAULT 0,
    "RejectionReason"     VARCHAR(500),
    "LocationId"          INTEGER,
    "Notes"               VARCHAR(500)
);
CREATE INDEX IF NOT EXISTS "IX_GoodsReceiptItems_GoodsReceiptId"
    ON "GoodsReceiptItems" ("GoodsReceiptId");
CREATE INDEX IF NOT EXISTS "IX_GoodsReceiptItems_PurchaseOrderItemId"
    ON "GoodsReceiptItems" ("PurchaseOrderItemId");

CREATE TABLE IF NOT EXISTS "SupplierInvoices" (
    "Id"                       SERIAL        PRIMARY KEY,
    "TenantId"                 INTEGER       NOT NULL DEFAULT 0,
    "IsDeleted"                BOOLEAN       NOT NULL DEFAULT FALSE,
    "DeletedAt"                TIMESTAMP,
    "DeletedBy"                VARCHAR(100),
    "InvoiceNumber"            VARCHAR(50)   NOT NULL DEFAULT '',
    "SupplierInvoiceRef"       VARCHAR(100),
    "SupplierId"               INTEGER       NOT NULL,
    "SupplierName"             VARCHAR(255)  NOT NULL DEFAULT '',
    "SupplierMatriculeFiscale" VARCHAR(100),
    "PurchaseOrderId"          INTEGER
        REFERENCES "PurchaseOrders"("Id") ON DELETE SET NULL,
    "GoodsReceiptId"           INTEGER
        REFERENCES "GoodsReceipts"("Id") ON DELETE SET NULL,
    "InvoiceDate"              TIMESTAMP     NOT NULL,
    "DueDate"                  TIMESTAMP     NOT NULL,
    "Status"                   VARCHAR(20)   NOT NULL DEFAULT 'draft',
    "Currency"                 VARCHAR(3)    NOT NULL DEFAULT 'TND',
    "SubTotal"                 DECIMAL(18,2) NOT NULL DEFAULT 0,
    "Discount"                 DECIMAL(18,2) NOT NULL DEFAULT 0,
    "DiscountType"             VARCHAR(20)   NOT NULL DEFAULT 'fixed',
    "TaxAmount"                DECIMAL(18,2) NOT NULL DEFAULT 0,
    "FiscalStamp"              DECIMAL(10,3) NOT NULL DEFAULT 0,
    "GrandTotal"               DECIMAL(18,2) NOT NULL DEFAULT 0,
    "AmountPaid"               DECIMAL(18,2) NOT NULL DEFAULT 0,
    "PaymentMethod"            VARCHAR(50),
    "PaymentDate"              TIMESTAMP,
    "Notes"                    TEXT,
    "RsApplicable"             BOOLEAN       NOT NULL DEFAULT FALSE,
    "RsTypeCode"               VARCHAR(10),
    "RsAmount"                 DECIMAL(18,2) NOT NULL DEFAULT 0,
    "RsRecordId"               INTEGER,
    "RsOperationCode"          VARCHAR(20),
    "Cnpc"                     VARCHAR(20),
    "PriseEnCharge"            BOOLEAN       NOT NULL DEFAULT FALSE,
    "AnneeFacturation"         INTEGER,
    "RefCertifChezDeclarant"   VARCHAR(50),
    "RsTvaCode"                VARCHAR(20),
    "RsTvaTaux"                DECIMAL(5,2),
    "RsTvaAmount"              DECIMAL(18,2) NOT NULL DEFAULT 0,
    "TejActe"                  SMALLINT      NOT NULL DEFAULT 0,
    "FactureEnLigneId"         VARCHAR(100),
    "FactureEnLigneStatus"     VARCHAR(20),
    "FactureEnLigneSentAt"     TIMESTAMP,
    "TejSynced"                BOOLEAN       NOT NULL DEFAULT FALSE,
    "TejSyncDate"              TIMESTAMP,
    "TejSyncStatus"            VARCHAR(20),
    "TejErrorMessage"          VARCHAR(2000),
    "CreatedDate"              TIMESTAMP     NOT NULL DEFAULT NOW(),
    "CreatedBy"                VARCHAR(100)  NOT NULL DEFAULT '',
    "ModifiedDate"             TIMESTAMP,
    "ModifiedBy"               VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "IX_SupplierInvoices_TenantId"
    ON "SupplierInvoices" ("TenantId") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_SupplierInvoices_SupplierId"
    ON "SupplierInvoices" ("SupplierId");
CREATE INDEX IF NOT EXISTS "IX_SupplierInvoices_Status"
    ON "SupplierInvoices" ("TenantId", "Status");
CREATE INDEX IF NOT EXISTS "IX_SupplierInvoices_PO"
    ON "SupplierInvoices" ("PurchaseOrderId");

CREATE TABLE IF NOT EXISTS "SupplierInvoiceItems" (
    "Id"                  SERIAL        PRIMARY KEY,
    "TenantId"            INTEGER       NOT NULL DEFAULT 0,
    "SupplierInvoiceId"   INTEGER       NOT NULL
        REFERENCES "SupplierInvoices"("Id") ON DELETE CASCADE,
    "PurchaseOrderItemId" INTEGER,
    "ArticleId"           INTEGER,
    "ArticleName"         VARCHAR(255),
    "Description"         VARCHAR(500)  NOT NULL DEFAULT '',
    "Quantity"            DECIMAL(18,2) NOT NULL DEFAULT 0,
    "UnitPrice"           DECIMAL(18,2) NOT NULL DEFAULT 0,
    "TaxRate"             DECIMAL(5,2)  NOT NULL DEFAULT 0,
    "LineTotal"           DECIMAL(18,2) NOT NULL DEFAULT 0,
    "DisplayOrder"        INTEGER       NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "IX_SupplierInvoiceItems_InvoiceId"
    ON "SupplierInvoiceItems" ("SupplierInvoiceId");

CREATE TABLE IF NOT EXISTS "ArticleSupplierPriceHistory" (
    "Id"                SERIAL        PRIMARY KEY,
    "TenantId"          INTEGER       NOT NULL DEFAULT 0,
    "ArticleSupplierId" INTEGER       NOT NULL
        REFERENCES "ArticleSuppliers"("Id") ON DELETE CASCADE,
    "OldPrice"          DECIMAL(18,2) NOT NULL,
    "NewPrice"          DECIMAL(18,2) NOT NULL,
    "Currency"          VARCHAR(3)    NOT NULL DEFAULT 'TND',
    "ChangedAt"         TIMESTAMP     NOT NULL DEFAULT NOW(),
    "ChangedBy"         VARCHAR(100)  NOT NULL DEFAULT '',
    "Reason"            VARCHAR(500)
);
CREATE INDEX IF NOT EXISTS "IX_ArticleSupplierPriceHistory_SupplierId"
    ON "ArticleSupplierPriceHistory" ("ArticleSupplierId");

CREATE TABLE IF NOT EXISTS "PurchaseActivities" (
    "Id"              SERIAL        PRIMARY KEY,
    "TenantId"        INTEGER       NOT NULL DEFAULT 0,
    "EntityType"      VARCHAR(30)   NOT NULL,
    "EntityId"        INTEGER       NOT NULL,
    "ActivityType"    VARCHAR(50)   NOT NULL,
    "Description"     TEXT,
    "OldValue"        VARCHAR(500),
    "NewValue"        VARCHAR(500),
    "PerformedBy"     VARCHAR(100)  NOT NULL DEFAULT '',
    "PerformedByName" VARCHAR(255),
    "PerformedAt"     TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_PurchaseActivities_Entity"
    ON "PurchaseActivities" ("TenantId", "EntityType", "EntityId");
CREATE INDEX IF NOT EXISTS "IX_PurchaseActivities_PerformedAt"
    ON "PurchaseActivities" ("PerformedAt");

-- ─────────────────────────────────────────────────────────────────────
-- PART Q: PROJECTS MODULE (remaining tables)
-- ─────────────────────────────────────────────────────────────────────

-- ProjectColumns (Kanban)
CREATE TABLE IF NOT EXISTS "ProjectColumns" (
    "Id"           SERIAL       PRIMARY KEY,
    "TenantId"     INTEGER      NOT NULL DEFAULT 0,
    "ProjectId"    INTEGER      NOT NULL,
    "Name"         VARCHAR(100) NOT NULL,
    "DisplayOrder" INTEGER      NOT NULL DEFAULT 0,
    "Color"        VARCHAR(7),
    CONSTRAINT "FK_ProjectColumns_Projects"
        FOREIGN KEY ("ProjectId") REFERENCES "Projects"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_ProjectColumns_ProjectId"    ON "ProjectColumns"("ProjectId");
CREATE INDEX IF NOT EXISTS "IX_ProjectColumns_TenantId"     ON "ProjectColumns"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_ProjectColumns_DisplayOrder" ON "ProjectColumns"("DisplayOrder");

-- TaskAttachments
CREATE TABLE IF NOT EXISTS "TaskAttachments" (
    "Id"           SERIAL                   PRIMARY KEY,
    "TenantId"     INTEGER                  NOT NULL DEFAULT 0,
    "TaskId"       INTEGER                  NOT NULL,
    "FileName"     VARCHAR(255)             NOT NULL,
    "FilePath"     VARCHAR(500)             NOT NULL,
    "FileSize"     BIGINT                   NOT NULL DEFAULT 0,
    "ContentType"  VARCHAR(100)             NOT NULL,
    "UploadedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UploadedBy"   VARCHAR(100)             NOT NULL,
    CONSTRAINT "FK_TaskAttachments_ProjectTasks"
        FOREIGN KEY ("TaskId") REFERENCES "ProjectTasks"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_TaskAttachments_TaskId"   ON "TaskAttachments"("TaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskAttachments_TenantId" ON "TaskAttachments"("TenantId");

-- TaskChecklists / TaskChecklistItems
CREATE TABLE IF NOT EXISTS "TaskChecklists" (
    "Id"            SERIAL                   PRIMARY KEY,
    "TenantId"      INTEGER                  NOT NULL DEFAULT 0,
    "ProjectTaskId" INTEGER,
    "DailyTaskId"   INTEGER,
    "Title"         VARCHAR(255)             NOT NULL,
    "Description"   TEXT,
    "IsExpanded"    BOOLEAN                  NOT NULL DEFAULT TRUE,
    "SortOrder"     INTEGER                  NOT NULL DEFAULT 0,
    "CreatedDate"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedBy"     VARCHAR(100)             NOT NULL,
    "ModifiedDate"  TIMESTAMP WITH TIME ZONE,
    "ModifiedBy"    VARCHAR(100),
    CONSTRAINT "FK_TaskChecklists_ProjectTasks"
        FOREIGN KEY ("ProjectTaskId") REFERENCES "ProjectTasks"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskChecklists_DailyTasks"
        FOREIGN KEY ("DailyTaskId") REFERENCES "DailyTasks"("Id") ON DELETE CASCADE
);
ALTER TABLE "TaskChecklists" ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "IX_TaskChecklists_ProjectTaskId" ON "TaskChecklists"("ProjectTaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklists_DailyTaskId"   ON "TaskChecklists"("DailyTaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklists_TenantId"      ON "TaskChecklists"("TenantId");

CREATE TABLE IF NOT EXISTS "TaskChecklistItems" (
    "Id"              SERIAL                   PRIMARY KEY,
    "TenantId"        INTEGER                  NOT NULL DEFAULT 0,
    "ChecklistId"     INTEGER                  NOT NULL,
    "Title"           VARCHAR(500)             NOT NULL,
    "IsCompleted"     BOOLEAN                  NOT NULL DEFAULT FALSE,
    "CompletedAt"     TIMESTAMP WITH TIME ZONE,
    "CompletedById"   INTEGER,
    "CompletedByName" VARCHAR(100),
    "SortOrder"       INTEGER                  NOT NULL DEFAULT 0,
    "CreatedDate"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedBy"       VARCHAR(100)             NOT NULL,
    "ModifiedDate"    TIMESTAMP WITH TIME ZONE,
    "ModifiedBy"      VARCHAR(100),
    CONSTRAINT "FK_TaskChecklistItems_TaskChecklists"
        FOREIGN KEY ("ChecklistId") REFERENCES "TaskChecklists"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskChecklistItems_CompletedBy"
        FOREIGN KEY ("CompletedById") REFERENCES "MainAdminUsers"("Id") ON DELETE SET NULL
);
ALTER TABLE "TaskChecklistItems" ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "IX_TaskChecklistItems_ChecklistId" ON "TaskChecklistItems"("ChecklistId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklistItems_TenantId"    ON "TaskChecklistItems"("TenantId");

-- TaskTimeEntries
CREATE TABLE IF NOT EXISTS "TaskTimeEntries" (
    "Id"             SERIAL                   PRIMARY KEY,
    "TenantId"       INTEGER                  NOT NULL DEFAULT 0,
    "ProjectTaskId"  INTEGER,
    "DailyTaskId"    INTEGER,
    "UserId"         INTEGER                  NOT NULL,
    "UserName"       VARCHAR(100),
    "StartTime"      TIMESTAMP WITH TIME ZONE NOT NULL,
    "EndTime"        TIMESTAMP WITH TIME ZONE,
    "Duration"       DECIMAL(18,2)            NOT NULL DEFAULT 0,
    "Description"    TEXT,
    "IsBillable"     BOOLEAN                  NOT NULL DEFAULT TRUE,
    "HourlyRate"     DECIMAL(18,2),
    "TotalCost"      DECIMAL(18,2),
    "WorkType"       VARCHAR(50)              NOT NULL DEFAULT 'work',
    "ApprovalStatus" VARCHAR(20)              NOT NULL DEFAULT 'pending',
    "ApprovedById"   INTEGER,
    "ApprovedDate"   TIMESTAMP WITH TIME ZONE,
    "ApprovalNotes"  TEXT,
    "CreatedDate"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedBy"      VARCHAR(100)             NOT NULL,
    "ModifiedDate"   TIMESTAMP WITH TIME ZONE,
    "ModifiedBy"     VARCHAR(100),
    CONSTRAINT "FK_TaskTimeEntries_ProjectTasks"
        FOREIGN KEY ("ProjectTaskId") REFERENCES "ProjectTasks"("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_TaskTimeEntries_DailyTasks"
        FOREIGN KEY ("DailyTaskId") REFERENCES "DailyTasks"("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_TaskTimeEntries_Users"
        FOREIGN KEY ("UserId") REFERENCES "MainAdminUsers"("Id") ON DELETE NO ACTION,
    CONSTRAINT "FK_TaskTimeEntries_ApprovedBy"
        FOREIGN KEY ("ApprovedById") REFERENCES "MainAdminUsers"("Id") ON DELETE NO ACTION,
    CONSTRAINT "CK_TaskTimeEntries_WorkType"
        CHECK ("WorkType" IN ('work','break','meeting','review','travel','other')),
    CONSTRAINT "CK_TaskTimeEntries_ApprovalStatus"
        CHECK ("ApprovalStatus" IN ('pending','approved','rejected'))
);
CREATE INDEX IF NOT EXISTS "IX_TaskTimeEntries_ProjectTaskId"  ON "TaskTimeEntries"("ProjectTaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskTimeEntries_DailyTaskId"    ON "TaskTimeEntries"("DailyTaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskTimeEntries_UserId"         ON "TaskTimeEntries"("UserId");
CREATE INDEX IF NOT EXISTS "IX_TaskTimeEntries_StartTime"      ON "TaskTimeEntries"("StartTime");
CREATE INDEX IF NOT EXISTS "IX_TaskTimeEntries_ApprovalStatus" ON "TaskTimeEntries"("ApprovalStatus");

-- TaskComments
CREATE TABLE IF NOT EXISTS "TaskComments" (
    "Id"          SERIAL       PRIMARY KEY,
    "TenantId"    INTEGER      NOT NULL DEFAULT 0,
    "TaskId"      INTEGER      NOT NULL,
    "Comment"     TEXT         NOT NULL,
    "CreatedDate" TIMESTAMP    NOT NULL DEFAULT NOW(),
    "CreatedBy"   VARCHAR(100) NOT NULL,
    CONSTRAINT "FK_TaskComments_ProjectTasks"
        FOREIGN KEY ("TaskId") REFERENCES "ProjectTasks"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_TaskComments_TaskId"   ON "TaskComments"("TaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskComments_TenantId" ON "TaskComments"("TenantId");

-- ProjectNotes
CREATE TABLE IF NOT EXISTS "ProjectNotes" (
    "Id"           SERIAL        PRIMARY KEY,
    "TenantId"     INTEGER       NOT NULL DEFAULT 0,
    "ProjectId"    INTEGER       NOT NULL,
    "Content"      VARCHAR(5000) NOT NULL,
    "CreatedDate"  TIMESTAMP     NOT NULL DEFAULT NOW(),
    "CreatedBy"    VARCHAR(255)  NOT NULL,
    "ModifiedDate" TIMESTAMP,
    "ModifiedBy"   VARCHAR(255),
    CONSTRAINT "FK_ProjectNotes_Projects"
        FOREIGN KEY ("ProjectId") REFERENCES "Projects"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_ProjectNotes_ProjectId" ON "ProjectNotes"("ProjectId");
CREATE INDEX IF NOT EXISTS "IX_ProjectNotes_TenantId"  ON "ProjectNotes"("TenantId");

-- ProjectActivities
CREATE TABLE IF NOT EXISTS "ProjectActivities" (
    "Id"                SERIAL        PRIMARY KEY,
    "TenantId"          INTEGER       NOT NULL DEFAULT 0,
    "ProjectId"         INTEGER       NOT NULL,
    "ActionType"        VARCHAR(50)   NOT NULL,
    "Description"       VARCHAR(500)  NOT NULL,
    "Details"           VARCHAR(1000),
    "CreatedDate"       TIMESTAMP     NOT NULL DEFAULT NOW(),
    "CreatedBy"         VARCHAR(255)  NOT NULL,
    "RelatedEntityId"   INTEGER,
    "RelatedEntityType" VARCHAR(100),
    CONSTRAINT "FK_ProjectActivities_Projects"
        FOREIGN KEY ("ProjectId") REFERENCES "Projects"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_ProjectActivities_ProjectId" ON "ProjectActivities"("ProjectId");
CREATE INDEX IF NOT EXISTS "IX_ProjectActivities_TenantId"  ON "ProjectActivities"("TenantId");

-- ProjectSettings
CREATE TABLE IF NOT EXISTS "ProjectSettings" (
    "Id"           SERIAL       PRIMARY KEY,
    "TenantId"     INTEGER      NOT NULL DEFAULT 0,
    "SettingsJson" TEXT         NOT NULL DEFAULT '{}',
    "UpdatedAt"    TIMESTAMP    NOT NULL DEFAULT NOW(),
    "UpdatedBy"    VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "IX_ProjectSettings_TenantId" ON "ProjectSettings"("TenantId");

-- RecurringTasks + RecurringTaskLogs
CREATE TABLE IF NOT EXISTS "RecurringTasks" (
    "Id"                SERIAL       PRIMARY KEY,
    "TenantId"          INTEGER      NOT NULL DEFAULT 0,
    "ProjectTaskId"     INTEGER,
    "DailyTaskId"       INTEGER,
    "RecurrenceType"    VARCHAR(50)  NOT NULL DEFAULT 'daily',
    "DaysOfWeek"        VARCHAR(50),
    "DayOfMonth"        INTEGER,
    "MonthOfYear"       INTEGER,
    "Interval"          INTEGER      NOT NULL DEFAULT 1,
    "StartDate"         TIMESTAMP    NOT NULL,
    "EndDate"           TIMESTAMP,
    "MaxOccurrences"    INTEGER,
    "OccurrenceCount"   INTEGER      NOT NULL DEFAULT 0,
    "NextOccurrence"    TIMESTAMP,
    "LastGeneratedDate" TIMESTAMP,
    "IsActive"          BOOLEAN      NOT NULL DEFAULT TRUE,
    "IsPaused"          BOOLEAN      NOT NULL DEFAULT FALSE,
    "CreatedDate"       TIMESTAMP    NOT NULL DEFAULT NOW(),
    "CreatedBy"         VARCHAR(100) NOT NULL DEFAULT '',
    "ModifiedDate"      TIMESTAMP,
    "ModifiedBy"        VARCHAR(100),
    CONSTRAINT "FK_RecurringTasks_ProjectTasks"
        FOREIGN KEY ("ProjectTaskId") REFERENCES "ProjectTasks"("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_RecurringTasks_DailyTasks"
        FOREIGN KEY ("DailyTaskId") REFERENCES "DailyTasks"("Id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "IX_RecurringTasks_TenantId"       ON "RecurringTasks"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_RecurringTasks_ProjectTaskId"  ON "RecurringTasks"("ProjectTaskId");
CREATE INDEX IF NOT EXISTS "IX_RecurringTasks_DailyTaskId"    ON "RecurringTasks"("DailyTaskId");
CREATE INDEX IF NOT EXISTS "IX_RecurringTasks_NextOccurrence" ON "RecurringTasks"("NextOccurrence")
    WHERE "IsActive" = TRUE AND "IsPaused" = FALSE;

CREATE TABLE IF NOT EXISTS "RecurringTaskLogs" (
    "Id"                     SERIAL       PRIMARY KEY,
    "TenantId"               INTEGER      NOT NULL DEFAULT 0,
    "RecurringTaskId"        INTEGER      NOT NULL,
    "GeneratedProjectTaskId" INTEGER,
    "GeneratedDailyTaskId"   INTEGER,
    "GeneratedDate"          TIMESTAMP    NOT NULL DEFAULT NOW(),
    "ScheduledFor"           TIMESTAMP    NOT NULL,
    "Status"                 VARCHAR(20)  NOT NULL DEFAULT 'created',
    "Notes"                  VARCHAR(500),
    CONSTRAINT "FK_RecurringTaskLogs_RecurringTasks"
        FOREIGN KEY ("RecurringTaskId") REFERENCES "RecurringTasks"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_RecurringTaskLogs_RecurringTaskId"
    ON "RecurringTaskLogs"("RecurringTaskId");
CREATE INDEX IF NOT EXISTS "IX_RecurringTaskLogs_TenantId"
    ON "RecurringTaskLogs"("TenantId");

-- ─────────────────────────────────────────────────────────────────────
-- PART R: DYNAMIC FORMS + ENTITY FORM DOCUMENTS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "DynamicForms" (
    "Id"               SERIAL        PRIMARY KEY,
    "TenantId"         INTEGER       NOT NULL DEFAULT 0,
    "NameEn"           VARCHAR(200)  NOT NULL,
    "NameFr"           VARCHAR(200)  NOT NULL,
    "DescriptionEn"    VARCHAR(1000),
    "DescriptionFr"    VARCHAR(1000),
    "Status"           INTEGER       NOT NULL DEFAULT 0,
    "Version"          INTEGER       NOT NULL DEFAULT 1,
    "Category"         VARCHAR(100),
    "IsPublic"         BOOLEAN       NOT NULL DEFAULT FALSE,
    "PublicSlug"       VARCHAR(200),
    "Fields"           JSONB         NOT NULL DEFAULT '[]',
    "ThankYouSettings" JSONB,
    "CreatedUser"      VARCHAR(100),
    "ModifyUser"       VARCHAR(100),
    "CreatedAt"        TIMESTAMP     NOT NULL DEFAULT NOW(),
    "UpdatedAt"        TIMESTAMP,
    "CreatedBy"        VARCHAR(100),
    "ModifiedBy"       VARCHAR(100),
    "IsDeleted"        BOOLEAN       NOT NULL DEFAULT FALSE,
    "DeletedAt"        TIMESTAMP,
    "DeletedBy"        VARCHAR(100),
    "IsActive"         BOOLEAN       NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS "IX_DynamicForms_TenantId"
    ON "DynamicForms" ("TenantId") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_DynamicForms_PublicSlug"
    ON "DynamicForms" ("PublicSlug") WHERE "IsPublic" = TRUE AND "IsDeleted" = FALSE;

CREATE TABLE IF NOT EXISTS "DynamicFormResponses" (
    "Id"                 SERIAL        PRIMARY KEY,
    "TenantId"           INTEGER       NOT NULL DEFAULT 0,
    "FormId"             INTEGER       NOT NULL,
    "FormVersion"        INTEGER       NOT NULL DEFAULT 1,
    "EntityType"         VARCHAR(50),
    "EntityId"           VARCHAR(100),
    "Responses"          JSONB         NOT NULL DEFAULT '{}',
    "Notes"              VARCHAR(2000),
    "SubmitterName"      VARCHAR(200),
    "SubmitterEmail"     VARCHAR(200),
    "IsPublicSubmission" BOOLEAN       NOT NULL DEFAULT FALSE,
    "SubmittedBy"        VARCHAR(100)  NOT NULL DEFAULT '',
    "SubmittedAt"        TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_DynamicFormResponses_DynamicForms"
        FOREIGN KEY ("FormId") REFERENCES "DynamicForms"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_DynamicFormResponses_FormId"
    ON "DynamicFormResponses" ("FormId");
CREATE INDEX IF NOT EXISTS "IX_DynamicFormResponses_TenantId"
    ON "DynamicFormResponses" ("TenantId");

CREATE TABLE IF NOT EXISTS "EntityFormDocuments" (
    "Id"          SERIAL       PRIMARY KEY,
    "TenantId"    INTEGER      NOT NULL DEFAULT 0,
    "EntityType"  VARCHAR(50)  NOT NULL,
    "EntityId"    INTEGER      NOT NULL,
    "FormId"      INTEGER      NOT NULL,
    "FormVersion" INTEGER      NOT NULL DEFAULT 1,
    "Title"       VARCHAR(200),
    "Status"      INTEGER      NOT NULL DEFAULT 0,
    "Responses"   JSONB        NOT NULL DEFAULT '{}',
    "CreatedAt"   TIMESTAMP    NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMP,
    "CreatedBy"   VARCHAR(100),
    "ModifiedBy"  VARCHAR(100),
    "IsDeleted"   BOOLEAN      NOT NULL DEFAULT FALSE,
    "DeletedAt"   TIMESTAMP,
    "DeletedBy"   VARCHAR(100),
    CONSTRAINT "FK_EntityFormDocuments_DynamicForms"
        FOREIGN KEY ("FormId") REFERENCES "DynamicForms"("Id") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "IX_EntityFormDocuments_TenantId"
    ON "EntityFormDocuments" ("TenantId") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_EntityFormDocuments_Entity"
    ON "EntityFormDocuments" ("TenantId", "EntityType", "EntityId")
    WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_EntityFormDocuments_FormId"
    ON "EntityFormDocuments" ("FormId");

-- ─────────────────────────────────────────────────────────────────────
-- PART S: SYSTEM LOGS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "SystemLogs" (
    "Id"         SERIAL        PRIMARY KEY,
    "TenantId"   INTEGER       NOT NULL DEFAULT 0,
    "Timestamp"  TIMESTAMP     NOT NULL DEFAULT NOW(),
    "Level"      VARCHAR(20)   NOT NULL DEFAULT 'info',
    "Message"    TEXT          NOT NULL,
    "Module"     VARCHAR(100)  NOT NULL,
    "Action"     VARCHAR(50)   NOT NULL DEFAULT 'other',
    "UserId"     VARCHAR(100),
    "UserName"   VARCHAR(200),
    "EntityType" VARCHAR(100),
    "EntityId"   VARCHAR(100),
    "Details"    TEXT,
    "IpAddress"  VARCHAR(45),
    "UserAgent"  TEXT,
    "Metadata"   JSONB
);
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_TenantId"  ON "SystemLogs"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Timestamp" ON "SystemLogs"("Timestamp" DESC);
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Level"     ON "SystemLogs"("Level");
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Module"    ON "SystemLogs"("Module");

-- ─────────────────────────────────────────────────────────────────────
-- PART T: SETTINGS & SYSTEM
-- ─────────────────────────────────────────────────────────────────────

-- ModuleScopeSettings: NOT ITenantEntity — string PK, no TenantId.
-- Queried on every request; must exist for module isolation to work.
CREATE TABLE IF NOT EXISTS "ModuleScopeSettings" (
    "ModuleKey"       VARCHAR(64) NOT NULL PRIMARY KEY,
    "Scope"           VARCHAR(16) NOT NULL DEFAULT 'per_company',
    "UpdatedAt"       TIMESTAMP   NOT NULL DEFAULT NOW(),
    "UpdatedByUserId" INTEGER
);

-- AppSettings: mixed naming (PascalCase Id/"TenantId", snake_case for data cols)
CREATE TABLE IF NOT EXISTS "AppSettings" (
    "Id"          SERIAL       PRIMARY KEY,
    "TenantId"    INTEGER      NOT NULL DEFAULT 0,
    setting_key   VARCHAR(100) NOT NULL,
    setting_value TEXT         NOT NULL DEFAULT '',
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "UX_AppSettings_TenantKey"
    ON "AppSettings" ("TenantId", setting_key);

-- =====================================================================
-- END OF MASTER MIGRATION
-- =====================================================================
