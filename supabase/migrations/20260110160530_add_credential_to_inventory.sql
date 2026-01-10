/*
  # Add credential reference to inventories

  1. Changes
    - Add `credential_id` column to `inventories` table
    - Add foreign key constraint to `credentials` table
    - This allows inventories to have a default credential that can be used by templates

  2. Notes
    - This is optional - templates can still override with their own credentials
    - Provides a convenient default for inventory-level authentication
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventories' AND column_name = 'credential_id'
  ) THEN
    ALTER TABLE inventories ADD COLUMN credential_id uuid REFERENCES credentials(id) ON DELETE SET NULL;
  END IF;
END $$;
