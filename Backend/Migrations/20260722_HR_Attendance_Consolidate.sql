-- ============================================================================
-- HR Attendance schema consolidation
-- ----------------------------------------------------------------------------
-- Single source of truth for `hr_attendance` and `hr_attendance_settings`.
-- Reconciles the drift left by:
--   * Backend/Neon/26_hr_module.sql           (created dead hr_attendance_records
--                                              and an old-shape settings table)
--   * 20260420_HrModuleRestructure.sql        (dropped settings as "out of scope")
--   * HR_Round2_Attendance.sql (removed)      (correct constraint, wrong `date` type)
--   * 20260530_Master_Migration.sql           (correct types, missing UNIQUE)
--   * 20260530_Comprehensive_Missing_Tables.sql (same as Master)
--
-- Final shape MUST match the EF models:
--   MyApi.Modules.HR.Models.HrAttendance         -> hr_attendance
--   MyApi.Modules.HR.Models.HrAttendanceSettings -> hr_attendance_settings
--
-- Every step is idempotent so the migration is safe on fresh and existing DBs.
-- ============================================================================

BEGIN;

-- ---- 0. Remove the dead relic table (never mapped by any EF entity) ----
DROP TABLE IF EXISTS hr_attendance_records CASCADE;

-- ---- 1. hr_attendance -------------------------------------------------------
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

-- Coerce legacy DATE column (HR_Round2 baseline) to TIMESTAMP to match the model.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hr_attendance'
          AND column_name = 'date'
          AND data_type = 'date'
    ) THEN
        ALTER TABLE hr_attendance
            ALTER COLUMN date TYPE TIMESTAMP USING date::timestamp;
    END IF;
END $$;

-- Backfill the UNIQUE constraint on databases created by Master / Comprehensive
-- before this migration existed. Deduplicate first (keep earliest row per key).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_hr_attendance_user_date'
          AND conrelid = 'hr_attendance'::regclass
    ) THEN
        DELETE FROM hr_attendance a
        USING hr_attendance b
        WHERE a.id > b.id
          AND a."TenantId" = b."TenantId"
          AND a.user_id    = b.user_id
          AND a.date       = b.date;

        ALTER TABLE hr_attendance
            ADD CONSTRAINT uq_hr_attendance_user_date
            UNIQUE ("TenantId", user_id, date);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IX_hr_attendance_user_date"
    ON hr_attendance (user_id, date);
CREATE INDEX IF NOT EXISTS ix_hr_attendance_period
    ON hr_attendance ("TenantId", date, user_id);

-- ---- 2. hr_attendance_settings ---------------------------------------------
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

-- One settings row per tenant.
CREATE UNIQUE INDEX IF NOT EXISTS ix_hr_attendance_settings_tenant
    ON hr_attendance_settings ("TenantId");

-- Seed a default row for the shared tenant (0) when absent.
INSERT INTO hr_attendance_settings ("TenantId")
SELECT 0
WHERE NOT EXISTS (SELECT 1 FROM hr_attendance_settings WHERE "TenantId" = 0);

COMMIT;