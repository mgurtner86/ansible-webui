import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { pool } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

const execAsync = promisify(exec);
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { stdout } = await execAsync('ansible-galaxy collection list --format json');
    const collections = JSON.parse(stdout);

    const installed = [];
    for (const [path, items] of Object.entries(collections)) {
      for (const [name, info] of Object.entries(items)) {
        installed.push({
          name,
          version: info.version,
          path
        });
      }
    }

    res.json(installed);
  } catch (error) {
    console.error('Failed to list collections:', error);
    res.json([]);
  }
});

router.post('/install', async (req, res) => {
  try {
    const { collection } = req.body;

    if (!collection) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const { stdout, stderr } = await execAsync(`ansible-galaxy collection install ${collection}`);

    await logAudit({
      actorId: req.session.userId,
      action: 'install',
      targetType: 'ansible_collection',
      targetId: collection,
      details: `Installed Ansible collection: ${collection}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Collection ${collection} installed successfully`,
      output: stdout,
      error: stderr
    });
  } catch (error) {
    console.error('Failed to install collection:', error);
    res.status(500).json({
      error: 'Failed to install collection',
      message: error.message,
      stderr: error.stderr
    });
  }
});

router.delete('/:collection', async (req, res) => {
  try {
    const { collection } = req.params;

    const collectionPath = collection.replace('.', '/');
    const { stdout, stderr } = await execAsync(`rm -rf ~/.ansible/collections/ansible_collections/${collectionPath}`);

    await logAudit({
      actorId: req.session.userId,
      action: 'delete',
      targetType: 'ansible_collection',
      targetId: collection,
      details: `Removed Ansible collection: ${collection}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Collection ${collection} removed successfully`
    });
  } catch (error) {
    console.error('Failed to remove collection:', error);
    res.status(500).json({
      error: 'Failed to remove collection',
      message: error.message
    });
  }
});

export default router;
