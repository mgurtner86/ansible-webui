-- Settings and Audit Log Improvements
--
-- 1. New Tables
--    - settings: Application configuration storage
--      * id (uuid, primary key)
--      * key (varchar, unique) - Setting key identifier
--      * value (jsonb) - Setting value in JSON format
--      * category (varchar) - Category for grouping
--      * description (text) - Human-readable description
--      * is_encrypted (boolean) - Whether value contains encrypted data
--      * updated_by (uuid) - User who last updated this setting
--      * created_at, updated_at (timestamp)
--
-- 2. Modified Tables
--    - audit_logs: Added details and status fields
--
-- 3. Security
--    - Enable RLS on settings table
--    - Only admins can read/write settings
--    - Audit logs readable by admins and own entries by users

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to audit_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'details'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN details TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'status'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN status VARCHAR(20) DEFAULT 'success';
    END IF;
END $$;

-- Insert default settings
INSERT INTO settings (key, value, category, description) VALUES
    ('auth.microsoft365.enabled', 'false', 'authentication', 'Enable Microsoft 365 OAuth authentication'),
    ('auth.microsoft365.client_id', '""', 'authentication', 'Microsoft 365 OAuth Client ID'),
    ('auth.microsoft365.tenant_id', '""', 'authentication', 'Microsoft 365 Tenant ID'),
    ('auth.local.enabled', 'true', 'authentication', 'Enable local username/password authentication'),
    ('email.provider', '"none"', 'email', 'Email provider (none, smtp, oauth)'),
    ('email.smtp.host', '""', 'email', 'SMTP server host'),
    ('email.smtp.port', '587', 'email', 'SMTP server port'),
    ('email.smtp.username', '""', 'email', 'SMTP username'),
    ('email.smtp.from', '""', 'email', 'Email from address'),
    ('email.oauth.provider', '"microsoft365"', 'email', 'OAuth provider for email'),
    ('email.oauth.client_id', '""', 'email', 'OAuth client ID for email'),
    ('email.oauth.tenant_id', '""', 'email', 'OAuth tenant ID'),
    ('system.job_retention_days', '30', 'system', 'Number of days to retain job history'),
    ('system.audit_retention_days', '90', 'system', 'Number of days to retain audit logs'),
    ('system.max_concurrent_jobs', '10', 'system', 'Maximum number of concurrent jobs')
ON CONFLICT (key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON audit_logs(target_type);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Settings policies (admin only)
CREATE POLICY "Admins can read all settings"
    ON settings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert settings"
    ON settings FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update settings"
    ON settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Audit log policies
CREATE POLICY "Users can read own audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (actor_id = auth.uid());

CREATE POLICY "Admins can read all audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);
