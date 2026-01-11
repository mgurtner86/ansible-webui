-- Add missing settings for authentication and email notifications
INSERT INTO settings (key, value, category, description, is_encrypted) VALUES
    ('auth.microsoft365.client_secret', '""', 'authentication', 'Microsoft 365 OAuth Client Secret', TRUE),
    ('auth.microsoft365.required_group_id', '""', 'authentication', 'Required Azure AD Group Object ID for access', FALSE),
    ('email.notifications.enabled', 'false', 'email', 'Enable email notifications for system events', FALSE),
    ('email.graph.tenant_id', '""', 'email', 'Microsoft Graph API Tenant ID', FALSE),
    ('email.graph.client_id', '""', 'email', 'Microsoft Graph API Client ID', FALSE),
    ('email.graph.client_secret', '""', 'email', 'Microsoft Graph API Client Secret', TRUE),
    ('email.from', '""', 'email', 'Email from address (must be valid Microsoft 365 mailbox)', FALSE),
    ('email.recipients', '""', 'email', 'Comma-separated list of recipient email addresses', FALSE)
ON CONFLICT (key) DO NOTHING;
