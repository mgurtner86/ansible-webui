import express from 'express';
import { pool } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*,
             t.name as template_name,
             u.full_name as created_by_name
      FROM schedules s
      LEFT JOIN templates t ON s.template_id = t.id
      LEFT JOIN users u ON s.created_by = u.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*,
             t.name as template_name
      FROM schedules s
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

router.post('/', async (req, res) => {
  try {
    const { template_id, name, description, cron, timezone, enabled } = req.body;

    const result = await pool.query(`
      INSERT INTO schedules (template_id, name, description, cron, timezone, enabled, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [template_id, name, description || '', cron, timezone || 'UTC', enabled !== false, req.session.userId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { template_id, name, description, cron, timezone, enabled } = req.body;

    const result = await pool.query(`
      UPDATE schedules
      SET template_id = $1, name = $2, description = $3, cron = $4, timezone = $5, enabled = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [template_id, name, description, cron, timezone, enabled, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM schedules WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
