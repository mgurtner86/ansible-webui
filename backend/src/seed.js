import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ansible:ansible_password@postgres:5432/ansible_tower',
});

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding database...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active
    `, ['admin@ansible-tower.local', hashedPassword, 'System Administrator', 'admin', true]);

    console.log('✅ Admin user created/updated:');
    console.log('   Email: admin@ansible-tower.local');
    console.log('   Password: admin123');

    const result = await client.query('SELECT id, email, full_name, role FROM users WHERE email = $1', ['admin@ansible-tower.local']);
    console.log('   User ID:', result.rows[0].id);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
