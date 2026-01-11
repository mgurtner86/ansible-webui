import { pool } from '../db/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAppliedMigrations() {
  const result = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
  return result.rows.map(row => row.version);
}

async function applyMigration(filename, sql) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(sql);

    await client.query(
      'INSERT INTO schema_migrations (version) VALUES ($1)',
      [filename]
    );

    await client.query('COMMIT');
    console.log(`✅ Applied migration: ${filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Failed to apply migration ${filename}:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

export async function runMigrations() {
  try {
    await ensureMigrationsTable();

    const appliedMigrations = await getAppliedMigrations();

    const migrationsDir = path.join(__dirname, '../../../database/migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  No migrations directory found');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      if (!appliedMigrations.includes(file)) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        await applyMigration(file, sql);
        appliedCount++;
      }
    }

    if (appliedCount === 0) {
      console.log('✅ All migrations are up to date');
    } else {
      console.log(`✅ Applied ${appliedCount} migration(s)`);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
