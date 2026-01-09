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
      SELECT t.*, u.full_name as owner_name,
        p.name as project_name,
        pb.name as playbook_name,
        i.name as inventory_name,
        c.name as credential_name
      FROM job_templates t
      JOIN users u ON t.owner_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN playbooks pb ON t.playbook_id = pb.id
      LEFT JOIN inventories i ON t.inventory_id = i.id
      LEFT JOIN credentials c ON t.credential_id = c.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.full_name as owner_name,
        p.name as project_name,
        pb.name as playbook_name,
        i.name as inventory_name,
        c.name as credential_name
      FROM job_templates t
      JOIN users u ON t.owner_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN playbooks pb ON t.playbook_id = pb.id
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

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, project_id, playbook_id, inventory_id, credential_id, job_type, verbosity, extra_vars, tags, skip_tags, limit } = req.body;

    const result = await pool.query(`
      INSERT INTO job_templates (name, description, project_id, playbook_id, inventory_id, credential_id, job_type, verbosity, extra_vars, tags, skip_tags, limit, owner_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `, [name, description || '', project_id, playbook_id, inventory_id, credential_id || null, job_type || 'run', verbosity || 0, extra_vars || {}, tags || '', skip_tags || '', limit || '', req.session.userId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, description, project_id, playbook_id, inventory_id, credential_id, job_type, verbosity, extra_vars, tags, skip_tags, limit } = req.body;

    const result = await pool.query(`
      UPDATE job_templates
      SET name = $1, description = $2, project_id = $3, playbook_id = $4, inventory_id = $5, credential_id = $6, job_type = $7, verbosity = $8, extra_vars = $9, tags = $10, skip_tags = $11, limit = $12, updated_at = NOW()
      WHERE id = $13 AND owner_id = $14
      RETURNING *
    `, [name, description, project_id, playbook_id, inventory_id, credential_id || null, job_type, verbosity, extra_vars, tags, skip_tags, limit, req.params.id, req.session.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM job_templates WHERE id = $1 AND owner_id = $2 RETURNING id',
      [req.params.id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
