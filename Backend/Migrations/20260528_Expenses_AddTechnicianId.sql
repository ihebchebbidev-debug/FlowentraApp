-- G9: Persist Expense.TechnicianId on dispatch-scoped expenses.
ALTER TABLE "Expenses"
    ADD COLUMN IF NOT EXISTS "TechnicianId" VARCHAR(50) NULL;
