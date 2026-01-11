-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES ('admin@ansible-tower.local', '$2b$10$Og/qMyvuqNW/PKvDsNewN.w4gk.I398zOEIwepsMik2ZHE4k9tK8q', 'System Administrator', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert role permissions
INSERT INTO role_permissions (role, resource, can_create, can_read, can_update, can_delete, can_execute) VALUES
-- Admin has all permissions
('admin', 'users', TRUE, TRUE, TRUE, TRUE, FALSE),
('admin', 'projects', TRUE, TRUE, TRUE, TRUE, FALSE),
('admin', 'inventories', TRUE, TRUE, TRUE, TRUE, FALSE),
('admin', 'credentials', TRUE, TRUE, TRUE, TRUE, FALSE),
('admin', 'templates', TRUE, TRUE, TRUE, TRUE, TRUE),
('admin', 'jobs', TRUE, TRUE, TRUE, TRUE, TRUE),
('admin', 'schedules', TRUE, TRUE, TRUE, TRUE, FALSE),
('admin', 'audit', FALSE, TRUE, FALSE, FALSE, FALSE),
('admin', 'playbooks', TRUE, TRUE, TRUE, TRUE, FALSE),
('admin', 'hosts', TRUE, TRUE, TRUE, TRUE, FALSE),
('admin', 'groups', TRUE, TRUE, TRUE, TRUE, FALSE),

-- Manager permissions
('manager', 'projects', TRUE, TRUE, TRUE, TRUE, FALSE),
('manager', 'inventories', TRUE, TRUE, TRUE, TRUE, FALSE),
('manager', 'credentials', TRUE, TRUE, TRUE, FALSE, FALSE),
('manager', 'templates', TRUE, TRUE, TRUE, TRUE, TRUE),
('manager', 'jobs', TRUE, TRUE, FALSE, FALSE, TRUE),
('manager', 'schedules', TRUE, TRUE, TRUE, TRUE, FALSE),
('manager', 'audit', FALSE, TRUE, FALSE, FALSE, FALSE),
('manager', 'playbooks', TRUE, TRUE, TRUE, FALSE, FALSE),
('manager', 'hosts', TRUE, TRUE, TRUE, TRUE, FALSE),
('manager', 'groups', TRUE, TRUE, TRUE, TRUE, FALSE),

-- Operator permissions
('operator', 'projects', FALSE, TRUE, FALSE, FALSE, FALSE),
('operator', 'inventories', FALSE, TRUE, FALSE, FALSE, FALSE),
('operator', 'credentials', FALSE, TRUE, FALSE, FALSE, FALSE),
('operator', 'templates', FALSE, TRUE, FALSE, FALSE, TRUE),
('operator', 'jobs', TRUE, TRUE, FALSE, FALSE, TRUE),
('operator', 'schedules', FALSE, TRUE, FALSE, FALSE, FALSE),
('operator', 'playbooks', FALSE, TRUE, FALSE, FALSE, FALSE),
('operator', 'hosts', FALSE, TRUE, FALSE, FALSE, FALSE),
('operator', 'groups', FALSE, TRUE, FALSE, FALSE, FALSE),

-- Viewer permissions
('viewer', 'projects', FALSE, TRUE, FALSE, FALSE, FALSE),
('viewer', 'inventories', FALSE, TRUE, FALSE, FALSE, FALSE),
('viewer', 'credentials', FALSE, FALSE, FALSE, FALSE, FALSE),
('viewer', 'templates', FALSE, TRUE, FALSE, FALSE, FALSE),
('viewer', 'jobs', FALSE, TRUE, FALSE, FALSE, FALSE),
('viewer', 'schedules', FALSE, TRUE, FALSE, FALSE, FALSE),
('viewer', 'audit', FALSE, TRUE, FALSE, FALSE, FALSE),
('viewer', 'playbooks', FALSE, TRUE, FALSE, FALSE, FALSE),
('viewer', 'hosts', FALSE, TRUE, FALSE, FALSE, FALSE),
('viewer', 'groups', FALSE, TRUE, FALSE, FALSE, FALSE)
ON CONFLICT DO NOTHING;

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
