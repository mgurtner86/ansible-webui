# API Documentation

## Base URL

```
Supabase REST API: https://<project-id>.supabase.co/rest/v1
Edge Functions: https://<project-id>.supabase.co/functions/v1
```

## Authentication

All authenticated requests require an Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Edge Functions

### Job Runner

#### Create and Execute Job

**Endpoint**: `POST /functions/v1/job-runner`

**Request Body**:
```json
{
  "template_id": "550e8400-e29b-41d4-a716-446655440000",
  "extra_vars": {
    "environment": "production",
    "version": "1.2.3"
  },
  "limit": "webservers",
  "tags": ["deploy", "restart"]
}
```

**Response** (Success):
```json
{
  "success": true,
  "job_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Response** (Error):
```json
{
  "error": "Template not found"
}
```

#### Get Job Details

**Endpoint**: `GET /functions/v1/job-runner?job_id=<uuid>`

**Response**:
```json
{
  "job": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "template_id": "550e8400-e29b-41d4-a716-446655440000",
    "triggered_by": "440e8400-e29b-41d4-a716-446655440000",
    "status": "running",
    "created_at": "2024-01-15T10:30:00Z",
    "started_at": "2024-01-15T10:30:05Z",
    "finished_at": null,
    "return_code": null,
    "summary": {},
    "job_events": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "job_id": "660e8400-e29b-41d4-a716-446655440001",
        "timestamp": "2024-01-15T10:30:05Z",
        "level": "info",
        "event_type": "job_started",
        "message": "Job execution started",
        "raw_json": {}
      }
    ]
  }
}
```

### Project Sync

#### Sync Git Project

**Endpoint**: `POST /functions/v1/project-sync`

**Request Body**:
```json
{
  "project_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Sync started"
}
```

## Database REST API

### Projects

#### List Projects

**Endpoint**: `GET /rest/v1/projects`

**Query Parameters**:
- `select`: Columns to return (default: `*`)
- `order`: Sort order (e.g., `created_at.desc`)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset

**Example**:
```
GET /rest/v1/projects?select=*&order=created_at.desc&limit=20
```

**Response**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Web Server Automation",
    "git_url": "https://github.com/example/ansible-web.git",
    "git_branch": "main",
    "sync_status": "success",
    "last_sync_at": "2024-01-15T09:00:00Z",
    "owner_id": "440e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-10T14:30:00Z"
  }
]
```

#### Create Project

**Endpoint**: `POST /rest/v1/projects`

**Request Body**:
```json
{
  "name": "Database Automation",
  "git_url": "https://github.com/example/ansible-db.git",
  "git_branch": "main",
  "owner_id": "440e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Database Automation",
  "git_url": "https://github.com/example/ansible-db.git",
  "git_branch": "main",
  "sync_status": "pending",
  "last_sync_at": null,
  "owner_id": "440e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Update Project

**Endpoint**: `PATCH /rest/v1/projects?id=eq.<uuid>`

**Request Body**:
```json
{
  "git_branch": "develop",
  "sync_status": "pending"
}
```

#### Delete Project

**Endpoint**: `DELETE /rest/v1/projects?id=eq.<uuid>`

### Inventories

#### List Inventories

**Endpoint**: `GET /rest/v1/inventories?select=*&order=created_at.desc`

**Response**:
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Production Servers",
    "source": "static",
    "content_or_ref": "[webservers]\nweb1.example.com\nweb2.example.com",
    "variables": {
      "ansible_user": "deploy",
      "ansible_python_interpreter": "/usr/bin/python3"
    },
    "owner_id": "440e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-10T10:00:00Z",
    "updated_at": "2024-01-15T09:30:00Z"
  }
]
```

#### Create Inventory

**Endpoint**: `POST /rest/v1/inventories`

**Request Body**:
```json
{
  "name": "Staging Environment",
  "source": "static",
  "content_or_ref": "[all]\nstaging1.example.com",
  "variables": {
    "environment": "staging"
  },
  "owner_id": "440e8400-e29b-41d4-a716-446655440000"
}
```

### Hosts

#### List Hosts in Inventory

**Endpoint**: `GET /rest/v1/hosts?inventory_id=eq.<uuid>`

**Response**:
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "inventory_id": "660e8400-e29b-41d4-a716-446655440000",
    "hostname": "web1.example.com",
    "vars": {
      "ansible_host": "192.168.1.10",
      "http_port": 80
    },
    "groups": ["webservers", "production"]
  }
]
```

#### Add Host

**Endpoint**: `POST /rest/v1/hosts`

**Request Body**:
```json
{
  "inventory_id": "660e8400-e29b-41d4-a716-446655440000",
  "hostname": "web3.example.com",
  "vars": {
    "ansible_host": "192.168.1.12"
  },
  "groups": ["webservers"]
}
```

### Credentials

#### List Credentials

**Endpoint**: `GET /rest/v1/credentials?select=id,type,name,scope,created_at`

**Note**: Never request `encrypted_secret` field directly

**Response**:
```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "type": "ssh",
    "name": "Production SSH Key",
    "scope": "global",
    "created_at": "2024-01-10T08:00:00Z"
  }
]
```

#### Create Credential

**Endpoint**: `POST /rest/v1/credentials`

**Request Body**:
```json
{
  "type": "ssh",
  "name": "Staging SSH Key",
  "encrypted_secret": "<base64_encoded_key>",
  "owner_id": "440e8400-e29b-41d4-a716-446655440000",
  "scope": "user"
}
```

### Templates

#### List Templates

**Endpoint**: `GET /rest/v1/templates?select=*&order=created_at.desc`

**Response**:
```json
[
  {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "name": "Deploy Web Application",
    "playbook_id": "aa0e8400-e29b-41d4-a716-446655440000",
    "inventory_id": "660e8400-e29b-41d4-a716-446655440000",
    "extra_vars_schema": {
      "type": "object",
      "properties": {
        "version": { "type": "string" },
        "environment": { "type": "string", "enum": ["dev", "staging", "prod"] }
      },
      "required": ["version"]
    },
    "limits": "webservers",
    "tags": ["deploy"],
    "forks": 5,
    "timeout": 3600,
    "become": true,
    "verbosity": 0,
    "owner_id": "440e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-12T14:00:00Z"
  }
]
```

#### Create Template

**Endpoint**: `POST /rest/v1/templates`

**Request Body**:
```json
{
  "name": "Backup Database",
  "playbook_id": "aa0e8400-e29b-41d4-a716-446655440000",
  "inventory_id": "660e8400-e29b-41d4-a716-446655440000",
  "extra_vars_schema": {
    "type": "object",
    "properties": {
      "backup_path": { "type": "string" }
    }
  },
  "forks": 1,
  "timeout": 7200,
  "become": true,
  "owner_id": "440e8400-e29b-41d4-a716-446655440000"
}
```

### Jobs

#### List Jobs

**Endpoint**: `GET /rest/v1/jobs?select=*&order=created_at.desc&limit=50`

**Query Filters**:
- `status=eq.running` - Only running jobs
- `triggered_by=eq.<user_id>` - User's jobs
- `created_at=gte.2024-01-15` - Jobs after date

**Response**:
```json
[
  {
    "id": "bb0e8400-e29b-41d4-a716-446655440000",
    "template_id": "990e8400-e29b-41d4-a716-446655440000",
    "triggered_by": "440e8400-e29b-41d4-a716-446655440000",
    "status": "success",
    "created_at": "2024-01-15T10:00:00Z",
    "started_at": "2024-01-15T10:00:05Z",
    "finished_at": "2024-01-15T10:05:30Z",
    "return_code": 0,
    "summary": {
      "ok": 10,
      "changed": 3,
      "unreachable": 0,
      "failed": 0,
      "skipped": 1,
      "rescued": 0,
      "ignored": 0
    }
  }
]
```

#### Get Job Events

**Endpoint**: `GET /rest/v1/job_events?job_id=eq.<uuid>&order=timestamp.asc`

**Response**:
```json
[
  {
    "id": "cc0e8400-e29b-41d4-a716-446655440000",
    "job_id": "bb0e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2024-01-15T10:00:05Z",
    "level": "info",
    "host": "web1.example.com",
    "task": "Install nginx",
    "event_type": "runner_on_ok",
    "message": "Package installed successfully",
    "raw_json": {
      "changed": true,
      "action": "apt",
      "invocation": {}
    }
  }
]
```

### Schedules

#### List Schedules

**Endpoint**: `GET /rest/v1/schedules?select=*&order=created_at.desc`

**Response**:
```json
[
  {
    "id": "dd0e8400-e29b-41d4-a716-446655440000",
    "template_id": "990e8400-e29b-41d4-a716-446655440000",
    "cron": "0 2 * * *",
    "timezone": "UTC",
    "enabled": true,
    "created_by": "440e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-10T12:00:00Z"
  }
]
```

#### Create Schedule

**Endpoint**: `POST /rest/v1/schedules`

**Request Body**:
```json
{
  "template_id": "990e8400-e29b-41d4-a716-446655440000",
  "cron": "0 */6 * * *",
  "timezone": "America/New_York",
  "enabled": true,
  "created_by": "440e8400-e29b-41d4-a716-446655440000"
}
```

### Audit Logs

#### List Audit Logs

**Endpoint**: `GET /rest/v1/audit_logs?select=*&order=timestamp.desc&limit=100`

**Query Filters**:
- `action=like.*create*` - Filter by action type
- `target_type=eq.job` - Filter by target type
- `actor_id=eq.<user_id>` - Filter by user

**Response**:
```json
[
  {
    "id": "ee0e8400-e29b-41d4-a716-446655440000",
    "actor_id": "440e8400-e29b-41d4-a716-446655440000",
    "action": "job.create",
    "target_type": "job",
    "target_id": "bb0e8400-e29b-41d4-a716-446655440000",
    "before": {},
    "after": {
      "template_id": "990e8400-e29b-41d4-a716-446655440000",
      "status": "queued"
    },
    "timestamp": "2024-01-15T10:00:00Z",
    "ip_address": "192.168.1.100"
  }
]
```

## Error Responses

All endpoints return standard HTTP status codes:

### 400 Bad Request
```json
{
  "error": "Invalid request parameters",
  "details": "template_id is required"
}
```

### 401 Unauthorized
```json
{
  "error": "No authorization header"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

## Rate Limiting

Edge Functions:
- 100 requests per minute per user
- 1000 requests per hour per user

Database API:
- Configured via Supabase project settings
- Default: No limit for authenticated users

## Pagination

Use `limit` and `offset` query parameters:

```
GET /rest/v1/jobs?limit=20&offset=40
```

Or use range headers:

```
Range: 0-19  # First 20 items
Range: 20-39 # Next 20 items
```

## Real-time Subscriptions

Subscribe to table changes via Supabase Realtime:

```typescript
const subscription = supabase
  .channel('jobs-channel')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'jobs' },
    (payload) => console.log(payload)
  )
  .subscribe();
```

Events:
- `INSERT`: New record created
- `UPDATE`: Record updated
- `DELETE`: Record deleted

## Webhook Integration (Future)

Future support for webhooks to external systems:

```
POST /functions/v1/webhooks/job-complete
{
  "url": "https://example.com/notify",
  "events": ["job.complete", "job.failed"],
  "secret": "<webhook_secret>"
}
```
