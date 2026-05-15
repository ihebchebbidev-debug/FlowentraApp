-- =====================================================
-- User Signatures Module Table
-- Stores user e-signature URLs (one per user)
-- =====================================================

CREATE TABLE IF NOT EXISTS "UserSignatures" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL UNIQUE,
    "SignatureUrl" VARCHAR(1000) NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_usersignatures_userid" ON "UserSignatures"("UserId");
