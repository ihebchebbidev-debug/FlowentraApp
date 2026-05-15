-- =====================================================================
-- Normalize hr_employee_salary_configs address columns
--
-- Some tenant DBs were created with `address_line_1` / `address_line_2`
-- (from earlier Neon/migration scripts), while the live source-of-truth
-- schema uses `address_line1` / `address_line2` (no underscore before
-- the digit). The EF model (HrEmployeeSalaryConfig) now maps to
-- `address_line1` / `address_line2`, so this migration aligns every
-- tenant DB to that canonical naming.
--
-- Safe / idempotent: can be run multiple times on any tenant.
-- =====================================================================
BEGIN;

DO $$
BEGIN
    -- ---- address_line_1 -> address_line1 -----------------------------
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hr_employee_salary_configs'
          AND column_name = 'address_line_1'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'hr_employee_salary_configs'
              AND column_name = 'address_line1'
        ) THEN
            -- Both exist: merge data (prefer existing canonical value),
            -- then drop the legacy column.
            EXECUTE 'UPDATE hr_employee_salary_configs
                     SET address_line1 = COALESCE(address_line1, address_line_1)';
            EXECUTE 'ALTER TABLE hr_employee_salary_configs
                     DROP COLUMN address_line_1';
        ELSE
            EXECUTE 'ALTER TABLE hr_employee_salary_configs
                     RENAME COLUMN address_line_1 TO address_line1';
        END IF;
    END IF;

    -- ---- address_line_2 -> address_line2 -----------------------------
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hr_employee_salary_configs'
          AND column_name = 'address_line_2'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'hr_employee_salary_configs'
              AND column_name = 'address_line2'
        ) THEN
            EXECUTE 'UPDATE hr_employee_salary_configs
                     SET address_line2 = COALESCE(address_line2, address_line_2)';
            EXECUTE 'ALTER TABLE hr_employee_salary_configs
                     DROP COLUMN address_line_2';
        ELSE
            EXECUTE 'ALTER TABLE hr_employee_salary_configs
                     RENAME COLUMN address_line_2 TO address_line2';
        END IF;
    END IF;

    -- ---- Ensure canonical columns exist (fresh / partial schemas) ----
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hr_employee_salary_configs'
          AND column_name = 'address_line1'
    ) THEN
        EXECUTE 'ALTER TABLE hr_employee_salary_configs
                 ADD COLUMN address_line1 VARCHAR(200) NULL';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hr_employee_salary_configs'
          AND column_name = 'address_line2'
    ) THEN
        EXECUTE 'ALTER TABLE hr_employee_salary_configs
                 ADD COLUMN address_line2 VARCHAR(200) NULL';
    END IF;
END$$;

COMMIT;