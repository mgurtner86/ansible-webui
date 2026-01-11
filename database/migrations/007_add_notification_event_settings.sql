-- Add notification event settings
INSERT INTO settings (key, value, category, description, is_encrypted) VALUES
    ('notification.job_success.enabled', 'false', 'notification', 'Send notification when a job completes successfully', FALSE),
    ('notification.job_failure.enabled', 'true', 'notification', 'Send notification when a job fails', FALSE),
    ('notification.job_start.enabled', 'false', 'notification', 'Send notification when a job starts execution', FALSE),
    ('notification.system_error.enabled', 'true', 'notification', 'Send notification when system errors occur', FALSE),
    ('notification.schedule_trigger.enabled', 'false', 'notification', 'Send notification when a scheduled job is triggered', FALSE),
    ('notification.inventory_sync.enabled', 'false', 'notification', 'Send notification when inventory synchronization completes', FALSE)
ON CONFLICT (key) DO NOTHING;
