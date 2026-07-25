-- Processes module: admin scheduled background jobs.
-- Global (not tenant-scoped). Run once against the primary database.

CREATE TABLE IF NOT EXISTS "ProcessSchedules" (
  "Id"                      SERIAL PRIMARY KEY,
  "Key"                     VARCHAR(120) NOT NULL UNIQUE,
  "Name"                    VARCHAR(200) NOT NULL,
  "Enabled"                 BOOLEAN NOT NULL DEFAULT TRUE,
  "Paused"                  BOOLEAN NOT NULL DEFAULT FALSE,
  "IntervalMinutes"         INTEGER NOT NULL DEFAULT 60,
  "MaxRetries"              INTEGER NOT NULL DEFAULT 3,
  "RetryBackoffSeconds"     INTEGER NOT NULL DEFAULT 60,
  "ConfigJson"              JSONB NOT NULL DEFAULT '{}'::jsonb,
  "Timezone"                VARCHAR(60) NOT NULL DEFAULT 'UTC',
  "NextRunAt"               TIMESTAMP NULL,
  "LastRunAt"               TIMESTAMP NULL,
  "LastStatus"              VARCHAR(20) NULL,
  "ConsecutiveFailures"     INTEGER NOT NULL DEFAULT 0,
  "BlockReason"             VARCHAR(500) NULL,
  "UpdatedAt"               TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  "CreatedAt"               TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS "IX_ProcessSchedules_NextRunAt"
  ON "ProcessSchedules" ("Enabled", "Paused", "NextRunAt");

CREATE TABLE IF NOT EXISTS "ProcessRuns" (
  "Id"              BIGSERIAL PRIMARY KEY,
  "ProcessKey"      VARCHAR(120) NOT NULL,
  "TriggeredBy"     VARCHAR(20)  NOT NULL DEFAULT 'schedule',
  "Attempt"         INTEGER NOT NULL DEFAULT 1,
  "Status"          VARCHAR(20)  NOT NULL DEFAULT 'running',
  "StartedAt"       TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  "FinishedAt"      TIMESTAMP NULL,
  "DurationMs"      INTEGER NULL,
  "ItemsProcessed"  INTEGER NULL,
  "Error"           TEXT NULL,
  "BlockReason"     VARCHAR(500) NULL,
  "NextRetryAt"     TIMESTAMP NULL,
  "OutputJson"      JSONB NULL
);

CREATE INDEX IF NOT EXISTS "IX_ProcessRuns_Key_StartedAt"
  ON "ProcessRuns" ("ProcessKey", "StartedAt" DESC);
