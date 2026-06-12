-- Migration: XML support + multi-company routing for external endpoints
-- Adds ContentType and CompanyId to ExternalEndpointLogs
-- Adds AcceptedContentTypes to ExternalEndpoints

-- ExternalEndpointLogs: store the Content-Type of each inbound request
ALTER TABLE "ExternalEndpointLogs"
    ADD COLUMN IF NOT EXISTS "ContentType" VARCHAR(100) NULL;

-- ExternalEndpointLogs: store the company/tenant ID provided by the sender
-- (from X-Company-ID header or ?company_id= query param)
ALTER TABLE "ExternalEndpointLogs"
    ADD COLUMN IF NOT EXISTS "CompanyId" VARCHAR(100) NULL;

-- Index to efficiently filter logs by company (used in the multi-company view)
CREATE INDEX CONCURRENTLY IF NOT EXISTS
    "ix_ExternalEndpointLogs_EndpointId_CompanyId"
    ON "ExternalEndpointLogs" ("EndpointId", "CompanyId")
    WHERE "CompanyId" IS NOT NULL;

-- ExternalEndpoints: accepted content types (comma-sep: json, xml, form, any)
ALTER TABLE "ExternalEndpoints"
    ADD COLUMN IF NOT EXISTS "AcceptedContentTypes" VARCHAR(100) NOT NULL DEFAULT 'any';
