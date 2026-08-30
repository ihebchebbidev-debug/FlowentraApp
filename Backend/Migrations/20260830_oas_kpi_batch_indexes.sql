-- KPI batch endpoints scan oas_events / oas_declarations by (tenant, post, time).
-- Without these the grouped batch queries fall back to sequential scans, which
-- is the second half of the dashboard's latency (the first was the per-post fan-out).
create index if not exists ix_oas_events_tenant_post_declared
  on oas_events (tenant_id, post_id, declared_at) where status = 'closed';

create index if not exists ix_oas_events_tenant_line_declared
  on oas_events (tenant_id, line_id, declared_at);

create index if not exists ix_oas_declarations_tenant_post_occurred
  on oas_declarations (tenant_id, post_id, occurred_at) where is_corrected = false;

create index if not exists ix_oas_post_sessions_post_started
  on oas_post_sessions (post_id, started_at desc);

create index if not exists ix_oas_routings_post_updated
  on oas_routings (post_id, updated_at desc);
