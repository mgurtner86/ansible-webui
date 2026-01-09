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
      SELECT p.*, u.full_name as owner_name,
        (SELECT COUNT(*) FROM playbooks WHERE project_id = p.id) as playbook_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.full_name as owner_name
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, scm_type, scm_url, scm_branch, scm_credential_id } = req.body;

    const result = await pool.query(`
      INSERT INTO projects (name, description, scm_type, scm_url, scm_branch, scm_credential_id, owner_id, last_sync_status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [name, description || '', scm_type || 'git', scm_url, scm_branch || 'main', scm_credential_id || null, req.session.userId, 'pending']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, description, scm_type, scm_url, scm_branch, scm_credential_id } = req.body;

    const result = await pool.query(`
      UPDATE projects
      SET name = $1, description = $2, scm_type = $3, scm_url = $4, scm_branch = $5, scm_credential_id = $6, updated_at = NOW()
      WHERE id = $7 AND owner_id = $8
      RETURNING *
    `, [name, description, scm_type, scm_url, scm_branch, scm_credential_id || null, req.params.id, req.session.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND owner_id = $2 RETURNING id',
      [req.params.id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/sync', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE projects SET last_sync_at = NOW(), last_sync_status = $1 WHERE id = $2',
      ['success', req.params.id]
    );

    res.json({ message: 'Project synced successfully' });
  } catch (error) {
    console.error('Sync project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:projectId/playbooks', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM playbooks WHERE project_id = $1 ORDER BY path',
      [req.params.projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get playbooks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:projectId/playbooks', requireAuth, async (req, res) => {
  try {
    const { name, path, description } = req.body;

    const result = await pool.query(`
      INSERT INTO playbooks (project_id, name, path, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `, [req.params.projectId, name, path, description || '']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create playbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
