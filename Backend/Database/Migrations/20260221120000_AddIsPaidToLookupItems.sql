-- Migration: add IsPaid column to LookupItems
-- Adds a boolean column IsPaid default false for leave type lookups

ALTER TABLE "LookupItems"
ADD COLUMN "IsPaid" boolean;

-- Optionally update seed data where necessary (example):
-- UPDATE "LookupItems" SET "IsPaid" = true WHERE "LookupType" = 'leave-type' AND "Value" = 'paid-sick';
