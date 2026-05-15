-- =====================================================
-- AI CHAT HISTORY MIGRATION
-- Creates tables for AI Assistant conversation history
-- =====================================================

-- AiConversations table - stores conversation metadata
CREATE TABLE IF NOT EXISTS "AiConversations" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" VARCHAR(100) NOT NULL,
    "Title" VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    "Summary" TEXT NULL,
    "LastMessageAt" TIMESTAMP WITH TIME ZONE NULL,
    "MessageCount" INTEGER NOT NULL DEFAULT 0,
    "IsArchived" BOOLEAN NOT NULL DEFAULT FALSE,
    "IsPinned" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NULL,
    "DeletedAt" TIMESTAMP WITH TIME ZONE NULL,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- AiMessages table - stores individual messages
CREATE TABLE IF NOT EXISTS "AiMessages" (
    "Id" SERIAL PRIMARY KEY,
    "ConversationId" INTEGER NOT NULL REFERENCES "AiConversations"("Id") ON DELETE CASCADE,
    "Role" VARCHAR(20) NOT NULL CHECK ("Role" IN ('user', 'assistant', 'system')),
    "Content" TEXT NOT NULL,
    "Feedback" VARCHAR(20) NULL CHECK ("Feedback" IN ('liked', 'disliked', NULL)),
    "IsRegenerated" BOOLEAN NOT NULL DEFAULT FALSE,
    "Metadata" JSONB NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "IX_AiConversations_UserId" ON "AiConversations"("UserId");
CREATE INDEX IF NOT EXISTS "IX_AiConversations_UserId_IsDeleted" ON "AiConversations"("UserId", "IsDeleted") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_AiConversations_LastMessageAt" ON "AiConversations"("LastMessageAt" DESC);
CREATE INDEX IF NOT EXISTS "IX_AiMessages_ConversationId" ON "AiMessages"("ConversationId");
CREATE INDEX IF NOT EXISTS "IX_AiMessages_CreatedAt" ON "AiMessages"("CreatedAt");

-- Insert migration record
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20240201000000_AiChatHistory', '8.0.0')
ON CONFLICT DO NOTHING;

-- Verify tables created
SELECT 'AiConversations' as "Table", COUNT(*) as "Count" FROM "AiConversations"
UNION ALL
SELECT 'AiMessages' as "Table", COUNT(*) as "Count" FROM "AiMessages";
