# Ansible Task Management System

A comprehensive web application for managing and executing Ansible automations with job history, live status monitoring, and audit logging.

## Overview

This is a full-featured Ansible automation management platform built with:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL
- **Authentication**: Session-based auth with role-based access control
- **Job Queue**: BullMQ with Redis
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

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)

### Starting the Application

1. Build and start all services:
```bash
docker compose down
docker compose up -d --build
```

2. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Default Login Credentials

```
Email: admin@ansible-tower.local
Password: admin123
```

### Stopping the Application

```bash
docker compose down
```

## Project Structure

```
project/
├── src/                          # Frontend source
│   ├── lib/
│   │   └── api.ts                # API client
│   ├── contexts/
│   │   └── AuthContext.tsx       # Authentication context
│   ├── components/
│   │   ├── Layout.tsx            # Main layout with sidebar
│   │   └── ProtectedRoute.tsx    # Route protection
│   └── pages/                    # Page components
├── backend/                      # Backend API
│   └── src/
│       ├── api.js                # Express API server
│       ├── index.js              # Main entry point
│       └── seed.js               # Database seeding
├── database/                     # Database initialization
│   └── init/
│       ├── 01_schema.sql         # Database schema
│       └── 02_seed_data.sql      # Initial data
└── docker-compose.yml            # Docker services

