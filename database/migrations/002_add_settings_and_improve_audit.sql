-- Create settings table for application configuration
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add additional fields to audit_logs for better tracking
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'success';

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
    ('email.oauth.provider', '"microsoft365"', 'email', 'OAuth provider for email (microsoft365, google)'),
    ('email.oauth.client_id', '""', 'email', 'OAuth client ID for email'),
    ('email.oauth.tenant_id', '""', 'email', 'OAuth tenant ID (Microsoft 365 only)'),
    ('system.job_retention_days', '30', 'system', 'Number of days to retain job history'),
    ('system.audit_retention_days', '90', 'system', 'Number of days to retain audit logs'),
    ('system.max_concurrent_jobs', '10', 'system', 'Maximum number of concurrent jobs')
ON CONFLICT (key) DO NOTHING;

-- Create index on settings key
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Create index for audit logs details search
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON audit_logs(target_type);
