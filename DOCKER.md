# Docker Deployment Guide

## Architektur

Das System besteht aus drei Services:

1. **Frontend (web)**: React-basiertes UI auf nginx (Port 3000)
2. **Backend (backend)**: Node.js Worker für Ansible-Job-Ausführung
3. **Redis**: Job Queue und Cache (Port 6379)

```
┌─────────────┐      ┌──────────────┐      ┌─────────┐
│   Browser   │─────▶│   Frontend   │      │  Redis  │
└─────────────┘      │   (nginx)    │      │  Queue  │
                     └──────┬───────┘      └────▲────┘
                            │                   │
                            ▼                   │
                     ┌──────────────┐          │
                     │   Supabase   │          │
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
- Supabase Account und Project

## Schnellstart

### 1. Environment-Variablen konfigurieren

Stellen Sie sicher, dass die `.env` Datei im Root-Verzeichnis existiert:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

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
- **Redis**: localhost:6379 (für Debugging)

## Service-Details

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

**Technologie**: Node.js + BullMQ + Ansible
**Dockerfile**: `./backend/Dockerfile`

Der Backend-Worker:
- Verarbeitet Jobs aus der Redis-Queue
- Simuliert Ansible-Ausführungen (oder führt echte Ansible-Playbooks aus)
- Aktualisiert Job-Status in Supabase
- Erstellt Job-Events für Live-Monitoring

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
