-- ─────────────────────────────────────────────────────────────────────────────
-- ProcessRuns: indexes for the two key-agnostic scans.
--
-- The only existing index is ("ProcessKey", "StartedAt" DESC), which cannot
-- serve queries that filter on "StartedAt" alone. Those run on every scheduler
-- tick / hourly sweep and on every purge:
--
--   • ReconcileStaleRunsAsync  — WHERE "Status" = 'running' AND "FinishedAt" IS NULL AND "StartedAt" < ?
--   • run-history safety trim  — WHERE "StartedAt" < ?
--   • PurgeSystemLogsHandler   — WHERE "StartedAt" < ?
--   • GET /api/processes/running-keys — WHERE "Status" = 'running' AND "StartedAt" >= ?
--
-- Without them every one of those is a full sequential scan of a table that
-- grows by thousands of rows a day (retry-failed-emails alone runs every 5 min).
--
-- Idempotent — safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "IX_ProcessRuns_StartedAt"
  ON "ProcessRuns" ("StartedAt");

-- Tiny partial index: the set of in-flight runs is at most a handful of rows,
-- so the running-keys endpoint and the stale reconcile become index-only.
CREATE INDEX IF NOT EXISTS "IX_ProcessRuns_Running"
  ON "ProcessRuns" ("StartedAt")
  WHERE "Status" = 'running' AND "FinishedAt" IS NULL;
