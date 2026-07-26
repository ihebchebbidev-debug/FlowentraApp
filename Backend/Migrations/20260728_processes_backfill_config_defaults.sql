-- ─────────────────────────────────────────────────────────────────────────────
-- Backfill config defaults for every process schedule row so a fresh install
-- and an upgraded one show the SAME values in Administration > Processes.
--
-- Idempotent: each statement uses `jsonb_set` with the create-missing flag ON
-- and only writes the key when it isn't already present, so re-running this
-- migration on a database that already has admin overrides is a no-op for
-- those keys.
--
-- Defaults MUST match Backend/Modules/Processes/Services/ProcessConfigSchema.cs
-- — if you change a fallback there, add a follow-up migration that writes the
-- same value here so the two never drift.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
    r        RECORD;
    cfg      jsonb;
    seed     jsonb;
    raw_cfg  text;
    -- (process_key, jsonb defaults) — mirrors ProcessConfigSchemas.All.
    defaults CONSTANT jsonb := '{
        "admin.invoices-mark-overdue":               { "grace_days": 0 },
        "admin.offers-mark-expired":                 { "grace_days": 0 },
        "admin.dispatches-mark-missed":              { "grace_hours": 2 },
        "admin.payment-installments-mark-overdue":   { "grace_days": 0 },
        "admin.support-tickets-autoclose-resolved":  { "days_resolved": 7 },
        "admin.draft-offers-purge":                  { "age_days": 60 },
        "admin.draft-invoices-purge":                { "age_days": 60 },
        "admin.notifications-purge-read":            { "age_days": 30 },
        "admin.notifications-purge-stale-unread":    { "age_days": 180 },
        "admin.calendar-events-purge-past":          { "age_days": 180 },
        "admin.sync-changes-purge":                  { "age_days": 30 },
        "admin.sync-receipts-purge":                 { "age_days": 30 },
        "admin.webhook-jobs-purge":                  { "age_days": 30 },
        "admin.external-endpoint-logs-purge":        { "fallback_retention_days": 30 },
        "admin.dispatch-audit-purge":                { "age_days": 180 },
        "admin.hr-audit-purge":                      { "age_days": 365 },
        "admin.soft-deleted-purge":                  { "age_days": 90 },
        "admin.recurring-task-logs-purge":           { "age_days": 180 },
        "admin.purge-system-logs":                   { "retention_days": 30, "run_retention_days": 30 },
        "admin.retry-failed-emails":                 { "batch_size": 50 }
    }'::jsonb;
BEGIN
    -- Read the raw text so we can defensively parse each row: some pre-existing
    -- rows carry malformed or partial JSON (whitespace, half-written strings)
    -- that would otherwise abort the whole migration with a JSON syntax error.
    FOR r IN
        SELECT "Key", "ConfigJson"::text AS raw
        FROM "ProcessSchedules"
    LOOP
        seed := defaults -> r."Key";
        IF seed IS NULL THEN
            CONTINUE; -- unknown key (dev-only schedule); leave untouched.
        END IF;

        raw_cfg := COALESCE(NULLIF(btrim(r.raw), ''), '{}');
        BEGIN
            cfg := raw_cfg::jsonb;
            IF jsonb_typeof(cfg) <> 'object' THEN
                cfg := '{}'::jsonb;
            END IF;
        EXCEPTION WHEN others THEN
            -- Unparseable legacy value: treat as empty so defaults still land.
            cfg := '{}'::jsonb;
        END;

        -- Merge only the keys that are ABSENT from the row: `seed || cfg`
        -- lets the existing config win, so admin overrides are preserved.
        UPDATE "ProcessSchedules"
        SET "ConfigJson" = (seed || cfg),
            "UpdatedAt"  = NOW()
        WHERE "Key" = r."Key"
          AND (seed - ARRAY(SELECT jsonb_object_keys(cfg))) <> '{}'::jsonb;
    END LOOP;
END $$;
