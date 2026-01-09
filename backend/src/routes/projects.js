import express from 'express';
import { pool } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.full_name as owner_name,
             COUNT(DISTINCT pl.id) as playbook_count
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN playbooks pl ON pl.project_id = p.id
      GROUP BY p.id, u.full_name
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.full_name as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
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

router.post('/', async (req, res) => {
  try {
    const { name, description, git_url, git_branch } = req.body;

    const result = await pool.query(`
      INSERT INTO projects (name, description, git_url, git_branch, owner_id, sync_status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `, [name, description || '', git_url, git_branch || 'main', req.session.userId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, git_url, git_branch } = req.body;

    const result = await pool.query(`
      UPDATE projects
      SET name = $1, description = $2, git_url = $3, git_branch = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [name, description, git_url, git_branch, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/sync', async (req, res) => {
  try {
    await pool.query(`
      UPDATE projects
      SET sync_status = 'syncing', updated_at = NOW()
      WHERE id = $1
    `, [req.params.id]);

    res.json({ message: 'Project sync started' });
  } catch (error) {
    console.error('Sync project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/playbooks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM playbooks
      WHERE project_id = $1
      ORDER BY name
    `, [req.params.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get playbooks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
