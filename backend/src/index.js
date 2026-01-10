import express from 'express';
import cors from 'cors';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import dotenv from 'dotenv';
import { pool } from './db/index.js';
import { startJobWorker } from './queue/job-processor.js';

import authRoutes from './routes/auth.js';
import projectsRoutes from './routes/projects.js';
import playbooksRoutes from './routes/playbooks.js';
import inventoriesRoutes from './routes/inventories.js';
import templatesRoutes from './routes/templates.js';
import jobsRoutes from './routes/jobs.js';
import credentialsRoutes from './routes/credentials.js';
import schedulesRoutes from './routes/schedules.js';
import hostsRoutes from './routes/hosts.js';

dotenv.config();

const app = express();
const PgSession = pgSession(session);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'ansible-tower-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.use('/api/auth', authRoutes);
app.use('/api/projects', requireAuth, projectsRoutes);
app.use('/api/playbooks', requireAuth, playbooksRoutes);
app.use('/api/inventories', requireAuth, inventoriesRoutes);
app.use('/api/templates', requireAuth, templatesRoutes);
app.use('/api/jobs', requireAuth, jobsRoutes);
app.use('/api/credentials', requireAuth, credentialsRoutes);
app.use('/api/schedules', requireAuth, schedulesRoutes);
app.use('/api/hosts', requireAuth, hostsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const [projects, inventories, templates, jobs] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM projects'),
      pool.query('SELECT COUNT(*) as count FROM inventories'),
      pool.query('SELECT COUNT(*) as count FROM templates'),
      pool.query('SELECT COUNT(*) as count FROM jobs'),
    ]);

    const [recentJobs, jobsByStatus] = await Promise.all([
      pool.query(`
        SELECT j.*, t.name as template_name
        FROM jobs j
        LEFT JOIN templates t ON j.template_id = t.id
        ORDER BY j.created_at DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT status, COUNT(*) as count
        FROM jobs
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY status
      `),
    ]);

    res.json({
      totals: {
        projects: parseInt(projects.rows[0].count),
        inventories: parseInt(inventories.rows[0].count),
        templates: parseInt(templates.rows[0].count),
        jobs: parseInt(jobs.rows[0].count),
      },
      recentJobs: recentJobs.rows,
      jobsByStatus: jobsByStatus.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.API_PORT || 3001;

async function startServer() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    startJobWorker();

    app.listen(PORT, () => {
      console.log(`🚀 Ansible Tower API Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Session secret configured: ${!!process.env.SESSION_SECRET}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
