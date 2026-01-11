-- Migration: Add Email Templates and Notification Preferences
-- This migration adds the email_templates table and related settings

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Insert default email templates
INSERT INTO email_templates (name, subject, body, variables, description) VALUES
(
  'job_success',
  'Job Completed Successfully: {{job_name}}',
  E'<html><body>\n<h2>Job Execution Completed</h2>\n<p>The following job has completed successfully:</p>\n<ul>\n<li><strong>Job:</strong> {{job_name}}</li>\n<li><strong>Template:</strong> {{template_name}}</li>\n<li><strong>Completed At:</strong> {{completed_at}}</li>\n<li><strong>Duration:</strong> {{duration}}</li>\n</ul>\n<p>View the full output in the Ansible Web UI.</p>\n</body></html>',
  '["job_name", "template_name", "completed_at", "duration"]'::jsonb,
  'Notification sent when a job completes successfully'
),
(
  'job_failed',
  'Job Failed: {{job_name}}',
  E'<html><body>\n<h2 style="color: #d32f2f;">Job Execution Failed</h2>\n<p>The following job has failed:</p>\n<ul>\n<li><strong>Job:</strong> {{job_name}}</li>\n<li><strong>Template:</strong> {{template_name}}</li>\n<li><strong>Failed At:</strong> {{failed_at}}</li>\n<li><strong>Error:</strong> {{error_message}}</li>\n</ul>\n<p>Please review the job output in the Ansible Web UI for more details.</p>\n</body></html>',
  '["job_name", "template_name", "failed_at", "error_message"]'::jsonb,
  'Notification sent when a job fails'
),
(
  'schedule_upcoming',
  'Scheduled Job Reminder: {{job_name}}',
  E'<html><body>\n<h2>Upcoming Scheduled Job</h2>\n<p>A scheduled job will run soon:</p>\n<ul>\n<li><strong>Job:</strong> {{job_name}}</li>\n<li><strong>Schedule:</strong> {{schedule_name}}</li>\n<li><strong>Next Run:</strong> {{next_run}}</li>\n</ul>\n</body></html>',
  '["job_name", "schedule_name", "next_run"]'::jsonb,
  'Notification sent before a scheduled job runs'
),
(
  'inventory_sync_completed',
  'Inventory Sync Completed: {{inventory_name}}',
  E'<html><body>\n<h2>Inventory Synchronization Completed</h2>\n<p>The inventory sync has completed:</p>\n<ul>\n<li><strong>Inventory:</strong> {{inventory_name}}</li>\n<li><strong>Hosts Added:</strong> {{hosts_added}}</li>\n<li><strong>Hosts Updated:</strong> {{hosts_updated}}</li>\n<li><strong>Completed At:</strong> {{completed_at}}</li>\n</ul>\n</body></html>',
  '["inventory_name", "hosts_added", "hosts_updated", "completed_at"]'::jsonb,
  'Notification sent when an inventory sync completes'
)
ON CONFLICT (name) DO NOTHING;

-- Add notification preference settings for each user (stored in settings table)
INSERT INTO settings (key, value, category, description, is_encrypted)
VALUES
  ('notifications.job_success.enabled', 'true', 'notifications', 'Enable notifications for successful job completions', false),
  ('notifications.job_failed.enabled', 'true', 'notifications', 'Enable notifications for failed jobs', false),
  ('notifications.schedule_upcoming.enabled', 'false', 'notifications', 'Enable notifications for upcoming scheduled jobs', false),
  ('notifications.inventory_sync.enabled', 'false', 'notifications', 'Enable notifications for inventory sync completions', false),
  ('notifications.system_alerts.enabled', 'true', 'notifications', 'Enable system alert notifications', false)
ON CONFLICT (key) DO NOTHING;

-- Add local authentication settings
INSERT INTO settings (key, value, category, description, is_encrypted)
VALUES
  ('auth.local.enabled', 'true', 'authentication', 'Enable local username/password authentication', false),
  ('auth.local.require_strong_password', 'true', 'authentication', 'Require strong passwords (min 8 chars, mixed case, numbers)', false),
  ('auth.local.session_timeout', '3600', 'authentication', 'Session timeout in seconds (default: 1 hour)', false),
  ('auth.local.max_login_attempts', '5', 'authentication', 'Maximum login attempts before account lock', false)
ON CONFLICT (key) DO NOTHING;

-- Create index for faster template lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
