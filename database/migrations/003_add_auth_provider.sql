-- Add auth_provider column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';

-- Make password_hash nullable (OAuth users don't have passwords)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Update existing users to have 'local' auth_provider
UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL;
