-- Migration: Add JSON output field to jobs table
-- This field stores the structured JSON output from ansible-playbook
-- for precise parsing, while job_events contains the human-readable output

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS output_json JSONB DEFAULT NULL;

-- Add index for faster queries on large JSON outputs
CREATE INDEX IF NOT EXISTS idx_jobs_output_json ON jobs USING gin(output_json);
