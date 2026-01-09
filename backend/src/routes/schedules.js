import express from 'express';
import { pool } from '../api.js';

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.full_name as created_by_name,
        t.name as template_name
      FROM schedules s
      JOIN users u ON s.created_by = u.id
      LEFT JOIN templates t ON s.template_id = t.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.full_name as created_by_name,
        t.name as template_name
      FROM schedules s
      JOIN users u ON s.created_by = u.id
      LEFT JOIN templates t ON s.template_id = t.id
      WHERE s.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, template_id, cron, timezone, enabled } = req.body;

    const result = await pool.query(`
      INSERT INTO schedules (name, description, template_id, cron, timezone, enabled, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [name, description || '', template_id, cron, timezone || 'UTC', enabled !== false, req.session.userId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, description, template_id, cron, timezone, enabled } = req.body;

    const result = await pool.query(`
      UPDATE schedules
      SET name = $1, description = $2, template_id = $3, cron = $4, timezone = $5, enabled = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [name, description, template_id, cron, timezone, enabled, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM schedules WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/toggle', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE schedules SET enabled = NOT enabled, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
