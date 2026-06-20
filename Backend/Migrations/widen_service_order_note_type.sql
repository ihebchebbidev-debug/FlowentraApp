-- Migration: Widen ServiceOrderNotes.Type from varchar(20) to varchar(50)
-- Reason: activity propagation writes note types such as
--         "dispatch_status_changed" (23 chars) which overflowed varchar(20)
--         and threw PostgreSQL 22001 (value too long) when planning/dispatching
--         a service order. See ServiceOrderNote.Type / ServiceOrdersController.AddNote.
-- Run this on every tenant database before (or with) deploying the backend.

ALTER TABLE "ServiceOrderNotes"
    ALTER COLUMN "Type" TYPE varchar(50);
