BEGIN;

CREATE TABLE IF NOT EXISTS hr_attendance (
    id SERIAL PRIMARY KEY,
    "TenantId" INT NOT NULL DEFAULT 0,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    check_in TIMESTAMP NULL,
    check_out TIMESTAMP NULL,
    break_minutes INT NOT NULL DEFAULT 0,
    total_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    overtime_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(40) NOT NULL DEFAULT 'present',
    notes TEXT NULL,
    source VARCHAR(40) NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_hr_attendance_user_date UNIQUE ("TenantId", user_id, date)
);

CREATE INDEX IF NOT EXISTS ix_hr_attendance_period ON hr_attendance("TenantId", date, user_id);

CREATE TABLE IF NOT EXISTS hr_attendance_settings (
    id SERIAL PRIMARY KEY,
    "TenantId" INT NOT NULL DEFAULT 0,
    work_days_json TEXT NOT NULL DEFAULT '[1,2,3,4,5]',
    standard_hours_per_day DECIMAL(10,2) NOT NULL DEFAULT 8,
    overtime_threshold_hours DECIMAL(10,2) NOT NULL DEFAULT 8,
    overtime_multiplier DECIMAL(10,2) NOT NULL DEFAULT 1.75,
    late_threshold_minutes INT NOT NULL DEFAULT 15,
    rounding_method VARCHAR(30) NOT NULL DEFAULT '15min',
    calculation_method VARCHAR(30) NOT NULL DEFAULT 'actual_hours',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO hr_attendance_settings ("TenantId")
SELECT 0
WHERE NOT EXISTS (SELECT 1 FROM hr_attendance_settings WHERE "TenantId" = 0);

COMMIT;