import { Worker } from 'bullmq';
import { pool } from '../db/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

async function processJob(job) {
  const jobId = job.data.jobId;

  try {
    await pool.query(
      'UPDATE jobs SET status = $1, started_at = NOW() WHERE id = $2',
      ['running', jobId]
    );

    const jobData = await pool.query(
      `SELECT j.*, t.*, p.content as playbook_content, p.name as playbook_name
       FROM jobs j
       JOIN templates t ON j.template_id = t.id
       JOIN playbooks p ON t.playbook_id = p.id
       WHERE j.id = $1`,
      [jobId]
    );

    if (jobData.rows.length === 0) {
      throw new Error('Job not found');
    }

    const data = jobData.rows[0];

    const inventoryData = await pool.query(
      `SELECT i.*, h.hostname, h.vars as host_vars
       FROM inventories i
       LEFT JOIN hosts h ON h.inventory_id = i.id
       WHERE i.id = $1`,
      [data.inventory_id]
    );

    const tmpDir = `/tmp/ansible-job-${jobId}`;
    await fs.mkdir(tmpDir, { recursive: true });

    const playbookPath = path.join(tmpDir, 'playbook.yml');
    await fs.writeFile(playbookPath, data.playbook_content || '---\n- hosts: all\n  tasks:\n    - debug: msg="Hello World"');

    const inventoryPath = path.join(tmpDir, 'inventory.ini');
    let inventoryContent = '[all]\n';
    for (const row of inventoryData.rows.slice(1)) {
      if (row.hostname) {
        inventoryContent += `${row.hostname}\n`;
      }
    }
    await fs.writeFile(inventoryPath, inventoryContent);

    await pool.query(
      'INSERT INTO job_events (job_id, level, message) VALUES ($1, $2, $3)',
      [jobId, 'info', 'Starting playbook execution']
    );

    const command = `ansible-playbook -i ${inventoryPath} ${playbookPath} --check`;

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: tmpDir,
        timeout: 300000,
      });

      await pool.query(
        'INSERT INTO job_events (job_id, level, message) VALUES ($1, $2, $3)',
        [jobId, 'info', stdout]
      );

      if (stderr) {
        await pool.query(
          'INSERT INTO job_events (job_id, level, message) VALUES ($1, $2, $3)',
          [jobId, 'warning', stderr]
        );
      }

      await pool.query(
        `UPDATE jobs SET status = $1, finished_at = NOW(), return_code = $2,
         summary = $3 WHERE id = $4`,
        ['success', 0, JSON.stringify({ hosts: inventoryData.rows.length - 1 }), jobId]
      );
    } catch (error) {
      await pool.query(
        'INSERT INTO job_events (job_id, level, message) VALUES ($1, $2, $3)',
        [jobId, 'error', error.message]
      );

      await pool.query(
        `UPDATE jobs SET status = $1, finished_at = NOW(), return_code = $2 WHERE id = $3`,
        ['failed', error.code || 1, jobId]
      );
    }

    await fs.rm(tmpDir, { recursive: true, force: true });

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);

    await pool.query(
      `UPDATE jobs SET status = $1, finished_at = NOW() WHERE id = $2`,
      ['failed', jobId]
    );
  }
}

export function startJobWorker() {
  const worker = new Worker('ansible-jobs', processJob, { connection });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  console.log('✅ Job worker started');

  return worker;
}
