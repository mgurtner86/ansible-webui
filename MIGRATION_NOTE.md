# Database Migration Required

Nach den neuesten Änderungen muss folgende Migration ausgeführt werden:

## Migration 008: output_json Feld

```bash
# Wenn Docker verwendet wird:
docker-compose exec postgres psql -U ansible -d ansible_tower -c "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS output_json JSONB DEFAULT NULL;"
docker-compose exec postgres psql -U ansible -d ansible_tower -c "CREATE INDEX IF NOT EXISTS idx_jobs_output_json ON jobs USING gin(output_json);"

# Oder direkt im Container:
docker exec -it <postgres-container-name> psql -U ansible -d ansible_tower -c "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS output_json JSONB DEFAULT NULL;"
docker exec -it <postgres-container-name> psql -U ansible -d ansible_tower -c "CREATE INDEX IF NOT EXISTS idx_jobs_output_json ON jobs USING gin(output_json);"
```

Die Migration-Datei befindet sich in: `database/migrations/008_add_json_output.sql`

## Was wurde geändert?

1. **Datenbank**: Neues Feld `output_json` in der `jobs` Tabelle für strukturierte JSON-Ausgabe
2. **Backend**: JSON-Callback von Ansible + Konvertierung in lesbare Ausgabe für Live-View
3. **Frontend**: Nutzt JSON-Daten für präzisen Parser, zeigt aber lesbare Ausgabe im Live-View

## Vorteile

- **Live-Output**: Zeigt normale, lesbare Ansible-Ausgabe (PLAY, TASK, ok:, changed:, etc.)
- **Strukturierter Parser**: Nutzt JSON für präzise Analyse und schöne Darstellung
- **Beide Welten**: Live-lesbare Ausgabe + strukturierte Daten für Parser
