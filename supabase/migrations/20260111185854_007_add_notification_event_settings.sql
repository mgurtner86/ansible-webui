/*
  # Add Notification Event Settings

  1. New Settings
    - `notification.job_success.enabled` - Enable notifications for successful jobs
    - `notification.job_failure.enabled` - Enable notifications for failed jobs
    - `notification.job_start.enabled` - Enable notifications when jobs start
    - `notification.system_error.enabled` - Enable notifications for system errors
    - `notification.schedule_trigger.enabled` - Enable notifications when scheduled jobs trigger
    - `notification.inventory_sync.enabled` - Enable notifications for inventory sync completion

  2. Changes
    - All notification settings default to `false` (disabled)
    - Settings are stored in 'notification' category
*/

-- Add notification event settings
INSERT INTO settings (key, value, category, description, is_encrypted) VALUES
    ('notification.job_success.enabled', 'false', 'notification', 'Send notification when a job completes successfully', FALSE),
    ('notification.job_failure.enabled', 'true', 'notification', 'Send notification when a job fails', FALSE),
    ('notification.job_start.enabled', 'false', 'notification', 'Send notification when a job starts execution', FALSE),
    ('notification.system_error.enabled', 'true', 'notification', 'Send notification when system errors occur', FALSE),
    ('notification.schedule_trigger.enabled', 'false', 'notification', 'Send notification when a scheduled job is triggered', FALSE),
    ('notification.inventory_sync.enabled', 'false', 'notification', 'Send notification when inventory synchronization completes', FALSE)
ON CONFLICT (key) DO NOTHING;
