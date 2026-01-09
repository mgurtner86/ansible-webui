/*
  # Consolidate RLS Policies

  This migration consolidates multiple permissive policies into single, comprehensive policies.
  This improves performance by reducing the number of policy checks and eliminates the
  "multiple permissive policies" warnings.

  ## Changes
  
  ### Approach
  - Combine admin and user policies into single policies with OR conditions
  - Maintain the same security guarantees
  - Reduce policy evaluation overhead
*/

-- Users table: Consolidate SELECT and UPDATE policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can view profiles"
  ON users FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can manage profiles"
  ON users FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Credentials: Consolidate all policies per action
DROP POLICY IF EXISTS "Users can view own credentials" ON credentials;
DROP POLICY IF EXISTS "Admins can manage all credentials" ON credentials;
DROP POLICY IF EXISTS "Users can create own credentials" ON credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON credentials;

CREATE POLICY "Credentials select policy"
  ON credentials FOR SELECT
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR 
    scope = 'global' OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Credentials insert policy"
  ON credentials FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Credentials update policy"
  ON credentials FOR UPDATE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Credentials delete policy"
  ON credentials FOR DELETE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Inventories: Consolidate policies
DROP POLICY IF EXISTS "Users can view own inventories" ON inventories;
DROP POLICY IF EXISTS "Admins can manage all inventories" ON inventories;
DROP POLICY IF EXISTS "Users can create inventories" ON inventories;
DROP POLICY IF EXISTS "Users can update own inventories" ON inventories;
DROP POLICY IF EXISTS "Users can delete own inventories" ON inventories;

CREATE POLICY "Inventories select policy"
  ON inventories FOR SELECT
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Inventories insert policy"
  ON inventories FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Inventories update policy"
  ON inventories FOR UPDATE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Inventories delete policy"
  ON inventories FOR DELETE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Hosts: Consolidate duplicate SELECT policies
DROP POLICY IF EXISTS "Users can view hosts in own inventories" ON hosts;
DROP POLICY IF EXISTS "Users can manage hosts in own inventories" ON hosts;

CREATE POLICY "Hosts all operations policy"
  ON hosts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inventories
      WHERE inventories.id = hosts.inventory_id
      AND (
        inventories.owner_id = (SELECT auth.uid()) OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = (SELECT auth.uid())
          AND users.role = 'admin'
        )
      )
    )
  );

-- Groups: Consolidate duplicate SELECT policies
DROP POLICY IF EXISTS "Users can view groups in own inventories" ON groups;
DROP POLICY IF EXISTS "Users can manage groups in own inventories" ON groups;

CREATE POLICY "Groups all operations policy"
  ON groups FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inventories
      WHERE inventories.id = groups.inventory_id
      AND (
        inventories.owner_id = (SELECT auth.uid()) OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = (SELECT auth.uid())
          AND users.role = 'admin'
        )
      )
    )
  );

-- Projects: Consolidate policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

CREATE POLICY "Projects select policy"
  ON projects FOR SELECT
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Projects insert policy"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Projects update policy"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Projects delete policy"
  ON projects FOR DELETE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Playbooks: Consolidate duplicate SELECT policies
DROP POLICY IF EXISTS "Users can view playbooks in own projects" ON playbooks;
DROP POLICY IF EXISTS "Users can manage playbooks in own projects" ON playbooks;

CREATE POLICY "Playbooks all operations policy"
  ON playbooks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = playbooks.project_id
      AND (
        projects.owner_id = (SELECT auth.uid()) OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = (SELECT auth.uid())
          AND users.role = 'admin'
        )
      )
    )
  );

-- Templates: Consolidate policies
DROP POLICY IF EXISTS "Users can view own templates" ON templates;
DROP POLICY IF EXISTS "Admins can manage all templates" ON templates;
DROP POLICY IF EXISTS "Users can create templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;

CREATE POLICY "Templates select policy"
  ON templates FOR SELECT
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Templates insert policy"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Templates update policy"
  ON templates FOR UPDATE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Templates delete policy"
  ON templates FOR DELETE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Jobs: Consolidate duplicate SELECT policies
DROP POLICY IF EXISTS "Users can view own jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can view all jobs" ON jobs;
DROP POLICY IF EXISTS "Users can create jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON jobs;

CREATE POLICY "Jobs select policy"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    triggered_by = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Jobs insert policy"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (triggered_by = (SELECT auth.uid()));

CREATE POLICY "Jobs update policy"
  ON jobs FOR UPDATE
  TO authenticated
  USING (
    triggered_by = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    triggered_by = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Audit logs: Consolidate duplicate SELECT policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;

CREATE POLICY "Audit logs select policy"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    actor_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Role permissions: Keep only one SELECT policy
DROP POLICY IF EXISTS "All authenticated users can view role permissions" ON role_permissions;

-- The "Only admins can modify role permissions" already handles all operations
-- Just ensure authenticated users can view
CREATE POLICY "All users can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);
