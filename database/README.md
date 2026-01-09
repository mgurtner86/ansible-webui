# Database Schema Documentation

## Übersicht

Die Ansible Tower Anwendung verwendet PostgreSQL 16 als Hauptdatenbank. Das Schema ist vollständig normalisiert und unterstützt alle Funktionen einer Enterprise Ansible Tower Installation.

## Automatische Initialisierung

Beim ersten Start des PostgreSQL-Containers werden automatisch folgende Scripts ausgeführt:

1. **01_schema.sql**: Erstellt alle Tabellen, Indizes, Trigger und Constraints
2. **02_seed_data.sql**: Fügt initiale Daten ein (Admin-User, Permissions, Beispieldaten)

## Datenmodell

### Core Entities

```
users ─────┐
           ├──> projects ──> playbooks
           ├──> inventories ─┬──> hosts
           │                 └──> groups
           ├──> credentials
           ├──> templates ──> jobs ──> job_events
           └──> schedules
```

### Tabellen-Übersicht

#### users
Benutzerkonten mit Rollen und Authentifizierung

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primärschlüssel |
| email | TEXT | Eindeutige Email-Adresse |
| password_hash | TEXT | Bcrypt gehashtes Passwort |
| role | user_role | Rolle (admin, manager, operator, viewer) |
| mfa_enabled | BOOLEAN | MFA aktiviert |
| is_active | BOOLEAN | Account aktiv |

#### projects
Git-Repositories mit Ansible-Playbooks

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primärschlüssel |
| name | TEXT | Projektname |
| git_url | TEXT | Git Repository URL |
| git_branch | TEXT | Branch (default: main) |
| sync_status | sync_status | Status (pending, syncing, success, failed) |
| owner_id | UUID | Referenz zu users |

#### playbooks
Einzelne Playbook-Dateien innerhalb von Projekten

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primärschlüssel |
| project_id | UUID | Referenz zu projects |
| name | TEXT | Playbook-Name |
| file_path | TEXT | Dateipfad im Repository |
| content | TEXT | Playbook-Inhalt (YAML) |

#### inventories
Ansible Inventory-Konfigurationen

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primärschlüssel |
| name | TEXT | Inventory-Name |
| source | inventory_source | Quelle (static, git, dynamic) |
| content_or_ref | TEXT | Inventory-Inhalt oder Referenz |
| variables | JSONB | Globale Variablen |
| owner_id | UUID | Referenz zu users |

#### hosts
Einzelne Hosts in Inventories

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primärschlüssel |
| inventory_id | UUID | Referenz zu inventories |
| hostname | TEXT | Hostname oder IP |
| vars | JSONB | Host-spezifische Variablen |
| groups | TEXT[] | Zugehörige Gruppen |

#### groups
Host-Gruppen in Inventories

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primärschlüssel |
| inventory_id | UUID | Referenz zu inventories |
| name | TEXT | Gruppenname |
| vars | JSONB | Gruppen-Variablen |
| children | TEXT[] | Kind-Gruppen |

#### credentials
Verschlüsselte Secrets (SSH-Keys, Passwörter, API-Tokens)

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primärschlüssel |
| type | credential_type | Typ (ssh, vault, api_token, cloud) |
| name | TEXT | Credential-Name |
| encrypted_secret | TEXT | Base64-verschlüsseltes Secret |
| scope | TEXT | Geltungsbereich (user, global) |
| owner_id | UUID | Referenz zu users |

#### templates
Wiederverwendbare Job-Konfigurationen

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primärschlüssel |
| name | TEXT | Template-Name |
| playbook_id | UUID | Referenz zu playbooks |
| inventory_id | UUID | Referenz zu inventories |
| credential_id | UUID | Referenz zu credentials (optional) |
| extra_vars_schema | JSONB | JSON-Schema für Extra Vars |
| limits | TEXT | Host-Limits |
| tags | TEXT[] | Ansible-Tags |
| forks | INTEGER | Parallelität (default: 5) |
| timeout | INTEGER | Timeout in Sekunden |
| become | BOOLEAN | Sudo/Become nutzen |
| owner_id | UUID | Referenz zu users |

#### jobs
Job-Ausführungsaufzeichnungen

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primärschlüssel |
| template_id | UUID | Referenz zu templates |
| triggered_by | UUID | Referenz zu users |
| status | job_status | Status (queued, running, success, failed) |
| extra_vars | JSONB | Übergebene Extra Vars |
| created_at | TIMESTAMPTZ | Erstellungszeitpunkt |
| started_at | TIMESTAMPTZ | Startzeitpunkt |
| finished_at | TIMESTAMPTZ | Endzeitpunkt |
| return_code | INTEGER | Exit-Code |
| summary | JSONB | Zusammenfassung (ok, changed, failed, etc.) |

#### job_events
Detaillierte Job-Events und Logs

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primärschlüssel |
| job_id | UUID | Referenz zu jobs |
| timestamp | TIMESTAMPTZ | Event-Zeitpunkt |
| level | TEXT | Log-Level (info, warning, error) |
| host | TEXT | Betroffener Host |
| task | TEXT | Ansible-Task |
| event_type | TEXT | Event-Typ (runner_on_ok, etc.) |
| message | TEXT | Event-Nachricht |
| raw_json | JSONB | Vollständige Event-Daten |

#### schedules
Cron-basierte Job-Schedules

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primärschlüssel |
| template_id | UUID | Referenz zu templates |
| name | TEXT | Schedule-Name |
| cron | TEXT | Cron-Ausdruck |
| timezone | TEXT | Zeitzone (default: UTC) |
| enabled | BOOLEAN | Schedule aktiv |
| next_run_at | TIMESTAMPTZ | Nächste Ausführung |
| last_run_at | TIMESTAMPTZ | Letzte Ausführung |
| created_by | UUID | Referenz zu users |

#### audit_logs
Vollständiger Audit-Trail

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primärschlüssel |
| actor_id | UUID | Referenz zu users |
| action | TEXT | Aktion (z.B. "job.create") |
| target_type | TEXT | Ziel-Typ (z.B. "job") |
| target_id | UUID | Ziel-ID |
| before | JSONB | Zustand vor Änderung |
| after | JSONB | Zustand nach Änderung |
| ip_address | INET | IP-Adresse |
| timestamp | TIMESTAMPTZ | Zeitpunkt |

## Enums

### user_role
- `admin`: Vollzugriff auf alle Ressourcen
- `manager`: Kann alle Ressourcen außer Users verwalten
- `operator`: Kann Templates ausführen und Ressourcen lesen
- `viewer`: Nur Lesezugriff

### job_status
- `queued`: Job wartet in Queue
- `running`: Job wird ausgeführt
- `success`: Job erfolgreich abgeschlossen
- `failed`: Job fehlgeschlagen
- `cancelled`: Job abgebrochen

### credential_type
- `ssh`: SSH Private Keys
- `vault`: Ansible Vault Passwörter
- `api_token`: API-Tokens für Cloud-Provider
- `cloud`: Cloud-Credentials (AWS, Azure, GCP)

### inventory_source
- `static`: Statische Inventory-Datei
- `git`: Inventory aus Git-Repository
- `dynamic`: Dynamisches Inventory (Scripts, Plugins)

### sync_status
- `pending`: Sync ausstehend
- `syncing`: Sync läuft
- `success`: Sync erfolgreich
- `failed`: Sync fehlgeschlagen

## Indizes

Alle wichtigen Foreign Keys und häufig abgefragte Spalten haben Indizes für optimale Performance:

- User-Email (unique)
- Project Owner
- Job Status
- Job Created_at (DESC für neueste zuerst)
- Job Events (Job_id, Timestamp)
- Audit Logs (Actor, Timestamp)

## Trigger

### update_updated_at_column()

Automatisches Update des `updated_at` Feldes bei jeder Änderung.

Wird angewendet auf:
- users
- projects
- playbooks
- inventories
- hosts
- groups
- credentials
- templates
- schedules

## Standard-Daten

### Admin-User
- Email: `admin@ansible-tower.local`
- Passwort: `admin123` (SHA-512 gehasht mit bcrypt)
- Rolle: `admin`

### Role Permissions

Vollständige Permission-Matrix für alle 4 Rollen über alle Ressourcen.

### Beispiel-Daten

Optionale Beispiel-Daten werden erstellt:
- 1 Sample Project
- 1 Sample Playbook
- 1 Sample Inventory mit localhost
- 1 Sample Credential
- 1 Sample Template

## Direkter Datenbank-Zugriff

```bash
# Verbindung zur Datenbank
docker exec -it ansible-tower-postgres psql -U ansible -d ansible_tower

# Wichtige Queries
\dt                          # Alle Tabellen anzeigen
\d+ users                    # Tabellen-Schema anzeigen
SELECT * FROM users;         # Alle User anzeigen
SELECT * FROM jobs ORDER BY created_at DESC LIMIT 10;  # Letzte 10 Jobs
```

## Migrations

Für Änderungen am Schema:

1. Neue Migration-Datei erstellen: `database/init/03_migration_name.sql`
2. SQL-Schema-Änderungen hinzufügen
3. Container neu starten (nur bei frischer DB werden Migrations ausgeführt)

**Hinweis**: Für bestehende Datenbanken müssen Migrations manuell ausgeführt werden:

```bash
docker exec -i ansible-tower-postgres psql -U ansible -d ansible_tower < database/init/03_migration_name.sql
```

## Performance-Tipps

1. **Connection Pooling**: Backend nutzt pg Pool mit max 20 Connections
2. **Prepared Statements**: Verwenden Sie parametrisierte Queries
3. **Batch Inserts**: Job-Events werden in Batches geschrieben
4. **Index-Optimierung**: Regelmäßig `ANALYZE` ausführen für bessere Query-Pläne

```sql
-- Statistiken aktualisieren
ANALYZE;

-- Index-Nutzung prüfen
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Sicherheit

1. **Passwort-Hashing**: Bcrypt mit gen_salt('bf')
2. **Secrets**: Base64-encodiert (für Production: echte Verschlüsselung nutzen)
3. **SQL Injection**: Alle Queries verwenden parametrisierte Statements
4. **Least Privilege**: Nur notwendige Permissions für ansible-User

## Backup-Strategie

Siehe DOCKER.md für vollständige Backup-Anweisungen.

Empfohlene Strategie:
- Tägliche vollständige Backups
- Point-in-Time-Recovery mit WAL-Archivierung
- Retention: 30 Tage
- Off-Site Backup-Kopien
