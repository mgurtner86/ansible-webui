import express from 'express';
import { pool } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, subject, body, variables, description, is_active, created_at, updated_at FROM email_templates ORDER BY name'
    );

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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name,
        subject,
        body,
        JSON.stringify(variables || []),
        description,
        is_active !== false,
        req.session.userId,
        req.session.userId
      ]
    );

    const template = result.rows[0];

    await logAudit({
      actorId: req.session.userId,
      action: 'create',
      targetType: 'email_template',
      targetId: template.id,
      details: `Created email template: ${name}`,
      ipAddress: req.ip
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Failed to create template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body, variables, description, is_active } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (subject !== undefined) {
      updates.push(`subject = $${paramIndex++}`);
      values.push(subject);
    }
    if (body !== undefined) {
      updates.push(`body = $${paramIndex++}`);
      values.push(body);
    }
    if (variables !== undefined) {
      updates.push(`variables = $${paramIndex++}`);
      values.push(JSON.stringify(variables));
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    updates.push(`updated_by = $${paramIndex++}`);
    values.push(req.session.userId);
    updates.push(`updated_at = NOW()`);

    values.push(id);

    const result = await pool.query(
      `UPDATE email_templates SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = result.rows[0];

    await logAudit({
      actorId: req.session.userId,
      action: 'update',
      targetType: 'email_template',
      targetId: id,
      details: `Updated email template: ${name || template.name}`,
      ipAddress: req.ip
    });

    res.json(template);
  } catch (error) {
    console.error('Failed to update template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const templateResult = await pool.query(
      'SELECT * FROM email_templates WHERE id = $1',
      [id]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = templateResult.rows[0];

    await pool.query('DELETE FROM email_templates WHERE id = $1', [id]);

    await logAudit({
      actorId: req.session.userId,
      action: 'delete',
      targetType: 'email_template',
      targetId: id,
      details: `Deleted email template: ${template.name}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Failed to delete template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
