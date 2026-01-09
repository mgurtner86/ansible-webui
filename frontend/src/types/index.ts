export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  mfa_enabled: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface Session {
  userId: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  git_url: string;
  git_branch: string;
  sync_status: string;
  last_sync_at: string | null;
  owner_name: string;
  playbook_count: number;
  created_at: string;
}

export interface Inventory {
  id: string;
  name: string;
  description: string;
  source: 'static' | 'git' | 'dynamic';
  owner_name: string;
  host_count: number;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  playbook_name: string;
  project_name: string;
  inventory_name: string;
  credential_name: string;
  owner_name: string;
  created_at: string;
}

export interface Job {
  id: string;
  template_name: string;
  triggered_by_name: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled';
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface Credential {
  id: string;
  type: 'ssh' | 'vault' | 'api_token' | 'cloud';
  name: string;
  description: string;
  scope: string;
  owner_name: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  template_name: string;
  name: string;
  cron: string;
  timezone: string;
  enabled: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  created_by_name: string;
  created_at: string;
}
