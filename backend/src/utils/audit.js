import { pool } from '../db/index.js';

export async function logAudit({
  actorId,
  action,
  targetType,
  targetId = null,
  details = null,
  status = 'success',
  ipAddress = null
}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id, details, status, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [actorId, action, targetType, targetId, details, status, ipAddress]
    );
  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}
