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
      SELECT j.*, u.full_name as launched_by_name,
        jt.name as template_name,
        i.name as inventory_name
      FROM jobs j
      JOIN users u ON j.launched_by = u.id
      LEFT JOIN job_templates jt ON j.job_template_id = jt.id
      LEFT JOIN inventories i ON j.inventory_id = i.id
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
      SELECT j.*, u.full_name as launched_by_name,
        jt.name as template_name,
        i.name as inventory_name,
        p.name as project_name,
        pb.name as playbook_name
      FROM jobs j
      JOIN users u ON j.launched_by = u.id
      LEFT JOIN job_templates jt ON j.job_template_id = jt.id
      LEFT JOIN inventories i ON j.inventory_id = i.id
      LEFT JOIN projects p ON j.project_id = p.id
      LEFT JOIN playbooks pb ON j.playbook_id = pb.id
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
    const { job_template_id, inventory_id, project_id, playbook_id, credential_id, extra_vars } = req.body;

    const result = await pool.query(`
      INSERT INTO jobs (job_template_id, inventory_id, project_id, playbook_id, credential_id, extra_vars, status, launched_by, created_at, started_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [job_template_id || null, inventory_id, project_id, playbook_id, credential_id || null, extra_vars || {}, 'pending', req.session.userId]);

    setTimeout(async () => {
      try {
        await pool.query(
          `UPDATE jobs SET status = 'running' WHERE id = $1`,
          [result.rows[0].id]
        );

        await pool.query(`
          INSERT INTO job_events (job_id, event_type, task, host, status, message, created_at)
          VALUES ($1, 'playbook_on_start', 'Playbook started', '', 'ok', 'Starting playbook execution', NOW())
        `, [result.rows[0].id]);

        setTimeout(async () => {
          try {
            await pool.query(
              `UPDATE jobs SET status = 'successful', finished_at = NOW() WHERE id = $1`,
              [result.rows[0].id]
            );

            await pool.query(`
              INSERT INTO job_events (job_id, event_type, task, host, status, message, created_at)
              VALUES ($1, 'playbook_on_stats', 'Playbook completed', '', 'ok', 'Playbook execution completed successfully', NOW())
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
      `UPDATE jobs SET status = 'canceled', finished_at = NOW() WHERE id = $1 RETURNING *`,
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
      'SELECT * FROM job_events WHERE job_id = $1 ORDER BY created_at',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get job events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
