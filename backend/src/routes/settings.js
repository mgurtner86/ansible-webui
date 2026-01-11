import express from 'express';
import { pool } from '../db/index.js';
import { createAuditLog } from './audit.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    let query = 'SELECT * FROM settings';
    const params = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY category, key';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT category
      FROM settings
      ORDER BY category
    `);
    res.json(result.rows.map(r => r.category));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to fetch setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.user?.id;

    const oldSetting = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);

    const result = await pool.query(
      `UPDATE settings
       SET value = $1, updated_by = $2, updated_at = NOW()
       WHERE key = $3
       RETURNING *`,
      [JSON.stringify(value), userId, key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    await createAuditLog(
      userId,
      'update_setting',
      'setting',
      result.rows[0].id,
      oldSetting.rows[0],
      result.rows[0],
      req.ip,
      req.get('user-agent'),
      `Updated setting: ${key}`,
      'success'
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { key, value, category, description, is_encrypted } = req.body;
    const userId = req.user?.id;

    const result = await pool.query(
      `INSERT INTO settings (key, value, category, description, is_encrypted, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [key, JSON.stringify(value), category, description, is_encrypted || false, userId]
    );

    await createAuditLog(
      userId,
      'create_setting',
      'setting',
      result.rows[0].id,
      {},
      result.rows[0],
      req.ip,
      req.get('user-agent'),
      `Created setting: ${key}`,
      'success'
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create setting:', error);
    res.status(500).json({ error: 'Failed to create setting' });
  }
});

router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user?.id;

    const oldSetting = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);

    if (oldSetting.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    await pool.query('DELETE FROM settings WHERE key = $1', [key]);

    await createAuditLog(
      userId,
      'delete_setting',
      'setting',
      oldSetting.rows[0].id,
      oldSetting.rows[0],
      {},
      req.ip,
      req.get('user-agent'),
      `Deleted setting: ${key}`,
      'success'
    );

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Failed to delete setting:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

export default router;
