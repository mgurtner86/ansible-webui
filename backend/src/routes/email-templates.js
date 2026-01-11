import express from 'express';
import { supabase } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('id, name, subject, body, variables, description, is_active, created_at, updated_at')
      .order('name');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Failed to fetch email templates:', error);
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Failed to fetch template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, subject, body, variables, description, is_active } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ error: 'Name, subject, and body are required' });
    }

    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        name,
        subject,
        body,
        variables: variables || [],
        description,
        is_active: is_active !== false,
        created_by: req.session.userId,
        updated_by: req.session.userId
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      actorId: req.session.userId,
      action: 'create',
      targetType: 'email_template',
      targetId: data.id,
      details: `Created email template: ${name}`,
      ipAddress: req.ip
    });

    res.status(201).json(data);
  } catch (error) {
    console.error('Failed to create template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body, variables, description, is_active } = req.body;

    const updateData = {
      updated_by: req.session.userId,
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (body !== undefined) updateData.body = body;
    if (variables !== undefined) updateData.variables = variables;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('email_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await logAudit({
      actorId: req.session.userId,
      action: 'update',
      targetType: 'email_template',
      targetId: id,
      details: `Updated email template: ${name || data.name}`,
      ipAddress: req.ip
    });

    res.json(data);
  } catch (error) {
    console.error('Failed to update template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: template, error: fetchError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { error: deleteError } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    await logAudit({
      actorId: req.session.userId,
      action: 'delete',
      targetType: 'email_template',
      targetId: id,
      details: `Deleted email template: ${template.name}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Failed to delete template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
