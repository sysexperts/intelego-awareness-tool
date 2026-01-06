# � Intelego Awareness Tool

**Professionelle Phishing-Analyse & Reporting-Plattform**

Eine Docker-basierte Webanwendung zur automatisierten Auswertung von Phishing-Simulationen. Die App verarbeitet ZIP-Dateien mit CSV-Statistiken, analysiert das Klickverhalten, erstellt professionelle PDF-Reports und versendet diese automatisch per E-Mail.

## 🎯 Funktionen

- ✅ **Kunden-Verwaltung**: Einfache Verwaltung von Kunden
- ✅ **ZIP-Upload**: Automatische Verarbeitung von ZIP-Dateien mit 3 CSV-Dateien
- ✅ **Phishing-Analyse**: Detaillierte Auswertung von Klickraten, Erfolgsquoten und Szenarien
- ✅ **PDF-Reports**: Automatische Generierung professioneller Reports
- ✅ **E-Mail-Versand**: Automatischer Versand der Reports
- ✅ **Dashboard**: Übersichtliche Darstellung aller Reports
- ✅ **Anonymisiert**: Keine personenbezogenen Daten, nur aggregierte Statistiken

## 📋 Voraussetzungen

- **Docker Desktop** (empfohlen) oder **Node.js 18+**
- **Git**

## 🚀 Schnellstart

### Mit Docker (Empfohlen)

1. **Repository klonen**
   ```bash
   git clone https://github.com/sysexperts/intelego-awareness-tool.git
   cd intelego-awareness-tool
   ```

2. **E-Mail-Konfiguration (optional)**
   ```bash
   cp .env.example .env
   # Bearbeite .env und trage deine E-Mail-Zugangsdaten ein
   ```

3. **Docker Container starten**
   ```bash
   docker compose up --build -d
   ```

4. **App öffnen**
   - Browser: http://localhost:3000
   - Login: `admin` / `admin123`

### Ohne Docker (Lokal)

1. **Dependencies installieren**
   ```bash
   npm install
   ```

2. **Server starten**
   ```bash
   npm start
   ```

3. **App öffnen**
   - Browser: http://localhost:3000
   - Login: `admin` / `admin123`

## � Verwendung

### 1. Kunden anlegen
- Navigiere zum Tab "Kunden"
- Klicke auf "+ Neuer Kunde"
- Gib den Kundennamen ein

### 2. ZIP-Datei hochladen
- Navigiere zum Tab "ZIP Upload"
- Wähle einen Kunden aus
- Optional: E-Mail-Empfänger angeben
- ZIP-Datei auswählen (muss 3 CSV-Dateien enthalten)
- Hochladen & Analysieren

### 3. Reports ansehen
- Navigiere zum Tab "Reports"
- Alle generierten Reports werden angezeigt
- PDF-Download verfügbar

## 📁 ZIP-Datei Format

Die ZIP-Datei muss **genau 3 CSV-Dateien** enthalten:

1. **Phishing-Szenarien** (z.B. `phishing_scenarios.csv`)
   - Spalten: `scenario_name`, `clicks`, `logins`, `file_opens`, `macro_executions`, `reported`, `psychological_factor`

2. **Benutzer-Statistiken** (z.B. `user_statistics.csv`)
   - Aggregierte Benutzer-Daten (keine Einzelpersonen)

3. **Unternehmens-Statistiken** (z.B. `company_statistics.csv`)
   - Unternehmensweite Statistiken

## 📧 E-Mail-Konfiguration

Für automatischen E-Mail-Versand:

1. Kopiere `.env.example` zu `.env`
2. Trage deine SMTP-Zugangsdaten ein:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=deine-email@gmail.com
   EMAIL_PASS=dein-app-passwort
   EMAIL_FROM=noreply@intelego-awareness.com
   ```

**Hinweis für Gmail**: Verwende ein [App-Passwort](https://support.google.com/accounts/answer/185833)

## 🛠️ Projektstruktur

```
.
├── config.js                 # Konfiguration
├── database.js              # SQLite Datenbank-Setup
├── server.js                # Haupt-Server
├── middleware/
│   └── auth.js              # Authentifizierung
├── routes/
│   ├── auth.js              # Login/Logout
│   ├── customers.js         # Kunden-Verwaltung
│   └── reports.js           # Report-Upload & Download
├── services/
│   ├── zipProcessor.js      # ZIP-Verarbeitung
│   ├── phishingAnalyzer.js  # Analyse-Engine
│   ├── pdfGenerator.js      # PDF-Generierung
│   └── emailService.js      # E-Mail-Versand
├── public/
│   ├── login.html           # Login-Seite
│   ├── dashboard.html       # Haupt-Dashboard
│   ├── styles.css           # Styling
│   ├── login.js             # Login-Logik
│   └── dashboard.js         # Dashboard-Logik
└── data/                    # SQLite-Datenbank (automatisch erstellt)
```

## � Deployment

### Railway.app (Empfohlen)

1. Gehe zu https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Wähle `sysexperts/intelego-awareness-tool`
4. Füge Umgebungsvariablen hinzu (E-Mail-Config)
5. Deploy!

### Render.com

1. Gehe zu https://render.com
2. "New Web Service" → GitHub verbinden
3. Repository auswählen
4. Umgebungsvariablen hinzufügen
5. Deploy!

### Fly.io

```bash
fly launch
fly deploy
```

## 🔒 Sicherheit

- Ändere das Standard-Passwort nach dem ersten Login
- Verwende HTTPS in Produktion
- Setze `SESSION_SECRET` in `.env` auf einen sicheren Wert
- Verwende App-Passwörter für E-Mail-Versand

## 🆘 Troubleshooting

**Docker-Container startet nicht:**
```bash
docker compose logs
docker compose down
docker compose up --build
```

**E-Mail-Versand funktioniert nicht:**
- Prüfe `.env` Konfiguration
- Bei Gmail: App-Passwort verwenden
- Prüfe Firewall/Ports

**ZIP-Upload schlägt fehl:**
- Prüfe, ob ZIP genau 3 CSV-Dateien enthält
- Dateinamen müssen "phishing", "user" und "company" enthalten

## 📝 Entwicklung

```bash
git add .
git commit -m "Deine Änderung"
git push
```

Jeder Push zu GitHub triggert automatisches Deployment (wenn konfiguriert).

## 📄 Lizenz

MIT License - Intelego Awareness Tool © 2026
