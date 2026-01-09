import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const connection = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
});

console.log('🚀 Ansible Worker Service starting...');
console.log(`📡 Supabase URL: ${supabaseUrl}`);
console.log(`📦 Redis: ${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`);

const worker = new Worker(
  'ansible-jobs',
  async (job) => {
    console.log(`🔄 Processing job ${job.data.job_id}`);

    try {
      const { job_id, template_id, extra_vars, limit, tags } = job.data;

      // Update job status to running
      await supabase
        .from('jobs')
        .update({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', job_id);

      // Create job started event
      await supabase.from('job_events').insert({
        job_id,
        timestamp: new Date().toISOString(),
        level: 'info',
        event_type: 'job_started',
        message: 'Job execution started',
        raw_json: { template_id, extra_vars, limit, tags }
      });

      // Get template details
      const { data: template } = await supabase
        .from('templates')
        .select('*, playbook:playbooks(*), inventory:inventories(*)')
        .eq('id', template_id)
        .single();

      if (!template) {
        throw new Error('Template not found');
      }

      // Simulate Ansible execution (replace with real ansible-runner in production)
      await simulateAnsibleExecution(job_id, template, extra_vars, limit, tags);

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

      await supabase
        .from('jobs')
        .update({
          status: 'success',
          finished_at: new Date().toISOString(),
          return_code: 0,
          summary
        })
        .eq('id', job_id);

      // Create job completed event
      await supabase.from('job_events').insert({
        job_id,
        timestamp: new Date().toISOString(),
        level: 'info',
        event_type: 'job_completed',
        message: 'Job execution completed successfully',
        raw_json: { summary }
      });

      console.log(`✅ Job ${job_id} completed successfully`);
      return { success: true, job_id };

    } catch (error) {
      console.error(`❌ Job ${job.data.job_id} failed:`, error);

      // Update job status to failed
      await supabase
        .from('jobs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          return_code: 1
        })
        .eq('id', job.data.job_id);

      // Create job failed event
      await supabase.from('job_events').insert({
        job_id: job.data.job_id,
        timestamp: new Date().toISOString(),
        level: 'error',
        event_type: 'job_failed',
        message: error.message,
        raw_json: { error: error.message }
      });

      throw error;
    }
  },
  { connection }
);

async function simulateAnsibleExecution(jobId, template, extraVars, limit, tags) {
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

    await supabase.from('job_events').insert({
      job_id: jobId,
      timestamp: new Date().toISOString(),
      level: 'info',
      host: 'localhost',
      task,
      event_type: isChanged ? 'runner_on_ok' : 'runner_on_skipped',
      message: isChanged ? `Task completed: ${task}` : `Task skipped: ${task}`,
      raw_json: {
        changed: isChanged,
        task_number: index + 1,
        total_tasks: tasks.length
      }
    });

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
  process.exit(0);
});
