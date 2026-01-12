import { Worker } from 'bullmq';
import { pool } from '../db/index.js';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

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
      `SELECT j.*, t.*, p.content as playbook_content, p.name as playbook_name,
              COALESCE(tc.encrypted_secret, ic.encrypted_secret) as encrypted_secret,
              COALESCE(tc.type, ic.type) as credential_type
       FROM jobs j
       JOIN templates t ON j.template_id = t.id
       JOIN playbooks p ON t.playbook_id = p.id
       JOIN inventories i ON t.inventory_id = i.id
       LEFT JOIN credentials tc ON t.credential_id = tc.id
       LEFT JOIN credentials ic ON i.credential_id = ic.id
       WHERE j.id = $1`,
      [jobId]
    );

    if (jobData.rows.length === 0) {
      throw new Error('Job not found');
    }

    const data = jobData.rows[0];

    // Decrypt credential if available
    let credential = null;
    if (data.encrypted_secret) {
      try {
        const decrypted = Buffer.from(data.encrypted_secret, 'base64').toString('utf-8');
        credential = JSON.parse(decrypted);
      } catch (error) {
        console.error('Failed to decrypt credential:', error);
      }
    }

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

    // Prepare SSH key if available
    let sshKeyPath = null;
    if (credential?.ssh_key_data) {
      sshKeyPath = path.join(tmpDir, 'ssh_key');
      await fs.writeFile(sshKeyPath, credential.ssh_key_data, { mode: 0o600 });
    }

    // Build inventory with credentials
    const inventoryPath = path.join(tmpDir, 'inventory.ini');
    let inventoryContent = '[all]\n';
    const hosts = [];

    for (const row of inventoryData.rows) {
      if (row.hostname) {
        hosts.push(row.hostname);
        inventoryContent += `${row.hostname}`;

        const hostVars = row.host_vars || {};
        const isWindows = hostVars.ansible_connection === 'winrm';

        // Add connection type
        if (hostVars.ansible_connection) {
          inventoryContent += ` ansible_connection=${hostVars.ansible_connection}`;
        }

        // Add username
        if (credential?.username) {
          inventoryContent += ` ansible_user=${credential.username}`;
        }

        // Windows-specific settings
        if (isWindows) {
          inventoryContent += ` ansible_port=${hostVars.ansible_port || '5986'}`;
          inventoryContent += ` ansible_winrm_transport=${hostVars.ansible_winrm_transport || 'ntlm'}`;
          inventoryContent += ` ansible_winrm_server_cert_validation=${hostVars.ansible_winrm_server_cert_validation || 'ignore'}`;

          if (credential?.password) {
            inventoryContent += ` ansible_password=${credential.password}`;
          }
        } else {
          // SSH-specific settings for Linux/Unix hosts
          if (sshKeyPath) {
            inventoryContent += ` ansible_ssh_private_key_file=${sshKeyPath}`;
          } else if (credential?.password) {
            inventoryContent += ` ansible_password=${credential.password}`;
          }

          // Add become options for Linux/Unix
          if (credential?.become_method) {
            inventoryContent += ` ansible_become_method=${credential.become_method}`;
          }
          if (credential?.become_username) {
            inventoryContent += ` ansible_become_user=${credential.become_username}`;
          }
          if (credential?.become_password) {
            inventoryContent += ` ansible_become_password=${credential.become_password}`;
          }
        }

        // Add any additional host variables
        for (const [key, value] of Object.entries(hostVars)) {
          if (!key.startsWith('ansible_connection') &&
              !key.startsWith('ansible_port') &&
              !key.startsWith('ansible_winrm')) {
            inventoryContent += ` ${key}=${value}`;
          }
        }

        inventoryContent += '\n';
      }
    }
    await fs.writeFile(inventoryPath, inventoryContent);

    // Determine if this is a Windows job
    const isWindowsJob = inventoryData.rows.some(row => {
      const hostVars = row.host_vars || {};
      return hostVars.ansible_connection === 'winrm';
    });

    // Output host list
    let initialOutput = `PLAY [${data.playbook_name}] *********************************************************\n\n`;
    initialOutput += `Target Hosts (${hosts.length}):\n`;
    for (const host of hosts) {
      initialOutput += `  - ${host}\n`;
    }

    // Show appropriate credential info based on connection type
    if (credential?.username) {
      if (isWindowsJob) {
        initialOutput += `\nCredential: ${credential.username}@winrm\n`;
        initialOutput += `Connection: WinRM\n`;
      } else {
        initialOutput += `\nCredential: ${credential.username}@ssh\n`;
        initialOutput += `SSH Key: ${sshKeyPath ? 'Yes' : 'No'}\n`;
      }
    } else {
      initialOutput += `\nCredential: None\n`;
    }

    initialOutput += `\nStarting playbook execution...\n\n`;

    await pool.query(
      'INSERT INTO job_events (job_id, level, message) VALUES ($1, $2, $3)',
      [jobId, 'info', initialOutput]
    );

    // Build ansible-playbook command with template options
    const args = ['-i', inventoryPath, playbookPath];

    // Add verbosity flags
    if (data.verbosity && data.verbosity > 0) {
      args.push('-' + 'v'.repeat(data.verbosity));
    }

    // Add forks option
    if (data.forks) {
      args.push('--forks', data.forks.toString());
    }

    // Add become option
    if (data.become) {
      args.push('--become');
    }

    // Environment variables for Ansible
    const env = {
      ...process.env,
      ANSIBLE_HOST_KEY_CHECKING: 'False',
      ANSIBLE_STDOUT_CALLBACK: 'default',
      ANSIBLE_FORCE_COLOR: 'false',
      ANSIBLE_NOCOLOR: 'true',
      ANSIBLE_WINRM_CONNECTION_TIMEOUT: '60',
      ANSIBLE_WINRM_READ_TIMEOUT: '60',
    };

    // Function to remove ANSI escape codes
    const stripAnsi = (str) => {
      return str.replace(/\x1b\[[0-9;]*m/g, '');
    };

    try {
      await new Promise((resolve, reject) => {
        const process = spawn('ansible-playbook', args, {
          cwd: tmpDir,
          env,
        });

        let stdoutBuffer = '';
        let stderrBuffer = '';
        let hasError = false;

        process.stdout.on('data', async (data) => {
          const text = stripAnsi(data.toString());
          stdoutBuffer += text;

          // Insert lines immediately for real-time live output
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              try {
                await pool.query(
                  'INSERT INTO job_events (job_id, level, message) VALUES ($1, $2, $3)',
                  [jobId, 'info', line + '\n']
                );
              } catch (err) {
                console.error('Failed to insert job event:', err);
              }
            }
          }
        });

        process.stderr.on('data', async (data) => {
          const text = stripAnsi(data.toString());
          stderrBuffer += text;

          try {
            await pool.query(
              'INSERT INTO job_events (job_id, level, message) VALUES ($1, $2, $3)',
              [jobId, 'warning', text]
            );
          } catch (err) {
            console.error('Failed to insert stderr event:', err);
          }
        });

        process.on('error', (error) => {
          hasError = true;
          reject(error);
        });

        process.on('close', async (code) => {
          if (hasError) return;

          if (code === 0) {
            await pool.query(
              `UPDATE jobs SET status = $1, finished_at = NOW(), return_code = $2,
               summary = $3 WHERE id = $4`,
              ['success', 0, JSON.stringify({ hosts: hosts.length }), jobId]
            );
            resolve();
          } else {
            await pool.query(
              `UPDATE jobs SET status = $1, finished_at = NOW(), return_code = $2 WHERE id = $3`,
              ['failed', code, jobId]
            );
            reject(new Error(`Process exited with code ${code}`));
          }
        });

        // Timeout after 5 minutes
        setTimeout(() => {
          process.kill();
          reject(new Error('Job timeout'));
        }, 300000);
      });
    } catch (error) {
      await pool.query(
        'INSERT INTO job_events (job_id, level, message) VALUES ($1, $2, $3)',
        [jobId, 'error', stripAnsi(error.message)]
      );

      await pool.query(
        `UPDATE jobs SET status = $1, finished_at = NOW(), return_code = $2 WHERE id = $3`,
        ['failed', 1, jobId]
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
