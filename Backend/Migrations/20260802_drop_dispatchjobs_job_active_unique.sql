-- Allow unlimited dispatches per job.
-- The legacy partial unique index restricted a job to a single active dispatch,
-- causing 23505 "duplicate key value violates unique constraint
-- UX_DispatchJobs_Job_Active" when planning a second dispatch for the same job.
DROP INDEX IF EXISTS "UX_DispatchJobs_Job_Active";
