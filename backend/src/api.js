import express from 'express';
import cors from 'cors';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';
import inventoriesRouter from './routes/inventories.js';
import credentialsRouter from './routes/credentials.js';
import projectsRouter from './routes/projects.js';
import templatesRouter from './routes/templates.js';
import jobsRouter from './routes/jobs.js';
import schedulesRouter from './routes/schedules.js';

dotenv.config();

const { Pool } = pg;
const PgSession = pgSession(session);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ansible:ansible_password@postgres:5432/ansible_tower',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'ansible-tower-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    req.session.userId = user.id;
    req.session.userEmail = user.email;

    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      session: {
        userId: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/session', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ user: null, session: null });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      req.session.destroy();
      return res.json({ user: null, session: null });
    }

    const user = result.rows[0];
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      session: {
        userId: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, mfa_enabled, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, full_name, email, role, mfa_enabled, is_active, created_at, last_login_at`,
      [full_name, email, hashedPassword, 'viewer', false, true]
    );

    const user = result.rows[0];

    req.session.userId = user.id;
    req.session.userEmail = user.email;

    res.status(201).json({
      user,
      session: {
        userId: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/inventories', inventoriesRouter);
app.use('/api/credentials', credentialsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/schedules', schedulesRouter);

const PORT = process.env.API_PORT || 3001;

app.listen(PORT, () => {
  console.log(`🌐 API Server running on port ${PORT}`);
});

export { pool };
