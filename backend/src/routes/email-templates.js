import express from 'express';
import { pool } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, subject, body, variables, description, is_active, created_at, updated_at
      FROM email_templates
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch email templates:', error);
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM email_templates WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to fetch template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, subject, body, variables, description, is_active } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ error: 'Name, subject, and body are required' });
    }

    const result = await pool.query(
      `INSERT INTO email_templates (name, subject, body, variables, description, is_active, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
       RETURNING *`,
      [name, subject, body, variables || [], description, is_active !== false, req.session.userId]
    );

    await logAudit({
      actorId: req.session.userId,
      action: 'create',
      targetType: 'email_template',
      targetId: result.rows[0].id,
      details: `Created email template: ${name}`,
      ipAddress: req.ip
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body, variables, description, is_active } = req.body;

    const result = await pool.query(
      `UPDATE email_templates
       SET name = COALESCE($1, name),
           subject = COALESCE($2, subject),
           body = COALESCE($3, body),
           variables = COALESCE($4, variables),
           description = COALESCE($5, description),
           is_active = COALESCE($6, is_active),
           updated_by = $7,
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, subject, body, variables, description, is_active, req.session.userId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await logAudit({
      actorId: req.session.userId,
      action: 'update',
      targetType: 'email_template',
      targetId: id,
      details: `Updated email template: ${name || result.rows[0].name}`,
      ipAddress: req.ip
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await pool.query('SELECT * FROM email_templates WHERE id = $1', [id]);

    if (template.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await pool.query('DELETE FROM email_templates WHERE id = $1', [id]);

    await logAudit({
      actorId: req.session.userId,
      action: 'delete',
      targetType: 'email_template',
      targetId: id,
      details: `Deleted email template: ${template.rows[0].name}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Failed to delete template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
