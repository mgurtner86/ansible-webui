import express from 'express';
import { pool } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, target_type, actor_id } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        al.*,
        u.email as actor_email,
        u.full_name as actor_name
      FROM audit_logs al
      LEFT JOIN users u ON al.actor_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (action) {
      query += ` AND al.action = $${paramCount}`;
      params.push(action);
      paramCount++;
    }

    if (target_type) {
      query += ` AND al.target_type = $${paramCount}`;
      params.push(target_type);
      paramCount++;
    }

    if (actor_id) {
      query += ` AND al.actor_id = $${paramCount}`;
      params.push(actor_id);
      paramCount++;
    }

    query += ` ORDER BY al.timestamp DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      WHERE 1=1
      ${action ? `AND al.action = '${action}'` : ''}
      ${target_type ? `AND al.target_type = '${target_type}'` : ''}
      ${actor_id ? `AND al.actor_id = '${actor_id}'` : ''}
    `;
    const countResult = await pool.query(countQuery);

    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        action,
        COUNT(*) as count
      FROM audit_logs
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY action
      ORDER BY count DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch audit stats:', error);
    res.status(500).json({ error: 'Failed to fetch audit stats' });
  }
});

export async function createAuditLog(actorId, action, targetType, targetId, before = {}, after = {}, ipAddress = null, userAgent = null, details = null, status = 'success') {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id, before, after, ip_address, user_agent, details, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [actorId, action, targetType, targetId, JSON.stringify(before), JSON.stringify(after), ipAddress, userAgent, details, status]
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export default router;
