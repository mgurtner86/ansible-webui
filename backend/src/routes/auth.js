import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db/index.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
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

    const { password_hash, mfa_secret, ...userWithoutPassword } = user;

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

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'All fields are required' });
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
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, 'viewer', TRUE)
       RETURNING id, email, full_name, role, mfa_enabled, is_active, created_at`,
      [email, hashedPassword, full_name]
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
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/session', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ user: null, session: null });
    }

    const result = await pool.query(
      'SELECT id, email, full_name, role, mfa_enabled, is_active, created_at, last_login_at FROM users WHERE id = $1 AND is_active = TRUE',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      req.session.destroy();
      return res.json({ user: null, session: null });
    }

    const user = result.rows[0];

    res.json({
      user,
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

export default router;
