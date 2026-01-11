#!/bin/bash

# Run all database migrations
echo "Running database migrations..."

export PGPASSWORD=ansible_secure_password

# Run each migration file in order
for file in database/migrations/*.sql; do
    echo "Applying migration: $(basename $file)"
    psql -h localhost -U ansible -d ansible_tower -f "$file"
done

echo "✅ All migrations completed!"
