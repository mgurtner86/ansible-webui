-- Add OAuth client secret settings
INSERT INTO settings (key, value, category, description, is_encrypted) VALUES
    ('auth.microsoft365.client_secret', '""', 'authentication', 'Microsoft 365 OAuth Client Secret', true),
    ('email.oauth.client_secret', '""', 'email', 'OAuth client secret for email', true)
ON CONFLICT (key) DO NOTHING;
