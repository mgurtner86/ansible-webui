import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

router.get('/config', async (req, res) => {
  try {
    const settings = await pool.query(
      "SELECT key, value FROM settings WHERE key IN ('auth.microsoft365.enabled', 'auth.local.enabled')"
    );

    const config = {
      localEnabled: true,
      microsoftEnabled: false,
    };

    settings.rows.forEach(setting => {
      if (setting.key === 'auth.microsoft365.enabled') {
        config.microsoftEnabled = setting.value === true || setting.value === 'true';
      } else if (setting.key === 'auth.local.enabled') {
        config.localEnabled = setting.value === true || setting.value === 'true';
      }
    });

    res.json(config);
  } catch (error) {
    console.error('Auth config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
      'SELECT id, email, full_name, role, auth_provider, mfa_enabled, is_active, created_at, last_login_at FROM users WHERE id = $1 AND is_active = TRUE',
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

router.get('/microsoft/login', async (req, res) => {
  try {
    const settings = await pool.query(
      "SELECT key, value FROM settings WHERE key IN ('auth.microsoft365.client_id', 'auth.microsoft365.tenant_id')"
    );

    const clientId = settings.rows.find(s => s.key === 'auth.microsoft365.client_id')?.value;
    const tenantId = settings.rows.find(s => s.key === 'auth.microsoft365.tenant_id')?.value;

    if (!clientId || !tenantId) {
      return res.status(400).json({ error: 'Microsoft OAuth not configured' });
    }

    const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/api/auth/microsoft/callback`;
    const state = Math.random().toString(36).substring(7);
    req.session.oauthState = state;

    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_mode=query` +
      `&scope=${encodeURIComponent('openid profile email User.Read')}` +
      `&state=${state}`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Microsoft login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/microsoft/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || state !== req.session.oauthState) {
      return res.redirect('http://localhost:5173/login?error=invalid_state');
    }

    const settings = await pool.query(
      "SELECT key, value FROM settings WHERE key IN ('auth.microsoft365.client_id', 'auth.microsoft365.client_secret', 'auth.microsoft365.tenant_id')"
    );

    const clientId = settings.rows.find(s => s.key === 'auth.microsoft365.client_id')?.value;
    const clientSecret = settings.rows.find(s => s.key === 'auth.microsoft365.client_secret')?.value;
    const tenantId = settings.rows.find(s => s.key === 'auth.microsoft365.tenant_id')?.value;

    if (!clientId || !clientSecret || !tenantId) {
      return res.redirect('http://localhost:5173/login?error=config_error');
    }

    const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/api/auth/microsoft/callback`;

    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.redirect('http://localhost:5173/login?error=token_error');
    }

    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();

    const email = userData.mail || userData.userPrincipalName;
    const fullName = userData.displayName || email;

    let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      userResult = await pool.query(
        `INSERT INTO users (email, full_name, role, auth_provider, is_active)
         VALUES ($1, $2, 'viewer', 'microsoft365', TRUE)
         RETURNING *`,
        [email, fullName]
      );

      await logAudit({
        actorId: userResult.rows[0].id,
        action: 'create',
        targetType: 'user',
        targetId: userResult.rows[0].id,
        details: `User created via Microsoft OAuth: ${email}`,
        ipAddress: req.ip
      });
    } else {
      await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userResult.rows[0].id]);
    }

    const user = userResult.rows[0];

    await logAudit({
      actorId: user.id,
      action: 'login',
      targetType: 'user',
      targetId: user.id,
      details: `User logged in via Microsoft OAuth`,
      ipAddress: req.ip
    });

    req.session.userId = user.id;
    req.session.userEmail = user.email;

    res.redirect('http://localhost:5173/dashboard');
  } catch (error) {
    console.error('Microsoft callback error:', error);
    res.redirect('http://localhost:5173/login?error=auth_failed');
  }
});

export default router;
