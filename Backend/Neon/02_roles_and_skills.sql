-- =====================================================
-- Roles & Skills Module Tables
-- =====================================================

-- Roles Table
CREATE TABLE IF NOT EXISTS "Roles" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "CreatedUser" VARCHAR(100) NOT NULL,
    "ModifyUser" VARCHAR(100),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Skills Table
CREATE TABLE IF NOT EXISTS "Skills" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "Category" VARCHAR(100) NOT NULL,
    "Level" VARCHAR(20),
    "CreatedUser" VARCHAR(100) NOT NULL,
    "ModifyUser" VARCHAR(100),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- User Roles Junction Table
CREATE TABLE IF NOT EXISTS "UserRoles" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "RoleId" INTEGER NOT NULL,
    "AssignedBy" VARCHAR(100) NOT NULL,
    "AssignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("RoleId") REFERENCES "Roles"("Id") ON DELETE CASCADE,
    UNIQUE ("UserId", "RoleId")
);

-- User Skills Junction Table
CREATE TABLE IF NOT EXISTS "UserSkills" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "SkillId" INTEGER NOT NULL,
    "ProficiencyLevel" VARCHAR(20),
    "YearsOfExperience" INTEGER,
    "Certifications" VARCHAR(500),
    "Notes" VARCHAR(1000),
    "AssignedBy" VARCHAR(100) NOT NULL,
    "AssignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("SkillId") REFERENCES "Skills"("Id") ON DELETE CASCADE,
    UNIQUE ("UserId", "SkillId")
);

-- Role Skills Junction Table
CREATE TABLE IF NOT EXISTS "RoleSkills" (
    "Id" SERIAL PRIMARY KEY,
    "RoleId" INTEGER NOT NULL,
    "SkillId" INTEGER NOT NULL,
    "AssignedBy" VARCHAR(100) NOT NULL,
    "AssignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "Notes" VARCHAR(500),
    FOREIGN KEY ("RoleId") REFERENCES "Roles"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("SkillId") REFERENCES "Skills"("Id") ON DELETE CASCADE,
    UNIQUE ("RoleId", "SkillId")
);

-- Indexes for Roles & Skills
CREATE INDEX IF NOT EXISTS "idx_roles_name" ON "Roles"("Name");
CREATE INDEX IF NOT EXISTS "idx_skills_name" ON "Skills"("Name");
CREATE INDEX IF NOT EXISTS "idx_skills_category" ON "Skills"("Category");
CREATE INDEX IF NOT EXISTS "idx_userroles_userid" ON "UserRoles"("UserId");
CREATE INDEX IF NOT EXISTS "idx_userroles_roleid" ON "UserRoles"("RoleId");
CREATE INDEX IF NOT EXISTS "idx_userskills_userid" ON "UserSkills"("UserId");
CREATE INDEX IF NOT EXISTS "idx_userskills_skillid" ON "UserSkills"("SkillId");
CREATE INDEX IF NOT EXISTS "idx_roleskills_roleid" ON "RoleSkills"("RoleId");
CREATE INDEX IF NOT EXISTS "idx_roleskills_skillid" ON "RoleSkills"("SkillId");
