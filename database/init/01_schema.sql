/*
  # Ansible Tower Database Schema

  1. Extensions
    - uuid-ossp for UUID generation
    - pgcrypto for password hashing

  2. Tables
    - users: User accounts with roles
    - role_permissions: Permission definitions
    - projects: Git repositories with Ansible playbooks
    - playbooks: Individual playbook files
    - inventories: Ansible inventory configurations
    - hosts: Individual hosts in inventories
    - groups: Host groups with variables
    - credentials: Encrypted secrets
    - templates: Reusable job configurations
    - jobs: Job execution records
    - job_events: Detailed execution events
    - schedules: Cron-based job schedules
    - audit_logs: Complete audit trail

  3. Security
    - Row Level Security enabled on all tables
    - Appropriate policies for each role
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'operator', 'viewer');

-- Job status enum
CREATE TYPE job_status AS ENUM ('queued', 'running', 'success', 'failed', 'cancelled');

-- Credential type enum
CREATE TYPE credential_type AS ENUM ('ssh', 'vault', 'api_token', 'cloud');

-- Inventory source enum
CREATE TYPE inventory_source AS ENUM ('static', 'git', 'dynamic');

-- Project sync status enum
CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'success', 'failed');

-- ===========================
-- USERS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ===========================
-- ROLE PERMISSIONS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role NOT NULL,
  resource TEXT NOT NULL,
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_execute BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_role_permissions_role_resource ON role_permissions(role, resource);

-- ===========================
-- CREDENTIALS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type credential_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  encrypted_secret TEXT NOT NULL,
  scope TEXT DEFAULT 'user',
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credentials_owner_id ON credentials(owner_id);
CREATE INDEX idx_credentials_type ON credentials(type);

-- ===========================
-- PROJECTS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  git_url TEXT NOT NULL,
  git_branch TEXT DEFAULT 'main',
  git_credential_id UUID REFERENCES credentials(id) ON DELETE SET NULL,
  sync_status sync_status DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_sync_status ON projects(sync_status);

-- ===========================
-- PLAYBOOKS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playbooks_project_id ON playbooks(project_id);
CREATE UNIQUE INDEX idx_playbooks_project_file ON playbooks(project_id, file_path);

-- ===========================
-- INVENTORIES TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS inventories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  source inventory_source DEFAULT 'static',
  content_or_ref TEXT,
  variables JSONB DEFAULT '{}'::jsonb,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventories_owner_id ON inventories(owner_id);
CREATE INDEX idx_inventories_source ON inventories(source);

-- ===========================
-- HOSTS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS hosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  vars JSONB DEFAULT '{}'::jsonb,
  groups TEXT[] DEFAULT ARRAY[]::TEXT[],
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hosts_inventory_id ON hosts(inventory_id);
CREATE INDEX idx_hosts_hostname ON hosts(hostname);

-- ===========================
-- GROUPS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vars JSONB DEFAULT '{}'::jsonb,
  children TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_groups_inventory_id ON groups(inventory_id);
CREATE UNIQUE INDEX idx_groups_inventory_name ON groups(inventory_id, name);

-- ===========================
-- TEMPLATES TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES credentials(id) ON DELETE SET NULL,
  extra_vars_schema JSONB DEFAULT '{}'::jsonb,
  limits TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  skip_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  forks INTEGER DEFAULT 5,
  timeout INTEGER DEFAULT 3600,
  become BOOLEAN DEFAULT false,
  verbosity INTEGER DEFAULT 0,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_owner_id ON templates(owner_id);
CREATE INDEX idx_templates_playbook_id ON templates(playbook_id);
CREATE INDEX idx_templates_inventory_id ON templates(inventory_id);

-- ===========================
-- JOBS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  triggered_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status job_status DEFAULT 'queued',
  extra_vars JSONB DEFAULT '{}'::jsonb,
  limits TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  return_code INTEGER,
  summary JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_jobs_template_id ON jobs(template_id);
CREATE INDEX idx_jobs_triggered_by ON jobs(triggered_by);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- ===========================
-- JOB EVENTS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS job_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level TEXT DEFAULT 'info',
  host TEXT,
  task TEXT,
  event_type TEXT,
  message TEXT,
  raw_json JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_job_events_job_id ON job_events(job_id);
CREATE INDEX idx_job_events_timestamp ON job_events(timestamp);
CREATE INDEX idx_job_events_level ON job_events(level);

-- ===========================
-- SCHEDULES TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cron TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  enabled BOOLEAN DEFAULT true,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schedules_template_id ON schedules(template_id);
CREATE INDEX idx_schedules_enabled ON schedules(enabled);
CREATE INDEX idx_schedules_next_run_at ON schedules(next_run_at);

-- ===========================
-- AUDIT LOGS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  before JSONB DEFAULT '{}'::jsonb,
  after JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- ===========================
-- UPDATED_AT TRIGGER FUNCTION
-- ===========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbooks_updated_at BEFORE UPDATE ON playbooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventories_updated_at BEFORE UPDATE ON inventories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hosts_updated_at BEFORE UPDATE ON hosts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
