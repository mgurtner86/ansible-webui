import express from 'express';
import { pool } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.type, c.name, c.description, c.scope, c.created_at, c.updated_at,
             u.full_name as owner_name
      FROM credentials c
      LEFT JOIN users u ON c.owner_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.type, c.name, c.description, c.scope, c.created_at, c.updated_at,
             c.encrypted_secret, u.full_name as owner_name
      FROM credentials c
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE c.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const credential = result.rows[0];

    if (credential.encrypted_secret) {
      try {
        const decrypted = JSON.parse(Buffer.from(credential.encrypted_secret, 'base64').toString());
        credential.secret = decrypted;
      } catch (e) {
        console.error('Error decrypting secret:', e);
      }
      delete credential.encrypted_secret;
    }

    res.json(credential);
  } catch (error) {
    console.error('Get credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, name, description, secret, scope } = req.body;

    const encryptedSecret = Buffer.from(JSON.stringify(secret)).toString('base64');

    const result = await pool.query(`
      INSERT INTO credentials (type, name, description, encrypted_secret, scope, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, type, name, description, scope, created_at, updated_at
    `, [type, name, description || '', encryptedSecret, scope || 'user', req.session.userId]);

    await logAudit({
      actorId: req.session.userId,
      action: 'create',
      targetType: 'credential',
      targetId: result.rows[0].id,
      details: `Created credential: ${name} (${type})`,
      ipAddress: req.ip
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { type, name, description, secret, scope } = req.body;

    let query = `
      UPDATE credentials
      SET type = $1, name = $2, description = $3, scope = $4, updated_at = NOW()
    `;
    const params = [type, name, description, scope, req.params.id];

    if (secret) {
      const encryptedSecret = Buffer.from(JSON.stringify(secret)).toString('base64');
      query = `
        UPDATE credentials
        SET type = $1, name = $2, description = $3, encrypted_secret = $4, scope = $5, updated_at = NOW()
        WHERE id = $6
        RETURNING id, type, name, description, scope, created_at, updated_at
      `;
      params.splice(3, 0, encryptedSecret);
      params[5] = req.params.id;
    } else {
      query += ' WHERE id = $5 RETURNING id, type, name, description, scope, created_at, updated_at';
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    await logAudit({
      actorId: req.session.userId,
      action: 'update',
      targetType: 'credential',
      targetId: req.params.id,
      details: `Updated credential: ${name}`,
      ipAddress: req.ip
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM credentials WHERE id = $1 RETURNING id, name', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    await logAudit({
      actorId: req.session.userId,
      action: 'delete',
      targetType: 'credential',
      targetId: req.params.id,
      details: `Deleted credential: ${result.rows[0].name || req.params.id}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Delete credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
