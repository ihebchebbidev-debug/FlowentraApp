-- ExternalEndpoints — production hardening fields
-- - ForwardSecret: HMAC-SHA256 secret to sign outbound webhook forwards
-- - LogRetentionDays: per-endpoint TTL (background sweeper deletes older logs)

ALTER TABLE "ExternalEndpoints"
    ADD COLUMN IF NOT EXISTS "ForwardSecret" varchar(128),
    ADD COLUMN IF NOT EXISTS "LogRetentionDays" integer NOT NULL DEFAULT 30;

-- Backfill ForwardSecret for existing rows (random 32-byte hex)
UPDATE "ExternalEndpoints"
SET "ForwardSecret" = encode(gen_random_bytes(32), 'hex')
WHERE "ForwardSecret" IS NULL;

-- Composite hot-path index for log list queries (per-endpoint, newest first)
CREATE INDEX IF NOT EXISTS "ix_ExternalEndpointLogs_EndpointId_ReceivedAt"
    ON "ExternalEndpointLogs" ("EndpointId", "ReceivedAt" DESC);

ALTER TABLE "WebhookForwardJobs"
    ADD COLUMN IF NOT EXISTS "Secret" varchar(128);
