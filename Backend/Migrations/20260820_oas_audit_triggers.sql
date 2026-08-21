-- OAS audit trail: several code comments assert every mutation is captured
-- automatically by a DB trigger writing into oas_audit_log —
--   OasEventService.cs:39-42            "picked up automatically by the DB's
--                                         trg_oas_audit_oas_events trigger"
--   OasPluginActivationService.cs:14-20 "in the generic `trg_oas_audit_*`
--                                         trigger's table list (003_triggers.sql)"
--   OasAuditLog.cs:5                    "every row is written by the
--                                         `oas_audit_row` trigger" (a third,
--                                         slightly different name)
-- but a repo-wide search (tracked .sql/.cs files, including this Migrations
-- folder and every OAS sub-module) found NO `CREATE TRIGGER trg_oas_audit_*`,
-- no `fn_oas_audit_log`/`oas_audit_row` function, and no `public/OAS-SQL/*`
-- scripts at all. Per a prior audit this means oas_audit_log has been
-- silently empty since go-live for every table the code assumes is
-- covered — confirmed still true as of this fix. This migration adds the
-- missing generic trigger function and attaches it to exactly the tables
-- a code comment explicitly names:
--   - oas_events              (OasEventService.cs:39-42)
--   - oas_plugin_activations  (OasPluginActivationService.cs:14-20)
--
-- NOT attached here, flagged rather than guessed: the "same as every other
-- OAS table (spec decision v12)" phrasing in OasPluginActivationService.cs
-- implies every oas_* table should eventually carry this trigger, but no
-- other file names a specific table, and at least one OAS table is known
-- to use a non-`id` primary key column (oas_post_states is keyed by
-- post_id — see OasOfflineSyncService.cs's `post_id as id` aliasing), so
-- blindly attaching a generic "row's id" trigger to "every OAS table"
-- could silently mis-record or error on tables with a different key
-- shape. Extending coverage to the rest of the OAS schema should be a
-- deliberate follow-up once each table's shape is confirmed, one table at
-- a time — not inferred here.
--
-- Actor attribution gap (flagged, not fabricated): the standard way to get
-- app-level context (which user made this write) into a trigger is a
-- session-scoped GUC the app sets before saving, e.g.
-- `SET LOCAL oas.current_user_id = '<uuid>'`. This trigger reads exactly
-- that (`current_setting('oas.current_user_id', true)`), but a repo-wide
-- search found NO place in the C# code that ever sets any `oas.*` GUC —
-- OasDbContext.SaveChangesAsync/StampAudit stamps CreatedAt/UpdatedAt/
-- TenantId on the CLR entity only, never a Postgres session setting. Until
-- a companion application-side change adds that (the natural place is
-- OasDbContext, alongside StampAudit), actor_id on every trigger-written
-- row will be NULL. This migration does not invent an actor to fill that
-- column.
--
-- tenant_id does not have the same problem: every covered table already
-- carries its own tenant_id column (IOasTenantEntity), so the trigger
-- reads it directly off the affected row (NEW for insert/update, OLD for
-- delete) instead of depending on a session GUC.
--
-- Deployment note: unlike the other files in this folder, OAS explicitly
-- does NOT run through Program.cs's idempotent-startup-block mechanism —
-- OasDbContext's own doc comment states OAS schema is provisioned by "the
-- operator running public/OAS-SQL/001..004 by hand" against each tenant's
-- OAS database (a separate connection per tenant, resolved via
-- TenantConnectionResolver — never the app's main ApplicationDbContext).
-- This file is written in the same idempotent style as the rest of this
-- folder for review consistency, but — same as the rest of the OAS
-- schema — it must be run by hand against each provisioned OAS tenant
-- database; nothing in this app applies it automatically.

CREATE OR REPLACE FUNCTION fn_oas_audit_log() RETURNS trigger AS $$
DECLARE
    v_source jsonb := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
    v_tenant_id int;
    v_entity_id uuid;
    v_actor_id uuid;
BEGIN
    BEGIN
        v_tenant_id := (v_source ->> 'tenant_id')::int;
    EXCEPTION WHEN OTHERS THEN
        v_tenant_id := NULL;
    END;

    BEGIN
        v_entity_id := (v_source ->> 'id')::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_entity_id := NULL;
    END;

    -- See "Actor attribution gap" above — NULL until the app sets this GUC.
    BEGIN
        v_actor_id := NULLIF(current_setting('oas.current_user_id', true), '')::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_actor_id := NULL;
    END;

    INSERT INTO oas_audit_log (id, tenant_id, entity_table, entity_id, action, actor_id, before, after, reason, occurred_at)
    VALUES (
        gen_random_uuid(),
        v_tenant_id,
        TG_TABLE_NAME,
        v_entity_id,
        lower(TG_OP)::oas_audit_action,
        v_actor_id,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END,
        NULL,
        now()
    );

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'oas_events') THEN
        DROP TRIGGER IF EXISTS trg_oas_audit_oas_events ON oas_events;
        CREATE TRIGGER trg_oas_audit_oas_events
            AFTER INSERT OR UPDATE OR DELETE ON oas_events
            FOR EACH ROW EXECUTE FUNCTION fn_oas_audit_log();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'oas_plugin_activations') THEN
        DROP TRIGGER IF EXISTS trg_oas_audit_oas_plugin_activations ON oas_plugin_activations;
        CREATE TRIGGER trg_oas_audit_oas_plugin_activations
            AFTER INSERT OR UPDATE OR DELETE ON oas_plugin_activations
            FOR EACH ROW EXECUTE FUNCTION fn_oas_audit_log();
    END IF;
END $$;
