# Datenbank-Migration: credential_id zu inventories hinzufügen

## Problem
Die `inventories` Tabelle benötigt eine `credential_id` Spalte, um Standard-Credentials zu speichern.

## Lösung

### Option 1: Mit Docker Compose (wenn Docker läuft)
```bash
docker-compose exec postgres psql -U ansible -d ansible_awx -f /docker-entrypoint-initdb.d/migrations/001_add_credential_to_inventory.sql
```

### Option 2: Mit psql direkt
Verbinden Sie sich mit Ihrer PostgreSQL-Datenbank und führen Sie aus:

```sql
ALTER TABLE inventories
ADD COLUMN IF NOT EXISTS credential_id UUID
REFERENCES credentials(id) ON DELETE SET NULL;
```

### Option 3: Migration-Datei ausführen
```bash
psql -U ansible -d ansible_awx -f database/migrations/001_add_credential_to_inventory.sql
```

## Überprüfung
Nach der Migration sollten Sie überprüfen, ob die Spalte existiert:

```sql
\d inventories
```

Sie sollten die Spalte `credential_id` in der Tabellenbeschreibung sehen.

## Danach
Starten Sie das Backend neu, falls es läuft:

```bash
docker-compose restart backend
```
