-- Dedicated audit trail for dispatch lifecycle events (currently: cancellations).
-- Separate from the free-form Notes table so entries can't be edited/deleted
-- through the notes UI.

CREATE TABLE IF NOT EXISTS "DispatchAuditLogs" (
    "Id"              SERIAL PRIMARY KEY,
    "TenantId"        INTEGER NOT NULL DEFAULT 0,
    "DispatchId"      INTEGER NOT NULL,
    "DispatchNumber"  VARCHAR(100),
    "EventType"       VARCHAR(60)  NOT NULL,
    "OldStatus"       VARCHAR(60),
    "NewStatus"       VARCHAR(60),
    "Reason"          VARCHAR(1000),
    "ServiceOrderId"  INTEGER,
    "SaleId"          VARCHAR(100),
    "OfferId"         VARCHAR(100),
    "ActorUserId"     VARCHAR(100),
    "ActorName"       VARCHAR(200),
    "CreatedAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_dispatch_audit_logs_dispatch"
    ON "DispatchAuditLogs" ("TenantId", "DispatchId");

CREATE INDEX IF NOT EXISTS "idx_dispatch_audit_logs_event_time"
    ON "DispatchAuditLogs" ("TenantId", "EventType", "CreatedAt" DESC);

COMMENT ON TABLE  "DispatchAuditLogs" IS 'Immutable audit trail for dispatch lifecycle events (cancellation, etc.).';
COMMENT ON COLUMN "DispatchAuditLogs"."EventType" IS 'Event kind, e.g. cancelled.';
COMMENT ON COLUMN "DispatchAuditLogs"."Reason"    IS 'Optional actor-supplied reason captured at event time.';