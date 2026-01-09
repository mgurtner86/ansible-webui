/*
  # Fix Security and Performance Issues

  This migration addresses:
  1. Missing indexes on foreign keys
  2. RLS policy performance optimization (use SELECT subqueries)
  3. Overly permissive policies for system operations

  ## Changes
  
  ### 1. Add Missing Indexes
  - schedules.created_by
  - templates.inventory_id
  - templates.playbook_id
  
  ### 2. Optimize RLS Policies
  - Replace direct auth.uid() calls with (SELECT auth.uid())
  - This prevents re-evaluation for each row
  
  ### 3. Restrict System Policies
  - Make audit_logs and job_events insert policies more restrictive
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_schedules_created_by ON schedules(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_inventory_id ON templates(inventory_id);
CREATE INDEX IF NOT EXISTS idx_templates_playbook_id ON templates(playbook_id);

-- Drop existing policies to recreate with optimized queries
-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Recreate with SELECT subqueries for better performance
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Role permissions policies
DROP POLICY IF EXISTS "Only admins can modify role permissions" ON role_permissions;

CREATE POLICY "Only admins can modify role permissions"
  ON role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Credentials policies
DROP POLICY IF EXISTS "Users can view own credentials" ON credentials;
DROP POLICY IF EXISTS "Users can create own credentials" ON credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON credentials;
DROP POLICY IF EXISTS "Admins can manage all credentials" ON credentials;

CREATE POLICY "Users can view own credentials"
  ON credentials FOR SELECT
  TO authenticated
  USING (owner_id = (SELECT auth.uid()) OR scope = 'global');

CREATE POLICY "Users can create own credentials"
  ON credentials FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own credentials"
  ON credentials FOR UPDATE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own credentials"
  ON credentials FOR DELETE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage all credentials"
  ON credentials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Inventories policies
DROP POLICY IF EXISTS "Users can view own inventories" ON inventories;
DROP POLICY IF EXISTS "Users can create inventories" ON inventories;
DROP POLICY IF EXISTS "Users can update own inventories" ON inventories;
DROP POLICY IF EXISTS "Users can delete own inventories" ON inventories;
DROP POLICY IF EXISTS "Admins can manage all inventories" ON inventories;

CREATE POLICY "Users can view own inventories"
  ON inventories FOR SELECT
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can create inventories"
  ON inventories FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own inventories"
  ON inventories FOR UPDATE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own inventories"
  ON inventories FOR DELETE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage all inventories"
  ON inventories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Hosts policies
DROP POLICY IF EXISTS "Users can view hosts in own inventories" ON hosts;
DROP POLICY IF EXISTS "Users can manage hosts in own inventories" ON hosts;

CREATE POLICY "Users can view hosts in own inventories"
  ON hosts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inventories
      WHERE inventories.id = hosts.inventory_id
      AND inventories.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can manage hosts in own inventories"
  ON hosts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inventories
      WHERE inventories.id = hosts.inventory_id
      AND inventories.owner_id = (SELECT auth.uid())
    )
  );

-- Groups policies
DROP POLICY IF EXISTS "Users can view groups in own inventories" ON groups;
DROP POLICY IF EXISTS "Users can manage groups in own inventories" ON groups;

CREATE POLICY "Users can view groups in own inventories"
  ON groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inventories
      WHERE inventories.id = groups.inventory_id
      AND inventories.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can manage groups in own inventories"
  ON groups FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inventories
      WHERE inventories.id = groups.inventory_id
      AND inventories.owner_id = (SELECT auth.uid())
    )
  );

-- Projects policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage all projects"
  ON projects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Playbooks policies
DROP POLICY IF EXISTS "Users can view playbooks in own projects" ON playbooks;
DROP POLICY IF EXISTS "Users can manage playbooks in own projects" ON playbooks;

CREATE POLICY "Users can view playbooks in own projects"
  ON playbooks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = playbooks.project_id
      AND projects.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can manage playbooks in own projects"
  ON playbooks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = playbooks.project_id
      AND projects.owner_id = (SELECT auth.uid())
    )
  );

-- Templates policies
DROP POLICY IF EXISTS "Users can view own templates" ON templates;
DROP POLICY IF EXISTS "Users can create templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;
DROP POLICY IF EXISTS "Admins can manage all templates" ON templates;

CREATE POLICY "Users can view own templates"
  ON templates FOR SELECT
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can create templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own templates"
  ON templates FOR DELETE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage all templates"
  ON templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Jobs policies
DROP POLICY IF EXISTS "Users can view own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can create jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can view all jobs" ON jobs;

CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (triggered_by = (SELECT auth.uid()));

CREATE POLICY "Users can create jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (triggered_by = (SELECT auth.uid()));

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (triggered_by = (SELECT auth.uid()))
  WITH CHECK (triggered_by = (SELECT auth.uid()));

CREATE POLICY "Admins can view all jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Job events policies
DROP POLICY IF EXISTS "Users can view events for own jobs" ON job_events;
DROP POLICY IF EXISTS "System can insert job events" ON job_events;

CREATE POLICY "Users can view events for own jobs"
  ON job_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_events.job_id
      AND jobs.triggered_by = (SELECT auth.uid())
    )
  );

-- More restrictive insert policy - only allow if job belongs to user or user is admin
CREATE POLICY "System can insert job events"
  ON job_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_events.job_id
      AND (jobs.triggered_by = (SELECT auth.uid()) OR EXISTS (
        SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'
      ))
    )
  );

-- Schedules policies
DROP POLICY IF EXISTS "Users can view own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can create schedules" ON schedules;
DROP POLICY IF EXISTS "Users can update own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can delete own schedules" ON schedules;

CREATE POLICY "Users can view own schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can create schedules"
  ON schedules FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can update own schedules"
  ON schedules FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can delete own schedules"
  ON schedules FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- Audit logs policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (actor_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- More restrictive insert - only authenticated users who own the action or are admin
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = (SELECT auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()) 
      AND users.role = 'admin'
    )
  );
