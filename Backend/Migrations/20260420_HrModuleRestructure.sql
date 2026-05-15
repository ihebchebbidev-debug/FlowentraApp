-- ============================================================================
-- HR Module restructure migration (Tunisia-compliant)
-- ----------------------------------------------------------------------------
-- 1. Drops attendance tables (no longer in scope per client spec)
-- 2. Adds: hr_bonus_costs, hr_audit_logs, hr_cnss_rates, hr_public_holidays,
--          hr_employee_documents, hr_salary_history
-- All new tables include TenantId NOT NULL DEFAULT 0 (multi-tenant pattern)
-- ============================================================================

BEGIN;

-- ---- 1. Drop attendance (out of scope) ----
DROP TABLE IF EXISTS hr_attendance_records CASCADE;
DROP TABLE IF EXISTS hr_attendance_settings CASCADE;

-- ---- 2. hr_bonus_costs ----
CREATE TABLE IF NOT EXISTS hr_bonus_costs (
    id              SERIAL PRIMARY KEY,
    "TenantId"      INT NOT NULL DEFAULT 0,
    user_id         INT NOT NULL,
    kind            VARCHAR(40) NOT NULL DEFAULT 'bonus',
    category        VARCHAR(80),
    label           VARCHAR(200) NOT NULL,
    amount          DECIMAL(14,3) NOT NULL DEFAULT 0,
    frequency       VARCHAR(20) NOT NULL DEFAULT 'monthly',
    year            INT NOT NULL,
    month           INT NOT NULL,
    affects_payroll BOOLEAN NOT NULL DEFAULT TRUE,
    subject_to_cnss BOOLEAN NOT NULL DEFAULT FALSE,
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS ix_hr_bonus_costs_user      ON hr_bonus_costs(user_id);
CREATE INDEX IF NOT EXISTS ix_hr_bonus_costs_period    ON hr_bonus_costs(year, month);
CREATE INDEX IF NOT EXISTS ix_hr_bonus_costs_tenant    ON hr_bonus_costs("TenantId");

-- ---- 3. hr_audit_logs ----
CREATE TABLE IF NOT EXISTS hr_audit_logs (
    id            SERIAL PRIMARY KEY,
    "TenantId"    INT NOT NULL DEFAULT 0,
    user_id       INT NOT NULL,
    event_type    VARCHAR(60) NOT NULL,
    description   VARCHAR(500),
    payload       TEXT,
    actor_user_id INT,
    actor_name    VARCHAR(200),
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_hr_audit_logs_user    ON hr_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS ix_hr_audit_logs_event   ON hr_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS ix_hr_audit_logs_tenant  ON hr_audit_logs("TenantId");

-- ---- 4. hr_cnss_rates ----
CREATE TABLE IF NOT EXISTS hr_cnss_rates (
    id                          SERIAL PRIMARY KEY,
    "TenantId"                  INT NOT NULL DEFAULT 0,
    effective_from              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    employee_rate               DECIMAL(8,6) NOT NULL DEFAULT 0.0918,
    employer_rate               DECIMAL(8,6) NOT NULL DEFAULT 0.1657,
    css_rate                    DECIMAL(8,6) NOT NULL DEFAULT 0.01,
    salary_ceiling              DECIMAL(14,3) NOT NULL DEFAULT 0,
    abattement_head_of_family   DECIMAL(14,3) NOT NULL DEFAULT 150,
    abattement_per_child        DECIMAL(14,3) NOT NULL DEFAULT 100,
    irpp_brackets               TEXT,
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    notes                       VARCHAR(300),
    created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_hr_cnss_rates_tenant ON hr_cnss_rates("TenantId");

-- ---- 5. hr_public_holidays ----
CREATE TABLE IF NOT EXISTS hr_public_holidays (
    id           SERIAL PRIMARY KEY,
    "TenantId"   INT NOT NULL DEFAULT 0,
    date         DATE NOT NULL,
    name         VARCHAR(150) NOT NULL,
    category     VARCHAR(50) NOT NULL DEFAULT 'civil',
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_hr_public_holidays_date   ON hr_public_holidays(date);
CREATE INDEX IF NOT EXISTS ix_hr_public_holidays_tenant ON hr_public_holidays("TenantId");

-- ---- 6. hr_employee_documents ----
CREATE TABLE IF NOT EXISTS hr_employee_documents (
    id           SERIAL PRIMARY KEY,
    "TenantId"   INT NOT NULL DEFAULT 0,
    user_id      INT NOT NULL,
    doc_type     VARCHAR(40) NOT NULL DEFAULT 'other',
    title        VARCHAR(255) NOT NULL,
    file_url     VARCHAR(1000) NOT NULL,
    file_name    VARCHAR(300),
    mime_type    VARCHAR(120),
    file_size    BIGINT,
    issued_date  TIMESTAMP,
    expires_at   TIMESTAMP,
    uploaded_by  INT,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted   BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS ix_hr_employee_documents_user   ON hr_employee_documents(user_id);
CREATE INDEX IF NOT EXISTS ix_hr_employee_documents_tenant ON hr_employee_documents("TenantId");

-- ---- 7. hr_salary_history ----
CREATE TABLE IF NOT EXISTS hr_salary_history (
    id              SERIAL PRIMARY KEY,
    "TenantId"      INT NOT NULL DEFAULT 0,
    user_id         INT NOT NULL,
    previous_gross  DECIMAL(14,3),
    new_gross       DECIMAL(14,3) NOT NULL,
    currency        VARCHAR(10) NOT NULL DEFAULT 'TND',
    effective_date  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason          VARCHAR(300),
    changed_by      INT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_hr_salary_history_user   ON hr_salary_history(user_id);
CREATE INDEX IF NOT EXISTS ix_hr_salary_history_tenant ON hr_salary_history("TenantId");

COMMIT;
