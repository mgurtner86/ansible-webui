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
      SELECT s.*, u.full_name as owner_name,
        jt.name as template_name
      FROM schedules s
      JOIN users u ON s.owner_id = u.id
      LEFT JOIN job_templates jt ON s.job_template_id = jt.id
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
      SELECT s.*, u.full_name as owner_name,
        jt.name as template_name
      FROM schedules s
      JOIN users u ON s.owner_id = u.id
      LEFT JOIN job_templates jt ON s.job_template_id = jt.id
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
    const { name, description, job_template_id, cron_expression, timezone, enabled } = req.body;

    const result = await pool.query(`
      INSERT INTO schedules (name, description, job_template_id, cron_expression, timezone, enabled, owner_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [name, description || '', job_template_id, cron_expression, timezone || 'UTC', enabled !== false, req.session.userId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, description, job_template_id, cron_expression, timezone, enabled } = req.body;

    const result = await pool.query(`
      UPDATE schedules
      SET name = $1, description = $2, job_template_id = $3, cron_expression = $4, timezone = $5, enabled = $6, updated_at = NOW()
      WHERE id = $7 AND owner_id = $8
      RETURNING *
    `, [name, description, job_template_id, cron_expression, timezone, enabled, req.params.id, req.session.userId]);

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
      'DELETE FROM schedules WHERE id = $1 AND owner_id = $2 RETURNING id',
      [req.params.id, req.session.userId]
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
      `UPDATE schedules SET enabled = NOT enabled, updated_at = NOW() WHERE id = $1 AND owner_id = $2 RETURNING *`,
      [req.params.id, req.session.userId]
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
