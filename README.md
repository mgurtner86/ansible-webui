# Ansible Task Management System

A comprehensive web application for managing and executing Ansible automations with job history, live status monitoring, and audit logging.

## Overview

This is a full-featured Ansible automation management platform built with:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL) + Edge Functions
- **Authentication**: Supabase Auth with role-based access control
- **Realtime**: Supabase Realtime for live job monitoring
- **Architecture**: MVC (Model-View-Controller) pattern

## Features

- Multi-user support with role-based permissions (Admin, Manager, Operator, Viewer)
- Git-based project management for Ansible playbooks
- Dynamic inventory management (static, git, dynamic sources)
- Secure credential storage (SSH keys, Vault passwords, API tokens)
- Job templates with configurable parameters
- Job execution with live monitoring and event streaming
- Cron-based scheduling
- Complete audit trail with Row Level Security (RLS)
- Responsive UI with modern design
- Production-ready security with optimized database policies

## Project Structure

```
project/
├── src/
│   ├── lib/
│   │   └── supabase.ts          # Supabase client configuration
│   ├── contexts/
│   │   └── AuthContext.tsx       # Authentication context & user management
│   ├── components/
│   │   ├── Layout.tsx            # Main application layout with sidebar
│   │   └── ProtectedRoute.tsx    # Route protection component
│   ├── pages/
│   │   ├── Login.tsx             # Login & signup page
│   │   ├── Dashboard.tsx         # Main dashboard with stats
│   │   ├── Projects.tsx          # Git project management
│   │   ├── Inventories.tsx       # Inventory management
│   │   ├── Credentials.tsx       # Secure credential storage
│   │   ├── Templates.tsx         # Job template management
│   │   ├── Jobs.tsx              # Job execution & monitoring
│   │   ├── Schedules.tsx         # Cron schedule management
│   │   └── Audit.tsx             # Audit log viewer
│   ├── App.tsx                   # Main app with routing
│   └── main.tsx                  # Application entry point
├── supabase/
│   └── functions/
│       ├── job-runner/           # Job execution edge function
│       └── project-sync/         # Project sync edge function
└── .env                          # Environment variables
```

## Security

This application implements comprehensive security measures:

- **Row Level Security (RLS)**: All database tables have optimized RLS policies
- **Role-Based Access Control**: 4 roles with granular permissions
- **Audit Logging**: Complete trail of all user actions
- **Secure Credentials**: Encrypted storage for sensitive data
- **Optimized Queries**: All policies use subqueries for better performance

**Production Deployment**: See [SECURITY_CONFIG.md](./SECURITY_CONFIG.md) for required dashboard configurations including:
- Leaked password protection
- Database connection strategy
- Production hardening checklist

## Documentation

- **[API.md](./API.md)** - REST API reference and examples
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design decisions
- **[SECURITY_CONFIG.md](./SECURITY_CONFIG.md)** - Security configuration and best practices

## Getting Started

1. Clone the repository
2. Configure Supabase connection in `.env`
3. Run migrations from `supabase/migrations/`
4. Install dependencies: `npm install`
5. Start development server: `npm run dev`

## License

MIT License - See LICENSE file for details

