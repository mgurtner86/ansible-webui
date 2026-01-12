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
    const nonRemovableCollections = ['ansible.builtin'];

    for (const [path, items] of Object.entries(collections)) {
      const isUserPath = path.includes('.ansible/collections') || path.includes('ansible_collections');

      for (const [name, info] of Object.entries(items)) {
        installed.push({
          name,
          version: info.version,
          path,
          removable: isUserPath && !nonRemovableCollections.includes(name)
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

    const nonRemovableCollections = ['ansible.builtin'];
    if (nonRemovableCollections.includes(collection)) {
      return res.status(400).json({
        error: 'Cannot remove built-in collection',
        message: `${collection} is a core Ansible collection and cannot be removed`
      });
    }

    const collectionPath = collection.replace(/\./g, '/');

    try {
      await execAsync(`rm -rf ~/.ansible/collections/ansible_collections/${collectionPath}`);
    } catch (rmError) {
      console.error('Failed to remove from user directory:', rmError);
    }

    const { stdout: listOutput } = await execAsync('ansible-galaxy collection list --format json');
    const remainingCollections = JSON.parse(listOutput);

    let stillExists = false;
    for (const [path, items] of Object.entries(remainingCollections)) {
      if (items[collection]) {
        stillExists = true;
        break;
      }
    }

    if (stillExists) {
      return res.status(400).json({
        error: 'Collection could not be fully removed',
        message: `${collection} may be installed system-wide and requires administrator privileges to remove`
      });
    }

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
