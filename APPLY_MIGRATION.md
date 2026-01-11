# Datenbank-Migration anwenden

Die Settings-Tabelle und Audit-Log-Erweiterungen müssen auf Ihre lokale Postgres-Datenbank angewendet werden.

## Option 1: Docker Container neu starten (empfohlen)

```bash
docker-compose down
docker-compose up -d
```

Die Änderungen in `database/init/01_schema.sql` und `database/init/02_seed_data.sql` werden automatisch angewendet.

## Option 2: Migration manuell ausführen

Wenn die Datenbank bereits läuft und Daten enthält:

```bash
docker-compose exec -T postgres psql -U ansible_user -d ansible_tower < database/migrations/002_add_settings_and_improve_audit.sql
```

Oder mit dem neueren docker compose (ohne Bindestrich):

```bash
docker compose exec -T postgres psql -U ansible_user -d ansible_tower < database/migrations/002_add_settings_and_improve_audit.sql
```

## Was wurde geändert?

1. **settings** Tabelle wurde erstellt für:
   - Microsoft 365 OAuth Konfiguration
   - E-Mail-Einstellungen (SMTP/OAuth)
   - System-Einstellungen

2. **audit_logs** Tabelle wurde erweitert mit:
   - `details` - Zusätzliche Details zur Aktion
   - `status` - Status der Aktion (success/failed)

3. Neue Indizes für bessere Performance
