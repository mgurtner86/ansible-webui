-- Migration: Add credential_id to inventories table
-- Description: Allows inventories to have a default credential

-- Add credential_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'inventories'
        AND column_name = 'credential_id'
    ) THEN
        ALTER TABLE inventories
        ADD COLUMN credential_id UUID REFERENCES credentials(id) ON DELETE SET NULL;

        RAISE NOTICE 'Column credential_id added to inventories table';
    ELSE
        RAISE NOTICE 'Column credential_id already exists in inventories table';
    END IF;
END $$;
