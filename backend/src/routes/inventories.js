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
      SELECT i.*, u.full_name as owner_name,
        (SELECT COUNT(*) FROM inventory_hosts WHERE inventory_id = i.id) as host_count
      FROM inventories i
      JOIN users u ON i.owner_id = u.id
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get inventories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, u.full_name as owner_name
      FROM inventories i
      JOIN users u ON i.owner_id = u.id
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

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, source } = req.body;

    const result = await pool.query(`
      INSERT INTO inventories (name, description, source, owner_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `, [name, description || '', source || 'static', req.session.userId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, description, source } = req.body;

    const result = await pool.query(`
      UPDATE inventories
      SET name = $1, description = $2, source = $3, updated_at = NOW()
      WHERE id = $4 AND owner_id = $5
      RETURNING *
    `, [name, description, source, req.params.id, req.session.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM inventories WHERE id = $1 AND owner_id = $2 RETURNING id',
      [req.params.id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    res.json({ message: 'Inventory deleted' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:inventoryId/hosts', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM inventory_hosts WHERE inventory_id = $1 ORDER BY hostname',
      [req.params.inventoryId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get hosts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:inventoryId/hosts', requireAuth, async (req, res) => {
  try {
    const { hostname, vars, groups, enabled } = req.body;

    const result = await pool.query(`
      INSERT INTO inventory_hosts (inventory_id, hostname, vars, groups, enabled, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [req.params.inventoryId, hostname, vars || {}, groups || [], enabled !== false]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create host error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:inventoryId/hosts/:hostId', requireAuth, async (req, res) => {
  try {
    const { hostname, vars, groups, enabled } = req.body;

    const result = await pool.query(`
      UPDATE inventory_hosts
      SET hostname = $1, vars = $2, groups = $3, enabled = $4, updated_at = NOW()
      WHERE id = $5 AND inventory_id = $6
      RETURNING *
    `, [hostname, vars || {}, groups || [], enabled !== false, req.params.hostId, req.params.inventoryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Host not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update host error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:inventoryId/hosts/:hostId', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM inventory_hosts WHERE id = $1 AND inventory_id = $2 RETURNING id',
      [req.params.hostId, req.params.inventoryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Host not found' });
    }

    res.json({ message: 'Host deleted' });
  } catch (error) {
    console.error('Delete host error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
