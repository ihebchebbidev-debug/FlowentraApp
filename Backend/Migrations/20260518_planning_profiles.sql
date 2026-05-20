-- Planning Profiles tables
-- Plan: .lovable/plan.md

CREATE TABLE IF NOT EXISTS planning_profiles (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    owner_user_id VARCHAR(64) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    color VARCHAR(16),
    icon VARCHAR(64),
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    visible_user_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    required_skill_ids JSONB,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_planning_profiles_tenant_owner
    ON planning_profiles (tenant_id, owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_planning_profiles_tenant_shared
    ON planning_profiles (tenant_id, is_shared) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS user_active_planning_profile (
    user_id VARCHAR(64) NOT NULL,
    tenant_id INTEGER NOT NULL,
    profile_id INTEGER NOT NULL REFERENCES planning_profiles(id) ON DELETE CASCADE,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_uapp_profile
    ON user_active_planning_profile (profile_id);
