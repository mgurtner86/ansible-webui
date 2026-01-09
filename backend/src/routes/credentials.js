import express from 'express';
import crypto from 'crypto';
import { pool } from '../api.js';

const router = express.Router();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32b';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

function encrypt(text) {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(JSON.stringify(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.type, c.name, c.description, c.scope, c.created_at, c.updated_at,
        u.full_name as owner_name
      FROM credentials c
      JOIN users u ON c.owner_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.full_name as owner_name
      FROM credentials c
      JOIN users u ON c.owner_id = u.id
      WHERE c.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const credential = result.rows[0];

    try {
      credential.decrypted_secret = JSON.stringify(decrypt(credential.encrypted_secret));
    } catch (err) {
      console.error('Decryption error:', err);
      credential.decrypted_secret = '{}';
    }

    delete credential.encrypted_secret;

    res.json(credential);
  } catch (error) {
    console.error('Get credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, name, description, secret } = req.body;

    const encryptedSecret = encrypt(secret);

    const result = await pool.query(`
      INSERT INTO credentials (type, name, description, encrypted_secret, scope, owner_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, type, name, description, scope, created_at, updated_at
    `, [type, name, description || '', encryptedSecret, 'user', req.session.userId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { type, name, description, secret } = req.body;

    const encryptedSecret = encrypt(secret);

    const result = await pool.query(`
      UPDATE credentials
      SET type = $1, name = $2, description = $3, encrypted_secret = $4, updated_at = NOW()
      WHERE id = $5 AND owner_id = $6
      RETURNING id, type, name, description, scope, created_at, updated_at
    `, [type, name, description, encryptedSecret, req.params.id, req.session.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM credentials WHERE id = $1 AND owner_id = $2 RETURNING id',
      [req.params.id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    res.json({ message: 'Credential deleted' });
  } catch (error) {
    console.error('Delete credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
