-- =====================================================
-- Calendar Module Tables
-- =====================================================

-- Event Types Table
CREATE TABLE IF NOT EXISTS "event_types" (
    "Id" VARCHAR(50) PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" TEXT,
    "Color" VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS "calendar_events" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Title" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "Start" TIMESTAMP NOT NULL,
    "End" TIMESTAMP NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT FALSE,
    "Type" VARCHAR(50) NOT NULL,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    "Priority" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "Category" VARCHAR(50),
    "Color" VARCHAR(7),
    "Location" TEXT,
    "Attendees" JSONB,
    "related_type" VARCHAR(20),
    "related_id" UUID,
    "contact_id" INTEGER,
    "Reminders" JSONB,
    "Recurring" JSONB,
    "is_private" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "modified_by" UUID,
    FOREIGN KEY ("contact_id") REFERENCES "Contacts"("Id") ON DELETE SET NULL,
    FOREIGN KEY ("Type") REFERENCES "event_types"("Id") ON DELETE RESTRICT
);

-- Event Attendees Table
CREATE TABLE IF NOT EXISTS "event_attendees" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "user_id" UUID,
    "Email" VARCHAR(200),
    "Name" VARCHAR(100),
    "Status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "Response" TEXT,
    "responded_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("event_id") REFERENCES "calendar_events"("Id") ON DELETE CASCADE
);

-- Event Reminders Table
CREATE TABLE IF NOT EXISTS "event_reminders" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "Type" VARCHAR(20) NOT NULL DEFAULT 'email',
    "minutes_before" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "sent_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("event_id") REFERENCES "calendar_events"("Id") ON DELETE CASCADE
);

-- Indexes for Calendar
CREATE INDEX IF NOT EXISTS "idx_calendar_events_start" ON "calendar_events"("Start");
CREATE INDEX IF NOT EXISTS "idx_calendar_events_type" ON "calendar_events"("Type");
CREATE INDEX IF NOT EXISTS "idx_calendar_events_contact" ON "calendar_events"("contact_id");
CREATE INDEX IF NOT EXISTS "idx_event_attendees_event" ON "event_attendees"("event_id");
CREATE INDEX IF NOT EXISTS "idx_event_reminders_event" ON "event_reminders"("event_id");
