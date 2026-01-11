import express from 'express';
import { supabase } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    let query = supabase
      .from('settings')
      .select('*');

    if (category) {
      query = query.eq('category', category);
    }

    query = query.order('category').order('key');

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('category')
      .order('category');

    if (error) throw error;

    const categories = [...new Set(data.map(r => r.category))];
    res.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Failed to fetch setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const { data, error } = await supabase
      .from('settings')
      .update({
        value: typeof value === 'string' ? value : JSON.stringify(value),
        updated_by: req.session.userId,
        updated_at: new Date().toISOString()
      })
      .eq('key', key)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    await logAudit({
      actorId: req.session.userId,
      action: 'update',
      targetType: 'setting',
      targetId: data.id,
      details: `Updated setting: ${key}`,
      ipAddress: req.ip
    });

    res.json(data);
  } catch (error) {
    console.error('Failed to update setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { key, value, category, description, is_encrypted } = req.body;

    const { data, error } = await supabase
      .from('settings')
      .insert({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        category,
        description,
        is_encrypted: is_encrypted || false,
        updated_by: req.session.userId
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      actorId: req.session.userId,
      action: 'create',
      targetType: 'setting',
      targetId: data.id,
      details: `Created setting: ${key}`,
      ipAddress: req.ip
    });

    res.status(201).json(data);
  } catch (error) {
    console.error('Failed to create setting:', error);
    res.status(500).json({ error: 'Failed to create setting' });
  }
});

router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const { data: oldSetting, error: fetchError } = await supabase
      .from('settings')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!oldSetting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    const { error: deleteError } = await supabase
      .from('settings')
      .delete()
      .eq('key', key);

    if (deleteError) throw deleteError;

    await logAudit({
      actorId: req.session.userId,
      action: 'delete',
      targetType: 'setting',
      targetId: oldSetting.id,
      details: `Deleted setting: ${key}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Failed to delete setting:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

export default router;
