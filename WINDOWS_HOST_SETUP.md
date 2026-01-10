# Windows Host Setup für Ansible WinRM

## Voraussetzungen auf dem Windows-Host

Damit Ansible über WinRM mit Windows-Hosts kommunizieren kann, müssen diese entsprechend konfiguriert sein.

## Schnelle Einrichtung (PowerShell als Administrator)

Führen Sie auf dem Windows-Host folgendes PowerShell-Skript als Administrator aus:

```powershell
# WinRM aktivieren
Enable-PSRemoting -Force

# WinRM Listener für HTTPS erstellen (mit selbstsigniertem Zertifikat)
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "Cert:\LocalMachine\My"
$thumbprint = $cert.Thumbprint

winrm create winrm/config/Listener?Address=*+Transport=HTTPS "@{Hostname=`"localhost`"; CertificateThumbprint=`"$thumbprint`"}"

# Basic Authentication aktivieren (für einfache Tests)
Set-Item -Path WSMan:\localhost\Service\Auth\Basic -Value $true

# Unverschlüsselte Verbindungen erlauben (nur für HTTP Port 5985)
Set-Item -Path WSMan:\localhost\Service\AllowUnencrypted -Value $true

# Firewall-Regeln hinzufügen
New-NetFirewallRule -DisplayName "WinRM HTTPS" -Direction Inbound -LocalPort 5986 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "WinRM HTTP" -Direction Inbound -LocalPort 5985 -Protocol TCP -Action Allow

# WinRM Service neu starten
Restart-Service WinRM

# Status prüfen
winrm enumerate winrm/config/Listener
```

## Verwendung des offiziellen Ansible-Skripts

Alternativ können Sie das offizielle Ansible-Konfigurationsskript verwenden:

```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$url = "https://raw.githubusercontent.com/ansible/ansible/devel/examples/scripts/ConfigureRemotingForAnsible.ps1"
$file = "$env:temp\ConfigureRemotingForAnsible.ps1"
(New-Object -TypeName System.Net.WebClient).DownloadFile($url, $file)
powershell.exe -ExecutionPolicy ByPass -File $file
```

## Credential-Konfiguration

### Für NTLM (empfohlen)
- **Transport**: NTLM
- **Port**: 5986 (HTTPS) oder 5985 (HTTP)
- **Username**: DOMÄNE\Benutzername oder Computername\Benutzername
- **Password**: Windows-Passwort

### Für Basic Authentication
- **Transport**: Basic
- **Port**: 5986 (HTTPS) empfohlen
- **Username**: Benutzername
- **Password**: Windows-Passwort

## Überprüfung der Konfiguration

Prüfen Sie, ob WinRM läuft:

```powershell
Get-Service WinRM
winrm get winrm/config/Service
```

Testen Sie die Verbindung von einem anderen Rechner:

```powershell
Test-WSMan -ComputerName <IP-ADRESSE> -Port 5986 -UseSSL
```

## Hinzufügen eines Windows-Hosts im Inventory

1. Gehen Sie zu Ihrem Inventory
2. Klicken Sie auf "Add Host"
3. Geben Sie die IP-Adresse oder den Hostnamen ein
4. Aktivieren Sie "Windows Host (WinRM)"
5. Konfigurieren Sie:
   - **WinRM Port**: 5986 für HTTPS (empfohlen) oder 5985 für HTTP
   - **Transport**: NTLM (Standard), Basic oder Kerberos
   - **SSL-Validierung**: Deaktivieren für selbstsignierte Zertifikate
6. Erstellen Sie ein Credential mit Windows-Benutzernamen und -Passwort

## Troubleshooting

### Verbindung schlägt fehl
- Prüfen Sie die Firewall-Einstellungen auf dem Windows-Host
- Stellen Sie sicher, dass WinRM läuft: `Get-Service WinRM`
- Überprüfen Sie Benutzername und Passwort
- Testen Sie die Verbindung mit `Test-WSMan`

### SSL-Zertifikat-Fehler
- Aktivieren Sie "Ignore SSL certificate validation" im Host-Formular
- Oder verwenden Sie HTTP auf Port 5985 (weniger sicher)

### Authentication-Fehler
- Prüfen Sie, ob der Benutzer Administrator-Rechte hat
- Stellen Sie sicher, dass Basic Auth aktiviert ist (falls verwendet)
- Für NTLM: Verwenden Sie das Format `DOMÄNE\Benutzer` oder `PC-NAME\Benutzer`

## Sicherheitshinweise

- **Produktionsumgebung**: Verwenden Sie immer HTTPS (Port 5986) mit gültigen Zertifikaten
- **Testumgebung**: HTTP (Port 5985) ist akzeptabel, aber weniger sicher
- Beschränken Sie den Zugriff auf WinRM-Ports über Firewall-Regeln
- Verwenden Sie starke Passwörter für Windows-Benutzerkonten
- Erwägen Sie die Verwendung von Kerberos in Domänenumgebungen
