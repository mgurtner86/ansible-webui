# Docker Deployment Guide

## Architektur

Das System besteht aus vier Services:

1. **PostgreSQL**: PostgreSQL 16 Datenbank (Port 5432)
2. **Frontend (web)**: React-basiertes UI auf nginx (Port 3000)
3. **Backend (backend)**: Node.js Worker für Ansible-Job-Ausführung
4. **Redis**: Job Queue und Cache (Port 6379)

```
┌─────────────┐      ┌──────────────┐      ┌─────────┐
│   Browser   │─────▶│   Frontend   │      │  Redis  │
└─────────────┘      │   (nginx)    │      │  Queue  │
                     └──────┬───────┘      └────▲────┘
                            │                   │
                            ▼                   │
                     ┌──────────────┐          │
                     │  PostgreSQL  │          │
                     │   Database   │◀─────────┤
                     └──────────────┘          │
                            ▲                   │
                            │                   │
                            └───────────────────┘
                                   Backend Worker
```

## Voraussetzungen

- Docker Engine 20.10+
- Docker Compose 2.0+
- Keine externen Dienste erforderlich (alles läuft lokal)

## Schnellstart

### 1. Environment-Variablen konfigurieren

Die `.env` Datei ist bereits konfiguriert mit Standard-Werten:

```env
DATABASE_URL=postgresql://ansible:ansible_password@postgres:5432/ansible_tower
REDIS_HOST=redis
REDIS_PORT=6379
POSTGRES_DB=ansible_tower
POSTGRES_USER=ansible
POSTGRES_PASSWORD=ansible_password
```

**WICHTIG**: Ändern Sie diese Werte für Produktionsumgebungen!

### 2. Services starten

```bash
# Alle Services bauen und starten
docker-compose up -d --build

# Logs verfolgen
docker-compose logs -f

# Nur bestimmten Service-Logs anzeigen
docker-compose logs -f backend
```

### 3. Anwendung aufrufen

- **Frontend**: http://localhost:3000
- **PostgreSQL**: localhost:5432 (Datenbank: ansible_tower)
- **Redis**: localhost:6379 (für Debugging)

**Standard-Login**:
- Email: `admin@ansible-tower.local`
- Passwort: `admin123`

## Service-Details

### PostgreSQL (postgres)

**Port**: 5432
**Image**: postgres:16-alpine
**Volume**: `postgres-data` (persistente Speicherung)
**Database**: ansible_tower

Die PostgreSQL-Datenbank:
- Automatische Schema-Initialisierung beim ersten Start
- Vollständiges Datenmodell für Ansible Tower
- Seed-Daten mit Admin-User und Beispieldaten
- Health-Check für abhängige Services

**Datenbank-Zugriff**:
```bash
# Mit psql verbinden
docker exec -it ansible-tower-postgres psql -U ansible -d ansible_tower

# Tabellen anzeigen
\dt

# Sample Query
SELECT * FROM users;
```

**Schema-Details**: Siehe `database/init/01_schema.sql` und `database/init/02_seed_data.sql`

### Frontend (web)

**Port**: 3000
**Technologie**: React + Vite + nginx
**Dockerfile**: `./Dockerfile`

Der Frontend-Service baut die React-Anwendung und serviert sie über nginx mit:
- Gzip-Kompression
- SPA-Routing (alle Pfade zu index.html)
- Security Headers
- Caching für statische Assets

### Backend (backend)

**Technologie**: Node.js + PostgreSQL + BullMQ + Ansible
**Dockerfile**: `./backend/Dockerfile`

Der Backend-Worker:
- Verarbeitet Jobs aus der Redis-Queue
- Simuliert Ansible-Ausführungen (oder führt echte Ansible-Playbooks aus)
- Aktualisiert Job-Status in PostgreSQL
- Erstellt Job-Events für Live-Monitoring
- Direkte PostgreSQL-Verbindung mit Connection Pooling

### Redis

**Port**: 6379
**Image**: redis:7-alpine
**Volume**: `redis-data` (persistente Speicherung)

Redis dient als:
- Job Queue (BullMQ)
- Temporärer Cache
- Pub/Sub für Echtzeit-Updates

## Nützliche Befehle

```bash
# Services stoppen
docker-compose down

# Services stoppen und Volumes löschen
docker-compose down -v

# Services neu bauen (nach Code-Änderungen)
docker-compose up -d --build

# Einzelnen Service neu starten
docker-compose restart backend

# In Container einsteigen
docker exec -it ansible-tower-backend sh
docker exec -it ansible-tower-postgres psql -U ansible -d ansible_tower
docker exec -it ansible-tower-redis redis-cli

# Resource-Nutzung anzeigen
docker stats

# Logs seit bestimmter Zeit
docker-compose logs --since 30m

# Container-Status prüfen
docker-compose ps
```

## Entwicklung

### Backend-Code ändern

Der Backend-Code wird als Volume gemountet, aber Node.js cached Module. Nach Änderungen:

```bash
docker-compose restart backend
```

### Frontend-Code ändern

Nach Frontend-Änderungen muss neu gebaut werden:

```bash
docker-compose up -d --build web
```

## Produktions-Deployment

### Optimierungen für Produktion

1. **Multi-Stage Builds nutzen** (bereits implementiert)
2. **Resource Limits setzen**:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

3. **Health Checks hinzufügen**:

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
```

4. **Secrets verwenden** statt Environment-Variablen:

```yaml
services:
  backend:
    secrets:
      - supabase_key
secrets:
  supabase_key:
    file: ./secrets/supabase_key.txt
```

### Load Balancing

Für höhere Last mehrere Backend-Worker starten:

```bash
docker-compose up -d --scale backend=3
```

## Monitoring

### Logs zentral sammeln

```bash
# In eine Datei schreiben
docker-compose logs -f > application.log

# Mit ELK Stack integrieren
# fluentd oder logstash als zusätzlichen Service hinzufügen
```

### Redis Monitor

```bash
# Redis-Commands in Echtzeit anzeigen
docker exec -it ansible-tower-redis redis-cli monitor

# Queue-Status prüfen
docker exec -it ansible-tower-redis redis-cli
> KEYS bull:ansible-jobs:*
> LLEN bull:ansible-jobs:wait
```

## Troubleshooting

### Backend startet nicht

```bash
# Logs prüfen
docker-compose logs backend

# Häufige Probleme:
# - Redis nicht erreichbar → Netzwerk prüfen
# - Supabase-Credentials fehlen → .env prüfen
# - Port bereits belegt → Port in docker-compose.yml ändern
```

### Redis-Verbindungsfehler

```bash
# Redis-Verbindung testen
docker exec -it ansible-tower-redis redis-cli ping
# Sollte "PONG" zurückgeben

# Redis-Logs prüfen
docker-compose logs redis
```

### Frontend zeigt 502 Error

```bash
# nginx-Konfiguration prüfen
docker exec -it ansible-tower-ui cat /etc/nginx/conf.d/default.conf

# nginx neu starten
docker-compose restart web
```

### Container startet und stoppt sofort

```bash
# Exit-Code prüfen
docker-compose ps -a

# Detaillierte Logs
docker-compose logs --tail=100 backend
```

## Backup & Wiederherstellung

### PostgreSQL-Datenbank sichern

```bash
# Vollständiges Backup erstellen
docker exec -t ansible-tower-postgres pg_dump -U ansible ansible_tower > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup mit Kompression
docker exec -t ansible-tower-postgres pg_dump -U ansible ansible_tower | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Wiederherstellen
cat backup.sql | docker exec -i ansible-tower-postgres psql -U ansible -d ansible_tower

# Oder mit Kompression
gunzip -c backup.sql.gz | docker exec -i ansible-tower-postgres psql -U ansible -d ansible_tower

# Datenbank neu erstellen (wenn nötig)
docker exec -it ansible-tower-postgres psql -U ansible -d postgres -c "DROP DATABASE IF EXISTS ansible_tower;"
docker exec -it ansible-tower-postgres psql -U ansible -d postgres -c "CREATE DATABASE ansible_tower;"
```

### Redis-Daten sichern

```bash
# Manuelles Backup erstellen
docker exec ansible-tower-redis redis-cli BGSAVE

# Backup-Datei kopieren
docker cp ansible-tower-redis:/data/dump.rdb ./backup/

# Wiederherstellen
docker cp ./backup/dump.rdb ansible-tower-redis:/data/
docker-compose restart redis
```

### Automatisches Backup-Script

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# PostgreSQL Backup
docker exec -t ansible-tower-postgres pg_dump -U ansible ansible_tower | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"

# Redis Backup
docker exec ansible-tower-redis redis-cli BGSAVE
sleep 2
docker cp ansible-tower-redis:/data/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

echo "Backup completed: $DATE"

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +30 -delete
```

## Skalierung

### Horizontale Skalierung

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
```

### Kubernetes Deployment

Für größere Deployments siehe `k8s/` Verzeichnis (separate Dokumentation).

## Netzwerk-Architektur

Alle Services laufen im gleichen Bridge-Netzwerk `app-network`:

- Services können sich über Container-Namen erreichen (z.B. `redis:6379`)
- Nur web (Port 3000) und redis (Port 6379) sind nach außen exponiert
- Backend kommuniziert nur intern

## Sicherheit

### Best Practices

1. **Secrets nicht in Images**: Verwenden Sie Docker Secrets oder externe Vaults
2. **Non-root User**: Services sollten als non-root user laufen
3. **Network Policies**: Limitieren Sie Service-zu-Service Kommunikation
4. **Image Scanning**: Scannen Sie Images auf Vulnerabilities
5. **Regular Updates**: Halten Sie Base-Images aktuell

```bash
# Vulnerability Scan
docker scan ansible-tower-ui
docker scan ansible-tower-backend
```

## Performance-Tuning

### Redis optimieren

```yaml
redis:
  command: >
    redis-server
    --maxmemory 256mb
    --maxmemory-policy allkeys-lru
    --appendonly yes
    --appendfsync everysec
```

### nginx-Cache erweitern

```nginx
# In nginx.conf hinzufügen
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
proxy_cache my_cache;
```

## Support

Bei Problemen:
1. Logs prüfen: `docker-compose logs`
2. Container-Status: `docker-compose ps`
3. Netzwerk prüfen: `docker network inspect ansible-tower_app-network`
4. GitHub Issues erstellen mit Logs und docker-compose.yml
