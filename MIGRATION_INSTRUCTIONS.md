# Datenbank-Migrationen

Das Backend wendet automatisch alle Migrationen beim Start an.

## Automatische Migrationen

Beim Start des Backend-Servers:
1. Überprüft das System, welche Migrationen bereits angewendet wurden
2. Wendet automatisch alle neuen Migrationen aus `database/migrations/` an
3. Protokolliert den Status in der `schema_migrations` Tabelle

## Backend neu starten

Um die neuesten Migrationen anzuwenden, starten Sie einfach das Backend neu:

```bash
cd backend
npm start
```

Oder mit Docker:

```bash
docker-compose restart backend
```

## Verfügbare Migrationen

1. **001_add_credential_to_inventory.sql** - Fügt Credential-Feld zu Inventories hinzu
2. **002_add_settings_and_improve_audit.sql** - Fügt Settings-Tabelle hinzu
3. **003_add_auth_provider.sql** - Fügt Auth-Provider zu Users hinzu
4. **004_add_oauth_client_secrets.sql** - Fügt OAuth Client Secrets hinzu
5. **005_add_email_templates_and_notifications.sql** - Fügt Email-Templates und Benachrichtigungseinstellungen hinzu

## Migration manuell überprüfen

```bash
# Verbindung zur Datenbank
docker-compose exec postgres psql -U ansible -d ansible_tower

# Angewendete Migrationen anzeigen
SELECT * FROM schema_migrations ORDER BY applied_at;
```

## Neue Migration hinzufügen

1. Erstellen Sie eine neue `.sql` Datei in `database/migrations/`
2. Benennen Sie sie mit einer fortlaufenden Nummer (z.B. `006_beschreibung.sql`)
3. Starten Sie das Backend neu - die Migration wird automatisch angewendet

## Troubleshooting

Falls Migrationen nicht automatisch ausgeführt werden:

1. Überprüfen Sie die Backend-Logs beim Start
2. Stellen Sie sicher, dass die Datenbank erreichbar ist
3. Prüfen Sie die `schema_migrations` Tabelle auf bereits angewendete Migrationen
