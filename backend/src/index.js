import { Worker } from 'bullmq';
import pg from 'pg';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ansible:ansible_password@postgres:5432/ansible_tower',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const connection = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
});

console.log('🚀 Ansible Worker Service starting...');
console.log(`📡 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Using default connection'}`);
console.log(`📦 Redis: ${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`);

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

const worker = new Worker(
  'ansible-jobs',
  async (job) => {
    console.log(`🔄 Processing job ${job.data.job_id}`);

    const client = await pool.connect();

    try {
      const { job_id, template_id, extra_vars, limit, tags } = job.data;

      await client.query('BEGIN');

      // Update job status to running
      await client.query(
        'UPDATE jobs SET status = $1, started_at = NOW() WHERE id = $2',
        ['running', job_id]
      );

      // Create job started event
      await client.query(
        `INSERT INTO job_events (job_id, timestamp, level, event_type, message, raw_json)
         VALUES ($1, NOW(), $2, $3, $4, $5)`,
        [
          job_id,
          'info',
          'job_started',
          'Job execution started',
          JSON.stringify({ template_id, extra_vars, limit, tags })
        ]
      );

      // Get template details
      const templateResult = await client.query(
        `SELECT
          t.*,
          p.name as playbook_name,
          p.file_path as playbook_path,
          i.name as inventory_name,
          i.content_or_ref as inventory_content
         FROM templates t
         JOIN playbooks p ON t.playbook_id = p.id
         JOIN inventories i ON t.inventory_id = i.id
         WHERE t.id = $1`,
        [template_id]
      );

      if (templateResult.rows.length === 0) {
        throw new Error('Template not found');
      }

      const template = templateResult.rows[0];

      // Simulate Ansible execution
      await simulateAnsibleExecution(client, job_id, template, extra_vars, limit, tags);

      // Update job status to success
      const summary = {
        ok: Math.floor(Math.random() * 10) + 5,
        changed: Math.floor(Math.random() * 5),
        unreachable: 0,
        failed: 0,
        skipped: Math.floor(Math.random() * 3),
        rescued: 0,
        ignored: 0
      };

      await client.query(
        'UPDATE jobs SET status = $1, finished_at = NOW(), return_code = $2, summary = $3 WHERE id = $4',
        ['success', 0, JSON.stringify(summary), job_id]
      );

      // Create job completed event
      await client.query(
        `INSERT INTO job_events (job_id, timestamp, level, event_type, message, raw_json)
         VALUES ($1, NOW(), $2, $3, $4, $5)`,
        [
          job_id,
          'info',
          'job_completed',
          'Job execution completed successfully',
          JSON.stringify({ summary })
        ]
      );

      await client.query('COMMIT');

      console.log(`✅ Job ${job_id} completed successfully`);
      return { success: true, job_id };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Job ${job.data.job_id} failed:`, error);

      try {
        // Update job status to failed
        await client.query(
          'UPDATE jobs SET status = $1, finished_at = NOW(), return_code = $2 WHERE id = $3',
          ['failed', 1, job.data.job_id]
        );

        // Create job failed event
        await client.query(
          `INSERT INTO job_events (job_id, timestamp, level, event_type, message, raw_json)
           VALUES ($1, NOW(), $2, $3, $4, $5)`,
          [
            job.data.job_id,
            'error',
            'job_failed',
            error.message,
            JSON.stringify({ error: error.message })
          ]
        );
      } catch (updateError) {
        console.error('Failed to update job failure status:', updateError);
      }

      throw error;
    } finally {
      client.release();
    }
  },
  { connection }
);

async function simulateAnsibleExecution(client, jobId, template, extraVars, limit, tags) {
  const tasks = [
    'Gathering Facts',
    'Install packages',
    'Configure services',
    'Deploy application',
    'Restart services',
    'Verify deployment'
  ];

  for (const [index, task] of tasks.entries()) {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const isChanged = Math.random() > 0.5;

    await client.query(
      `INSERT INTO job_events (job_id, timestamp, level, host, task, event_type, message, raw_json)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7)`,
      [
        jobId,
        'info',
        'localhost',
        task,
        isChanged ? 'runner_on_ok' : 'runner_on_skipped',
        isChanged ? `Task completed: ${task}` : `Task skipped: ${task}`,
        JSON.stringify({
          changed: isChanged,
          task_number: index + 1,
          total_tasks: tasks.length
        })
      ]
    );

    console.log(`  ⚙️  [${index + 1}/${tasks.length}] ${task} - ${isChanged ? 'changed' : 'skipped'}`);
  }
}

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} has failed with error:`, err.message);
});

worker.on('error', (err) => {
  console.error('⚠️  Worker error:', err);
});

console.log('✅ Worker is ready and listening for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, closing worker...');
  await worker.close();
  await connection.quit();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, closing worker...');
  await worker.close();
  await connection.quit();
  await pool.end();
  process.exit(0);
});
