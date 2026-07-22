-- HR module schema
-- Includes TenantId in all tables for multi-tenancy isolation.

CREATE TABLE IF NOT EXISTS hr_employee_salary_configs (
    id SERIAL PRIMARY KEY,
    "TenantId" INT NOT NULL DEFAULT 0,
    user_id INT NOT NULL,
    gross_salary NUMERIC(18,3) NOT NULL DEFAULT 0,
    is_head_of_family BOOLEAN NOT NULL DEFAULT FALSE,
    children_count INT NOT NULL DEFAULT 0,
    custom_deductions NUMERIC(18,3) NULL,
    bank_account VARCHAR(100) NULL,
    cnss_number VARCHAR(100) NULL,
    hire_date DATE NULL,
    department VARCHAR(100) NULL,
    position VARCHAR(100) NULL,
    employment_type VARCHAR(50) NOT NULL DEFAULT 'full_time',
    cin VARCHAR(50) NULL,
    birth_date DATE NULL,
    marital_status VARCHAR(20) NULL,
    address_line1 VARCHAR(200) NULL,
    address_line2 VARCHAR(200) NULL,
    city VARCHAR(100) NULL,
    postal_code VARCHAR(20) NULL,
    emergency_contact_name VARCHAR(200) NULL,
    emergency_contact_phone VARCHAR(30) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_hr_employee_salary_configs_tenant_user
    ON hr_employee_salary_configs ("TenantId", user_id);
CREATE INDEX IF NOT EXISTS ix_hr_employee_salary_configs_tenantid
    ON hr_employee_salary_configs ("TenantId");

-- Attendance tables (hr_attendance, hr_attendance_settings) live in the
-- consolidated migration Backend/Migrations/20260722_HR_Attendance_Consolidate.sql.
-- The legacy hr_attendance_records table was never mapped by any EF model
-- and has been removed from this baseline.

CREATE TABLE IF NOT EXISTS hr_departments (
    id SERIAL PRIMARY KEY,
    "TenantId" INT NOT NULL DEFAULT 0,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NULL,
    parent_id INT NULL,
    manager_id INT NULL,
    description TEXT NULL,
    position INT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_hr_departments_tenant_name
    ON hr_departments ("TenantId", name);
CREATE INDEX IF NOT EXISTS ix_hr_departments_tenantid
    ON hr_departments ("TenantId");

CREATE TABLE IF NOT EXISTS hr_leave_balances (
    id SERIAL PRIMARY KEY,
    "TenantId" INT NOT NULL DEFAULT 0,
    user_id INT NOT NULL,
    year INT NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    annual_allowance NUMERIC(10,2) NOT NULL DEFAULT 0,
    used NUMERIC(10,2) NOT NULL DEFAULT 0,
    pending NUMERIC(10,2) NOT NULL DEFAULT 0,
    remaining NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_hr_leave_balances_tenant_user_year_type
    ON hr_leave_balances ("TenantId", user_id, year, leave_type);
CREATE INDEX IF NOT EXISTS ix_hr_leave_balances_tenantid
    ON hr_leave_balances ("TenantId");

CREATE TABLE IF NOT EXISTS hr_payroll_runs (
    id SERIAL PRIMARY KEY,
    "TenantId" INT NOT NULL DEFAULT 0,
    month INT NOT NULL,
    year INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    total_gross NUMERIC(18,3) NOT NULL DEFAULT 0,
    total_net NUMERIC(18,3) NOT NULL DEFAULT 0,
    created_by INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS ix_hr_payroll_runs_tenant_year_month
    ON hr_payroll_runs ("TenantId", year, month);
CREATE INDEX IF NOT EXISTS ix_hr_payroll_runs_tenantid
    ON hr_payroll_runs ("TenantId");

CREATE TABLE IF NOT EXISTS hr_payroll_entries (
    id SERIAL PRIMARY KEY,
    "TenantId" INT NOT NULL DEFAULT 0,
    payroll_run_id INT NOT NULL,
    user_id INT NOT NULL,
    gross_salary NUMERIC(18,3) NOT NULL DEFAULT 0,
    cnss NUMERIC(18,3) NOT NULL DEFAULT 0,
    taxable_gross NUMERIC(18,3) NOT NULL DEFAULT 0,
    abattement NUMERIC(18,3) NOT NULL DEFAULT 0,
    taxable_base NUMERIC(18,3) NOT NULL DEFAULT 0,
    irpp NUMERIC(18,3) NOT NULL DEFAULT 0,
    css NUMERIC(18,3) NOT NULL DEFAULT 0,
    net_salary NUMERIC(18,3) NOT NULL DEFAULT 0,
    worked_days NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
    overtime_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
    leave_days NUMERIC(10,2) NOT NULL DEFAULT 0,
    details TEXT NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_hr_payroll_entries_run
        FOREIGN KEY (payroll_run_id) REFERENCES hr_payroll_runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_hr_payroll_entries_tenant_run_user
    ON hr_payroll_entries ("TenantId", payroll_run_id, user_id);
CREATE INDEX IF NOT EXISTS ix_hr_payroll_entries_tenantid
    ON hr_payroll_entries ("TenantId");
