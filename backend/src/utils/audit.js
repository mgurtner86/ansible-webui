import { supabase } from '../db/index.js';

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
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: actorId,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
        status,
        ip_address: ipAddress
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}
