-- =============================================================================
-- HR Module — Round 1 migration
-- Adds contract tracking fields to hr_employee_salary_configs
-- Safe to run multiple times (IF NOT EXISTS).
-- =============================================================================

ALTER TABLE hr_employee_salary_configs
    ADD COLUMN IF NOT EXISTS contract_type VARCHAR(20) NULL,
    ADD COLUMN IF NOT EXISTS contract_end_date TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS ix_hr_employee_salary_configs_contract_end_date
    ON hr_employee_salary_configs (contract_end_date)
    WHERE contract_end_date IS NOT NULL;

-- For the active-leaves endpoint (cheap, supports the date-range scan)
CREATE INDEX IF NOT EXISTS ix_user_leaves_status_dates
    ON user_leaves (status, start_date, end_date);