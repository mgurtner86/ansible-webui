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
- Complete audit trail
- Responsive UI with modern design

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

