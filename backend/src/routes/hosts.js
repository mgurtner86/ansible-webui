import express from 'express';
import { pool } from '../db/index.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { inventory_id, hostname, vars, groups, enabled } = req.body;

    const result = await pool.query(
      `INSERT INTO hosts (inventory_id, hostname, vars, groups, enabled)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [inventory_id, hostname, vars || {}, groups || [], enabled !== false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create host error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hosts WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Host not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get host error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { hostname, vars, groups, enabled } = req.body;

    const result = await pool.query(
      `UPDATE hosts
       SET hostname = $1, vars = $2, groups = $3, enabled = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [hostname, vars || {}, groups || [], enabled !== false, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Host not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update host error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM hosts WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Host not found' });
    }

    res.json({ message: 'Host deleted successfully' });
  } catch (error) {
    console.error('Delete host error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
