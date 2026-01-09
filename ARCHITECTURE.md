# Architecture Documentation

## MVC Architecture

This application follows the Model-View-Controller (MVC) architectural pattern:

### Model (Database Layer)

All data models are implemented as PostgreSQL tables in Supabase:

#### User Management
- **users**: User accounts with roles and MFA settings
- **role_permissions**: Permission definitions for each role

#### Ansible Resources
- **projects**: Git repositories containing playbooks
- **playbooks**: Individual playbook files discovered from projects
- **inventories**: Ansible inventory configurations
- **hosts**: Individual hosts in inventories
- **groups**: Host groups with variables
- **credentials**: Encrypted secrets (SSH keys, Vault passwords, API tokens)

#### Job Management
- **templates**: Reusable job configurations
- **jobs**: Job execution records
- **job_events**: Detailed execution events and logs
- **schedules**: Cron-based job schedules

#### Auditing
- **audit_logs**: Complete audit trail of all actions

### View (Frontend Layer)

React components organized by responsibility:

#### Pages (Main Views)
- **Dashboard**: Job statistics, recent runs, success rates
- **Projects**: Git repository management, sync status
- **Inventories**: Host and group management
- **Credentials**: Secure secret management
- **Templates**: Job template configuration
- **Jobs**: Job execution and monitoring
- **Schedules**: Cron schedule management
- **Audit**: Audit log viewing and filtering
- **Login**: Authentication interface

#### Components (Reusable UI)
- **Layout**: Application shell with navigation
- **ProtectedRoute**: Authentication guard for routes

#### Contexts (State Management)
- **AuthContext**: User authentication and permission checking

### Controller (API Layer)

Implemented as Supabase Edge Functions:

#### job-runner
Handles job execution workflow:
- Creates job records
- Simulates Ansible execution (mock implementation)
- Updates job status and events
- Streams real-time updates

#### project-sync
Manages Git project synchronization:
- Fetches playbooks from repositories
- Updates project sync status
- Discovers and catalogs playbooks

## Database Schema

### Entity Relationship Diagram

```
users (1) ─────── (*) projects
              │
              └─── (*) inventories
              │
              └─── (*) credentials
              │
              └─── (*) templates
              │
              └─── (*) jobs

projects (1) ──── (*) playbooks

inventories (1) ─ (*) hosts
              │
              └─ (*) groups

templates (1) ─── (*) jobs
              │
              └─ (*) schedules

jobs (1) ────────(*) job_events
```

### Role-Based Access Control (RBAC)

#### Roles

1. **Admin**: Full system access, user management
2. **Manager**: Can create and manage all resources
3. **Operator**: Can execute templates and view resources
4. **Viewer**: Read-only access

#### Permission Matrix

| Resource      | Admin | Manager | Operator | Viewer |
|---------------|-------|---------|----------|--------|
| Users         | CRUD  | -       | -        | -      |
| Projects      | CRUD  | CRUD    | Read     | Read   |
| Inventories   | CRUD  | CRUD    | Read     | Read   |
| Credentials   | CRUD  | CRUD    | Read     | Read   |
| Templates     | CRUD  | CRUD    | Execute  | Read   |
| Jobs          | CRUD  | CRUD    | Create   | Read   |
| Schedules     | CRUD  | CRUD    | -        | Read   |
| Audit Logs    | Read  | Read    | -        | -      |

### Row Level Security (RLS)

All tables have RLS enabled with policies that enforce:
- Users can only access their own resources
- Admins can access all resources
- Credentials are never returned in plain text
- Audit logs are append-only for non-admins

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new user account
- `POST /auth/signin` - Sign in with email/password
- `POST /auth/signout` - Sign out
- `GET /auth/user` - Get current user profile

### Job Execution
- `POST /functions/v1/job-runner` - Create and queue a job
  ```json
  {
    "template_id": "uuid",
    "extra_vars": {},
    "limit": "webservers",
    "tags": ["deploy"]
  }
  ```

- `GET /functions/v1/job-runner?job_id=uuid` - Get job details and events

### Project Sync
- `POST /functions/v1/project-sync` - Sync project from Git
  ```json
  {
    "project_id": "uuid"
  }
  ```

### Direct Database Access
All other operations use Supabase's auto-generated REST API:
- `GET /rest/v1/projects` - List projects
- `POST /rest/v1/projects` - Create project
- `PATCH /rest/v1/projects?id=eq.uuid` - Update project
- `DELETE /rest/v1/projects?id=eq.uuid` - Delete project

## Security Features

### Credential Encryption
- All secrets are encrypted before storage using base64 (demo implementation)
- Production should use proper KMS or envelope encryption
- Secrets are never logged or displayed in plain text

### Authentication
- JWT-based authentication via Supabase Auth
- Session persistence in browser
- Automatic token refresh

### Authorization
- Role-based access control at database level
- Permission checks in UI
- API-level enforcement via RLS policies

### Audit Trail
- All mutations logged with:
  - Actor ID
  - Action type
  - Target resource
  - Before/after states
  - Timestamp
  - IP address

## Job Execution Flow

```
1. User clicks "Run Template"
   ↓
2. UI calls POST /functions/v1/job-runner
   ↓
3. Edge function creates job record (status: queued)
   ↓
4. Function simulates async execution:
   - Updates status to "running"
   - Creates job_events with progress
   - Simulates playbook execution
   - Updates final status (success/failed)
   ↓
5. UI subscribes to realtime changes on jobs table
   ↓
6. User sees live status updates
```

### Real Implementation Notes

For production Ansible integration:

1. **Queue System**: Use Redis/BullMQ for job queue
2. **Worker Service**: Separate service that:
   - Polls queue for jobs
   - Runs ansible-runner in isolated environment
   - Streams events back to database
3. **Artifact Storage**: Store playbook outputs, logs
4. **Timeouts**: Implement job timeout handling
5. **Concurrency**: Limit parallel job execution

## Event Streaming

Jobs support real-time event streaming:

```typescript
// Subscribe to job updates
const subscription = supabase
  .channel('jobs')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'jobs' },
    (payload) => {
      // Handle job status changes
    }
  )
  .subscribe();
```

## Deployment

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase URL and anon key

# Run development server
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

## Testing Strategy

### Unit Tests
- Context providers (AuthContext)
- Utility functions
- Component logic

### Integration Tests
- API endpoints with mocked Ansible runner
- Database operations with test data
- Authentication flows

### End-to-End Tests
- Complete user workflows
- Job execution from template to completion
- Multi-user scenarios

## Performance Considerations

- Pagination for all list views (50 items default)
- Database indexes on foreign keys and status fields
- Debounced search and filters
- Lazy loading for detailed views
- Connection pooling for database
- Edge function cold start optimization

## Monitoring & Observability

Recommended metrics to track:

- **Application**: Request latency, error rates
- **Jobs**: Queue depth, execution time, success rate
- **Database**: Query performance, connection pool
- **Authentication**: Login success rate, session duration

## Future Enhancements

1. **Real Ansible Integration**: Replace mock with ansible-runner
2. **Inventory Plugins**: Support for dynamic inventory sources (AWS, Azure, etc.)
3. **Approval Workflows**: Multi-stage approval for sensitive operations
4. **Notifications**: Email/Slack notifications for job completion
5. **RBAC Expansion**: Team-based permissions, custom roles
6. **Job Artifacts**: Store and display playbook outputs
7. **Metrics Dashboard**: Prometheus/Grafana integration
8. **Multi-tenancy**: Organization isolation
9. **API Keys**: Service account authentication
10. **Webhook Triggers**: External system integration
