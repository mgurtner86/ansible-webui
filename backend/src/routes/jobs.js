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
      SELECT j.*, u.full_name as triggered_by_name,
        t.name as template_name
      FROM jobs j
      JOIN users u ON j.triggered_by = u.id
      LEFT JOIN templates t ON j.template_id = t.id
      ORDER BY j.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT j.*, u.full_name as triggered_by_name,
        t.name as template_name,
        pb.name as playbook_name,
        p.name as project_name,
        i.name as inventory_name
      FROM jobs j
      JOIN users u ON j.triggered_by = u.id
      LEFT JOIN templates t ON j.template_id = t.id
      LEFT JOIN playbooks pb ON t.playbook_id = pb.id
      LEFT JOIN projects p ON pb.project_id = p.id
      LEFT JOIN inventories i ON t.inventory_id = i.id
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

router.post('/', requireAuth, async (req, res) => {
  try {
    const { template_id, extra_vars } = req.body;

    const result = await pool.query(`
      INSERT INTO jobs (template_id, triggered_by, status, extra_vars, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [template_id, req.session.userId, 'queued', extra_vars || {}]);

    setTimeout(async () => {
      try {
        await pool.query(
          `UPDATE jobs SET status = 'running' WHERE id = $1`,
          [result.rows[0].id]
        );

        await pool.query(`
          INSERT INTO job_events (job_id, event_type, message, timestamp)
          VALUES ($1, 'playbook_on_start', 'Starting playbook execution', NOW())
        `, [result.rows[0].id]);

        setTimeout(async () => {
          try {
            await pool.query(
              `UPDATE jobs SET status = 'success', finished_at = NOW() WHERE id = $1`,
              [result.rows[0].id]
            );

            await pool.query(`
              INSERT INTO job_events (job_id, event_type, message, timestamp)
              VALUES ($1, 'playbook_on_stats', 'Playbook execution completed successfully', NOW())
            `, [result.rows[0].id]);
          } catch (err) {
            console.error('Job completion error:', err);
          }
        }, 3000);
      } catch (err) {
        console.error('Job start error:', err);
      }
    }, 1000);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE jobs SET status = 'cancelled', finished_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Cancel job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/events', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM job_events WHERE job_id = $1 ORDER BY timestamp',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get job events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
