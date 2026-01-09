import express from 'express';
import { pool } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT j.*,
             t.name as template_name,
             u.full_name as triggered_by_name
      FROM jobs j
      LEFT JOIN templates t ON j.template_id = t.id
      LEFT JOIN users u ON j.triggered_by = u.id
      ORDER BY j.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT j.*,
             t.name as template_name,
             u.full_name as triggered_by_name
      FROM jobs j
      LEFT JOIN templates t ON j.template_id = t.id
      LEFT JOIN users u ON j.triggered_by = u.id
      WHERE j.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/events', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM job_events
      WHERE job_id = $1
      ORDER BY timestamp ASC
    `, [req.params.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get job events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE jobs
      SET status = 'cancelled', finished_at = NOW()
      WHERE id = $1 AND status IN ('queued', 'running')
      RETURNING *
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found or already finished' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Cancel job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
