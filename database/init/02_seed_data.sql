/*
  # Seed Data for Ansible Tower

  1. Default Admin User
  2. Role Permissions Matrix
  3. Sample Data (optional)
*/

-- ===========================
-- DEFAULT ADMIN USER
-- ===========================
-- Note: Admin user is created by backend seed script with bcrypt-hashed password
-- This ensures compatibility between Node.js bcrypt and the database

-- ===========================
-- ROLE PERMISSIONS MATRIX
-- ===========================

-- Admin: Full access to everything
INSERT INTO role_permissions (role, resource, can_create, can_read, can_update, can_delete, can_execute)
VALUES
  ('admin', 'users', true, true, true, true, false),
  ('admin', 'projects', true, true, true, true, false),
  ('admin', 'playbooks', true, true, true, true, false),
  ('admin', 'inventories', true, true, true, true, false),
  ('admin', 'hosts', true, true, true, true, false),
  ('admin', 'groups', true, true, true, true, false),
  ('admin', 'credentials', true, true, true, true, false),
  ('admin', 'templates', true, true, true, true, true),
  ('admin', 'jobs', true, true, true, true, true),
  ('admin', 'schedules', true, true, true, true, false),
  ('admin', 'audit_logs', false, true, false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Manager: Can manage all resources except users
INSERT INTO role_permissions (role, resource, can_create, can_read, can_update, can_delete, can_execute)
VALUES
  ('manager', 'users', false, true, false, false, false),
  ('manager', 'projects', true, true, true, true, false),
  ('manager', 'playbooks', true, true, true, true, false),
  ('manager', 'inventories', true, true, true, true, false),
  ('manager', 'hosts', true, true, true, true, false),
  ('manager', 'groups', true, true, true, true, false),
  ('manager', 'credentials', true, true, true, true, false),
  ('manager', 'templates', true, true, true, true, true),
  ('manager', 'jobs', true, true, true, true, true),
  ('manager', 'schedules', true, true, true, true, false),
  ('manager', 'audit_logs', false, true, false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Operator: Can execute templates and view resources
INSERT INTO role_permissions (role, resource, can_create, can_read, can_update, can_delete, can_execute)
VALUES
  ('operator', 'users', false, false, false, false, false),
  ('operator', 'projects', false, true, false, false, false),
  ('operator', 'playbooks', false, true, false, false, false),
  ('operator', 'inventories', false, true, false, false, false),
  ('operator', 'hosts', false, true, false, false, false),
  ('operator', 'groups', false, true, false, false, false),
  ('operator', 'credentials', false, true, false, false, false),
  ('operator', 'templates', false, true, false, false, true),
  ('operator', 'jobs', true, true, false, false, false),
  ('operator', 'schedules', false, true, false, false, false),
  ('operator', 'audit_logs', false, false, false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Viewer: Read-only access
INSERT INTO role_permissions (role, resource, can_create, can_read, can_update, can_delete, can_execute)
VALUES
  ('viewer', 'users', false, false, false, false, false),
  ('viewer', 'projects', false, true, false, false, false),
  ('viewer', 'playbooks', false, true, false, false, false),
  ('viewer', 'inventories', false, true, false, false, false),
  ('viewer', 'hosts', false, true, false, false, false),
  ('viewer', 'groups', false, true, false, false, false),
  ('viewer', 'credentials', false, false, false, false, false),
  ('viewer', 'templates', false, true, false, false, false),
  ('viewer', 'jobs', false, true, false, false, false),
  ('viewer', 'schedules', false, true, false, false, false),
  ('viewer', 'audit_logs', false, false, false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- ===========================
-- SAMPLE DATA (Optional)
-- ===========================

-- Sample project
DO $$
DECLARE
  admin_id UUID;
  project_id UUID;
  playbook_id UUID;
  inventory_id UUID;
  credential_id UUID;
  template_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_id FROM users WHERE email = 'admin@ansible-tower.local';

  -- Skip if admin doesn't exist
  IF admin_id IS NULL THEN
    RETURN;
  END IF;

  -- Create sample credential
  INSERT INTO credentials (type, name, encrypted_secret, owner_id)
  VALUES (
    'ssh',
    'Default SSH Key',
    encode('-----BEGIN OPENSSH PRIVATE KEY-----\nSAMPLE KEY DATA\n-----END OPENSSH PRIVATE KEY-----', 'base64'),
    admin_id
  )
  RETURNING id INTO credential_id;

  -- Create sample project
  INSERT INTO projects (name, description, git_url, git_branch, owner_id, sync_status)
  VALUES (
    'Sample Ansible Project',
    'Example project with common playbooks',
    'https://github.com/ansible/ansible-examples.git',
    'master',
    admin_id,
    'pending'
  )
  RETURNING id INTO project_id;

  -- Create sample playbook
  INSERT INTO playbooks (project_id, name, file_path, description)
  VALUES (
    project_id,
    'Setup Web Server',
    'webservers/setup.yml',
    'Installs and configures nginx web server'
  )
  RETURNING id INTO playbook_id;

  -- Create sample inventory
  INSERT INTO inventories (name, description, source, content_or_ref, owner_id)
  VALUES (
    'Development Servers',
    'Development environment inventory',
    'static',
    E'[webservers]\nlocalhost ansible_connection=local\n\n[all:vars]\nansible_python_interpreter=/usr/bin/python3',
    admin_id
  )
  RETURNING id INTO inventory_id;

  -- Create sample host
  INSERT INTO hosts (inventory_id, hostname, vars, groups)
  VALUES (
    inventory_id,
    'localhost',
    '{"ansible_connection": "local"}'::jsonb,
    ARRAY['webservers']
  );

  -- Create sample template
  INSERT INTO templates (name, description, playbook_id, inventory_id, credential_id, owner_id, become)
  VALUES (
    'Deploy Web Server',
    'Deploys and configures nginx on target servers',
    playbook_id,
    inventory_id,
    credential_id,
    admin_id,
    true
  )
  RETURNING id INTO template_id;

  RAISE NOTICE 'Sample data created successfully';
END $$;
