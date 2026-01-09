import express from 'express';
import { Queue } from 'bullmq';
import { pool } from '../db/index.js';

const router = express.Router();

const jobQueue = new Queue('ansible-jobs', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
             p.name as playbook_name,
             i.name as inventory_name,
             c.name as credential_name,
             u.full_name as owner_name
      FROM templates t
      LEFT JOIN playbooks p ON t.playbook_id = p.id
      LEFT JOIN inventories i ON t.inventory_id = i.id
      LEFT JOIN credentials c ON t.credential_id = c.id
      LEFT JOIN users u ON t.owner_id = u.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
             p.name as playbook_name,
             i.name as inventory_name,
             c.name as credential_name
      FROM templates t
      LEFT JOIN playbooks p ON t.playbook_id = p.id
      LEFT JOIN inventories i ON t.inventory_id = i.id
      LEFT JOIN credentials c ON t.credential_id = c.id
      WHERE t.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name, description, playbook_id, inventory_id, credential_id,
      extra_vars_schema, limits, tags, skip_tags, forks, timeout, become, verbosity
    } = req.body;

    const result = await pool.query(`
      INSERT INTO templates (
        name, description, playbook_id, inventory_id, credential_id,
        extra_vars_schema, limits, tags, skip_tags, forks, timeout, become, verbosity, owner_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      name, description || '', playbook_id, inventory_id, credential_id || null,
      extra_vars_schema || {}, limits || null, tags || [], skip_tags || [],
      forks || 5, timeout || 3600, become || false, verbosity || 0, req.session.userId
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const {
      name, description, playbook_id, inventory_id, credential_id,
      extra_vars_schema, limits, tags, skip_tags, forks, timeout, become, verbosity
    } = req.body;

    const result = await pool.query(`
      UPDATE templates
      SET name = $1, description = $2, playbook_id = $3, inventory_id = $4, credential_id = $5,
          extra_vars_schema = $6, limits = $7, tags = $8, skip_tags = $9, forks = $10,
          timeout = $11, become = $12, verbosity = $13, updated_at = NOW()
      WHERE id = $14
      RETURNING *
    `, [
      name, description, playbook_id, inventory_id, credential_id,
      extra_vars_schema, limits, tags, skip_tags, forks, timeout, become, verbosity, req.params.id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM templates WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/launch', async (req, res) => {
  try {
    const { extra_vars, limits, tags } = req.body;

    const result = await pool.query(`
      INSERT INTO jobs (template_id, triggered_by, status, extra_vars, limits, tags)
      VALUES ($1, $2, 'pending', $3, $4, $5)
      RETURNING *
    `, [req.params.id, req.session.userId, extra_vars || {}, limits || null, tags || []]);

    const job = result.rows[0];

    await jobQueue.add('execute-playbook', {
      jobId: job.id,
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Launch template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
