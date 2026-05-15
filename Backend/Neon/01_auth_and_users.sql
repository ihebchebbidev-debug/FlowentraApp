-- =====================================================
-- Auth & Users Module Tables
-- Matches current Neon database structure
-- =====================================================

-- Main Admin Users Table
CREATE TABLE IF NOT EXISTS "MainAdminUsers" (
    "Id" SERIAL PRIMARY KEY,
    "Username" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(255) NOT NULL UNIQUE,
    "PasswordHash" VARCHAR(500) NOT NULL,
    "FirstName" VARCHAR(100) NOT NULL,
    "LastName" VARCHAR(100) NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "LastLoginDate" TIMESTAMP WITH TIME ZONE,
    "OnboardingCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "AccessToken" VARCHAR(500),
    "RefreshToken" VARCHAR(500),
    "TokenExpiresAt" TIMESTAMP,
    "PhoneNumber" VARCHAR(20),
    "Country" VARCHAR(2),
    "Industry" VARCHAR(100) DEFAULT '',
    "CompanyName" VARCHAR(255),
    "CompanyWebsite" VARCHAR(500),
    "ProfilePictureUrl" VARCHAR(500),
    "PreferencesJson" TEXT,
    "UpdatedAt" TIMESTAMP,
    "LastLoginAt" TIMESTAMP
);

-- Users Table (Regular staff users)
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" SERIAL PRIMARY KEY,
    "FirstName" VARCHAR(100) NOT NULL,
    "LastName" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(255) NOT NULL UNIQUE,
    "Phone" VARCHAR(20),
    "PasswordHash" VARCHAR(500) NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedBy" VARCHAR(100) NOT NULL,
    "ModifiedDate" TIMESTAMP WITH TIME ZONE,
    "ModifiedBy" VARCHAR(100),
    "DeletedDate" TIMESTAMP WITH TIME ZONE,
    "DeletedBy" VARCHAR(100),
    "AccessToken" VARCHAR(500),
    "RefreshToken" VARCHAR(500),
    "TokenExpiresAt" TIMESTAMP,
    "CurrentStatus" VARCHAR(50) DEFAULT 'offline',
    "LocationJson" TEXT,
    "Country" VARCHAR(2) DEFAULT 'US',
    "LastLoginAt" TIMESTAMP,
    "CreatedUser" VARCHAR(100) DEFAULT 'system',
    "ModifyUser" VARCHAR(100),
    "ModifyDate" TIMESTAMP,
    "Role" VARCHAR(50) DEFAULT 'User',
    "Skills" TEXT,
    "PhoneNumber" VARCHAR(20),
    "ProfilePictureUrl" VARCHAR(500)
);

-- User Preferences Table (Simple structure with JSONB)
CREATE TABLE IF NOT EXISTS "UserPreferences" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "PreferencesJson" JSONB NOT NULL DEFAULT '{}',
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE
);

-- Skills Table
CREATE TABLE IF NOT EXISTS "Skills" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "Category" VARCHAR(100),
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE,
    "CreatedBy" VARCHAR(100) DEFAULT 'system',
    "ModifiedBy" VARCHAR(100)
);

-- Roles Table
CREATE TABLE IF NOT EXISTS "Roles" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE,
    "CreatedBy" VARCHAR(100) DEFAULT 'system',
    "ModifiedBy" VARCHAR(100)
);

-- User Roles Junction Table
CREATE TABLE IF NOT EXISTS "UserRoles" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "RoleId" INTEGER NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "AssignedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "AssignedBy" VARCHAR(100),
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("RoleId") REFERENCES "Roles"("Id") ON DELETE CASCADE,
    UNIQUE ("UserId", "RoleId")
);

-- User Skills Junction Table
CREATE TABLE IF NOT EXISTS "UserSkills" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "SkillId" INTEGER NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "Level" VARCHAR(20) DEFAULT 'intermediate',
    "AssignedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "AssignedBy" VARCHAR(100),
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("SkillId") REFERENCES "Skills"("Id") ON DELETE CASCADE,
    UNIQUE ("UserId", "SkillId")
);

-- Indexes for Auth & Users
CREATE INDEX IF NOT EXISTS "idx_mainadminusers_email" ON "MainAdminUsers"("Email");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "Users"("Email");
CREATE INDEX IF NOT EXISTS "idx_users_isdeleted" ON "Users"("IsDeleted");
CREATE INDEX IF NOT EXISTS "idx_users_isactive" ON "Users"("IsActive");
CREATE INDEX IF NOT EXISTS "idx_userpreferences_userid" ON "UserPreferences"("UserId");
CREATE INDEX IF NOT EXISTS "idx_skills_isactive" ON "Skills"("IsActive");
CREATE INDEX IF NOT EXISTS "idx_roles_isactive" ON "Roles"("IsActive");
