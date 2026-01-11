import { Router } from 'express';
import { pool } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, content, created_at, updated_at
       FROM playbooks
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.session.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching playbooks:', error);
    res.status(500).json({ error: 'Failed to fetch playbooks' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, content } = req.body;
    const result = await pool.query(
      `INSERT INTO playbooks (name, description, content, user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, content, req.session.userId]
    );

    await logAudit({
      actorId: req.session.userId,
      action: 'create',
      targetType: 'playbook',
      targetId: result.rows[0].id,
      details: `Created playbook: ${name}`,
      ipAddress: req.ip
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating playbook:', error);
    res.status(500).json({ error: 'Failed to create playbook' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM playbooks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playbook not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching playbook:', error);
    res.status(500).json({ error: 'Failed to fetch playbook' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, content } = req.body;
    const result = await pool.query(
      `UPDATE playbooks
       SET name = $1, description = $2, content = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, description, content, req.params.id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playbook not found' });
    }

    await logAudit({
      actorId: req.session.userId,
      action: 'update',
      targetType: 'playbook',
      targetId: req.params.id,
      details: `Updated playbook: ${name}`,
      ipAddress: req.ip
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating playbook:', error);
    res.status(500).json({ error: 'Failed to update playbook' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM playbooks WHERE id = $1 AND user_id = $2 RETURNING id, name',
      [req.params.id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playbook not found' });
    }

    await logAudit({
      actorId: req.session.userId,
      action: 'delete',
      targetType: 'playbook',
      targetId: req.params.id,
      details: `Deleted playbook: ${result.rows[0].name || req.params.id}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Playbook deleted successfully' });
  } catch (error) {
    console.error('Error deleting playbook:', error);
    res.status(500).json({ error: 'Failed to delete playbook' });
  }
});

export default router;
