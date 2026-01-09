# Ansible Tower - Setup und Start

## Voraussetzungen

- Docker und Docker Compose installiert
- Node.js 20+ installiert (für lokale Entwicklung)
- npm installiert

## Schnellstart mit Docker

### 1. Docker Container starten

```bash
docker compose up --build
```

Dies startet:
- PostgreSQL-Datenbank auf Port 5432
- Redis auf Port 6379
- Backend-API auf Port 3001
- Frontend auf Port 3000

### 2. Warten bis alle Services laufen

Die Container brauchen ein paar Sekunden zum Starten. Überprüfe den Status:

```bash
docker compose ps
```

### 3. Anwendung öffnen

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001

### 4. Einloggen

**Admin-Zugang:**
- Email: `admin@ansible-tower.local`
- Passwort: `admin123`

## Lokale Entwicklung (ohne Docker für Frontend)

### 1. Backend in Docker starten

```bash
docker compose up postgres redis backend
```

### 2. Frontend lokal starten

```bash
npm install
npm run dev
```

Das Frontend läuft dann auf http://localhost:5173

## Datenbank überprüfen

### Direkt in die Datenbank verbinden

```bash
docker exec -it ansible-tower-postgres psql -U ansible -d ansible_tower
```

### Tabellen anzeigen

```sql
\dt
```

### Admin-User anzeigen

```sql
SELECT id, email, full_name, role FROM users;
```

## Problembehebung

### Backend startet nicht

1. Logs überprüfen:
```bash
docker compose logs backend
```

2. Container neu starten:
```bash
docker compose restart backend
```

### Datenbank zurücksetzen

```bash
docker compose down -v
docker compose up --build
```

### API ist nicht erreichbar

1. Überprüfe ob der Backend-Container läuft:
```bash
docker compose ps backend
```

2. Teste die API direkt:
```bash
curl http://localhost:3001/api/auth/session
```

## Entwicklungsbefehle

### Backend-Logs anzeigen
```bash
docker compose logs -f backend
```

### Frontend-Build erstellen
```bash
npm run build
```

### Typ-Überprüfung
```bash
npm run typecheck
```

## Port-Übersicht

| Service | Port |
|---------|------|
| Frontend | 3000 (Docker), 5173 (lokal) |
| Backend API | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |
