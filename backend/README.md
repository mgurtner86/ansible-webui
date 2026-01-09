# Ansible Tower Backend Worker

Job-Worker-Service für die Ausführung von Ansible-Playbooks.

## Übersicht

Dieser Service:
- Verarbeitet Jobs aus einer Redis-Queue (BullMQ)
- Führt Ansible-Playbooks aus (aktuell simuliert, kann mit echtem ansible-runner erweitert werden)
- Aktualisiert Job-Status und Events in Supabase
- Ermöglicht Echtzeit-Monitoring von Job-Ausführungen

## Architektur

```
Redis Queue ──▶ BullMQ Worker ──▶ Ansible Runner ──▶ Supabase
                     │                                    │
                     │                                    │
                     └────── Job Events ─────────────────┘
```

## Technologie-Stack

- **Node.js 20**: Runtime
- **BullMQ**: Job Queue Management
- **IORedis**: Redis Client
- **Supabase JS**: Datenbank-Client
- **Ansible Core**: (Optional) Für echte Ansible-Integration

## Installation

### Lokal (Entwicklung)

```bash
cd backend
npm install
```

### Environment-Variablen

Erstellen Sie eine `.env` Datei:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Starten

```bash
# Entwicklung mit Auto-Reload
npm run dev

# Produktion
npm start
```

## Job-Flow

1. **Job wird in Queue eingereiht**
   - Frontend oder Edge Function erstellt Job in Supabase
   - Job-ID wird in Redis-Queue gelegt

2. **Worker nimmt Job auf**
   - BullMQ Worker pollt Redis-Queue
   - Job-Daten werden geladen

3. **Job wird verarbeitet**
   - Status: `queued` → `running`
   - Template-Daten aus Supabase laden
   - Ansible-Playbook ausführen (simuliert oder echt)
   - Events in Echtzeit schreiben

4. **Job abgeschlossen**
   - Status: `running` → `success`/`failed`
   - Summary mit Statistiken erstellen
   - Abschluss-Event schreiben

## Job-Daten-Struktur

### Input (Redis Queue)

```javascript
{
  job_id: "uuid",
  template_id: "uuid",
  extra_vars: {
    environment: "production",
    version: "1.2.3"
  },
  limit: "webservers",
  tags: ["deploy"]
}
```

### Events (Supabase)

```javascript
{
  job_id: "uuid",
  timestamp: "2024-01-15T10:30:00Z",
  level: "info",
  host: "web1.example.com",
  task: "Install nginx",
  event_type: "runner_on_ok",
  message: "Task completed successfully",
  raw_json: {
    changed: true,
    task_number: 3,
    total_tasks: 6
  }
}
```

## Ansible-Integration

### Aktuell (Simulation)

Die aktuelle Implementation simuliert Ansible-Ausführungen:
- Zufällige Task-Dauer (1-3 Sekunden)
- Zufällige Änderungen (changed/skipped)
- Vordefinierte Task-Liste

### Echte Ansible-Integration

Für echte Ansible-Ausführung mit `ansible-runner`:

```javascript
import ansibleRunner from 'ansible-runner';

async function runAnsiblePlaybook(jobId, playbook, inventory, extraVars) {
  const runner = ansibleRunner.run({
    playbook: playbook.content,
    inventory: inventory.content_or_ref,
    extravars: extraVars,
    json_mode: true,
    event_handler: async (event) => {
      // Event in Supabase schreiben
      await supabase.from('job_events').insert({
        job_id: jobId,
        timestamp: event.created,
        event_type: event.event,
        message: event.stdout,
        raw_json: event
      });
    }
  });

  return runner.status;
}
```

### Ansible-Runner Installation

```bash
pip install ansible-runner

# Im Dockerfile (bereits enthalten):
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --no-cache-dir ansible-core ansible-runner
```

## Monitoring

### Logs

```bash
# Docker
docker logs -f ansible-tower-backend

# Lokal
npm start
```

### Redis Queue Status

```bash
# Jobs in Queue
redis-cli LLEN bull:ansible-jobs:wait

# Aktive Jobs
redis-cli LLEN bull:ansible-jobs:active

# Fehlerhafte Jobs
redis-cli LLEN bull:ansible-jobs:failed
```

### Metriken

Worker emittiert folgende Events:

```javascript
worker.on('completed', (job) => {
  // Job erfolgreich abgeschlossen
});

worker.on('failed', (job, err) => {
  // Job fehlgeschlagen
});

worker.on('error', (err) => {
  // Worker-Fehler
});
```

## Fehlerbehandlung

### Job-Fehler

Bei Fehlern während der Job-Ausführung:
1. Job-Status wird auf `failed` gesetzt
2. Error-Event wird geschrieben
3. Return-Code wird auf 1 gesetzt
4. Job wird nicht erneut versucht (kein Retry)

### Worker-Fehler

Bei kritischen Worker-Fehlern:
- Worker stoppt und Container wird neu gestartet (restart: unless-stopped)
- Jobs in Queue bleiben erhalten (Redis persistence)
- Neue Worker-Instanz verarbeitet Jobs weiter

## Performance

### Concurrency

Anzahl parallel verarbeiteter Jobs:

```javascript
const worker = new Worker(
  'ansible-jobs',
  processJob,
  {
    connection,
    concurrency: 5  // 5 parallele Jobs
  }
);
```

### Timeouts

Job-Timeouts konfigurieren:

```javascript
const worker = new Worker(
  'ansible-jobs',
  processJob,
  {
    connection,
    lockDuration: 3600000  // 1 Stunde
  }
);
```

## Skalierung

### Horizontale Skalierung

Mehrere Worker-Instanzen starten:

```bash
docker-compose up -d --scale backend=3
```

Alle Worker teilen sich die gleiche Redis-Queue und verarbeiten Jobs parallel.

### Vertikale Skalierung

Resource-Limits erhöhen:

```yaml
# docker-compose.yml
backend:
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 1G
```

## Sicherheit

### Credentials

- Service-Role-Key verwenden für Supabase (nicht Anon-Key)
- Secrets als Docker Secrets oder Environment-Variablen
- Niemals Credentials in Logs ausgeben

### Isolation

- Jobs in isolierten Containern ausführen (Docker-in-Docker)
- Network Policies für Service-Kommunikation
- Resource Limits pro Job

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Redis und Supabase müssen laufen
REDIS_HOST=localhost npm test:integration
```

### Job manuell einreihen

```javascript
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis();
const queue = new Queue('ansible-jobs', { connection });

await queue.add('test-job', {
  job_id: 'test-uuid',
  template_id: 'template-uuid',
  extra_vars: {},
  limit: null,
  tags: []
});
```

## Entwicklung

### Code-Struktur

```
backend/
├── src/
│   ├── index.js           # Worker-Einstiegspunkt
│   ├── ansible.js         # Ansible-Ausführungslogik (zukünftig)
│   └── supabase.js        # Supabase-Client (zukünftig)
├── package.json
├── Dockerfile
└── README.md
```

### Hot Reload

```bash
npm run dev  # Node.js --watch flag
```

### Debugging

```bash
# Mit Node Debugger
node --inspect src/index.js

# Chrome DevTools: chrome://inspect
```

## Roadmap

- [ ] Echte Ansible-Runner Integration
- [ ] Job-Artifacts (Logs, Outputs)
- [ ] Job-Retry Logik
- [ ] Priority Queues
- [ ] Job-Timeouts
- [ ] Prometheus Metrics
- [ ] Health Check Endpoint
- [ ] Graceful Shutdown Verbessern
