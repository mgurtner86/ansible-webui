import express from 'express';
import { pool } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, u.full_name as owner_name,
             COUNT(DISTINCT h.id) as host_count
      FROM inventories i
      LEFT JOIN users u ON i.owner_id = u.id
      LEFT JOIN hosts h ON h.inventory_id = i.id
      GROUP BY i.id, u.full_name
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get inventories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, u.full_name as owner_name
      FROM inventories i
      LEFT JOIN users u ON i.owner_id = u.id
      WHERE i.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, source, content_or_ref, variables } = req.body;

    const result = await pool.query(`
      INSERT INTO inventories (name, description, source, content_or_ref, variables, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, description || '', source || 'static', content_or_ref || '', variables || {}, req.session.userId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, source, content_or_ref, variables } = req.body;

    const result = await pool.query(`
      UPDATE inventories
      SET name = $1, description = $2, source = $3, content_or_ref = $4, variables = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [name, description, source, content_or_ref, variables, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM inventories WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    res.json({ message: 'Inventory deleted successfully' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/hosts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM hosts
      WHERE inventory_id = $1
      ORDER BY hostname
    `, [req.params.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get hosts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/hosts', async (req, res) => {
  try {
    const { hostname, vars, groups, enabled } = req.body;

    const result = await pool.query(`
      INSERT INTO hosts (inventory_id, hostname, vars, groups, enabled)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.params.id, hostname, vars || {}, groups || [], enabled !== false]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create host error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:inventoryId/hosts/:hostId', async (req, res) => {
  try {
    const { hostname, vars, groups, enabled } = req.body;

    const result = await pool.query(`
      UPDATE hosts
      SET hostname = $1, vars = $2, groups = $3, enabled = $4, updated_at = NOW()
      WHERE id = $5 AND inventory_id = $6
      RETURNING *
    `, [hostname, vars, groups, enabled, req.params.hostId, req.params.inventoryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Host not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update host error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:inventoryId/hosts/:hostId', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM hosts WHERE id = $1 AND inventory_id = $2 RETURNING id', [req.params.hostId, req.params.inventoryId]);

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
