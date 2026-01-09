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
        pb.name as playbook_name,
        p.name as project_name,
        i.name as inventory_name,
        c.name as credential_name
      FROM templates t
      JOIN users u ON t.owner_id = u.id
      LEFT JOIN playbooks pb ON t.playbook_id = pb.id
      LEFT JOIN projects p ON pb.project_id = p.id
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
        pb.name as playbook_name,
        p.name as project_name,
        i.name as inventory_name,
        c.name as credential_name
      FROM templates t
      JOIN users u ON t.owner_id = u.id
      LEFT JOIN playbooks pb ON t.playbook_id = pb.id
      LEFT JOIN projects p ON pb.project_id = p.id
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
    const { name, description, playbook_id, inventory_id, credential_id, verbosity, extra_vars_schema, tags, skip_tags, limits, forks, timeout, become } = req.body;

    const result = await pool.query(`
      INSERT INTO templates (name, description, playbook_id, inventory_id, credential_id, verbosity, extra_vars_schema, tags, skip_tags, limits, forks, timeout, become, owner_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *
    `, [name, description || '', playbook_id, inventory_id, credential_id || null, verbosity || 0, extra_vars_schema || {}, tags || [], skip_tags || [], limits || null, forks || 5, timeout || 3600, become || false, req.session.userId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, description, playbook_id, inventory_id, credential_id, verbosity, extra_vars_schema, tags, skip_tags, limits, forks, timeout, become } = req.body;

    const result = await pool.query(`
      UPDATE templates
      SET name = $1, description = $2, playbook_id = $3, inventory_id = $4, credential_id = $5, verbosity = $6, extra_vars_schema = $7, tags = $8, skip_tags = $9, limits = $10, forks = $11, timeout = $12, become = $13, updated_at = NOW()
      WHERE id = $14 AND owner_id = $15
      RETURNING *
    `, [name, description, playbook_id, inventory_id, credential_id || null, verbosity, extra_vars_schema, tags, skip_tags, limits, forks, timeout, become, req.params.id, req.session.userId]);

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
      'DELETE FROM templates WHERE id = $1 AND owner_id = $2 RETURNING id',
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
