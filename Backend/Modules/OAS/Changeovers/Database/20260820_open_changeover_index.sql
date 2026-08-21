-- =====================================================
-- OAS Changeovers: one open changeover per post
-- Run this by hand against each OAS tenant database.
--
-- This module has no EF Core migrations (OasDbContext: "No migrations. The
-- schema is created by the operator running public/OAS-SQL/001..004 by
-- hand") and MyApi.Infrastructure.DatabaseSchemaSynchronizer only ever
-- auto-repairs missing TABLES/COLUMNS, never indexes ("Foreign keys and
-- indexes are intentionally left to migrations") — so the partial unique
-- index declared in OasChangeoverConfiguration.cs
-- (b.HasIndex(x => x.PostId).IsUnique().HasFilter("ended_at IS NULL"))
-- is NOT created automatically anywhere. Apply it manually.
--
-- Backs OasChangeoverService.CreateOrUpdateAsync's race guard: two
-- near-simultaneous "start changeover" requests for the same post can both
-- pass the app-level pre-check; this index makes the second INSERT fail
-- with SQLState 23505 (unique_violation) instead of creating two open
-- changeovers, and the service catches that to hand back whichever
-- changeover actually won.
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS ux_oas_changeovers_open_post
    ON oas_changeovers (post_id)
    WHERE ended_at IS NULL;
