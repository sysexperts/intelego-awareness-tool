# 🐝 Hornet Awareness Tool

Eine einfache, Docker-basierte Webanwendung.

## 📋 Voraussetzungen

- Docker Desktop installiert
- Git installiert
- Node.js (optional, nur für lokale Entwicklung ohne Docker)

## 🚀 Schnellstart

### Mit Docker (Empfohlen)

1. **Repository klonen oder öffnen**
   ```bash
   cd "G:/Meine Ablage/8 - Intelego Projekte/Hornet Awareness Tool"
   ```

2. **Docker Container starten**
   ```bash
   docker-compose up --build
   ```

3. **App öffnen**
   - Öffne deinen Browser: http://localhost:3000

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
   - Öffne deinen Browser: http://localhost:3000

## 📦 Deployment

### GitHub Integration

1. **Git Repository initialisieren**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Mit GitHub verbinden**
   ```bash
   git remote add origin https://github.com/DEIN-USERNAME/hornet-awareness-tool.git
   git branch -M main
   git push -u origin main
   ```

### Deployment Optionen

- **Railway.app**: Verbinde dein GitHub Repo
- **Render.com**: Automatisches Deployment via GitHub
- **Heroku**: Container Registry nutzen
- **DigitalOcean**: App Platform mit GitHub Integration

## 🛠️ Entwicklung

### Änderungen vornehmen

1. Bearbeite die Dateien
2. Committe deine Änderungen:
   ```bash
   git add .
   git commit -m "Beschreibung der Änderung"
   git push
   ```

### Projektstruktur

```
.
├── Dockerfile              # Docker-Konfiguration
├── docker-compose.yml      # Docker Compose Setup
├── package.json            # Node.js Dependencies
├── server.js              # Backend Server
├── public/                # Frontend Dateien
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── README.md              # Diese Datei
```

## 📝 Nächste Schritte

1. Passe die App nach deinen Wünschen an
2. Füge neue Features hinzu
3. Committe regelmäßig deine Änderungen
4. Deploye auf einer Plattform deiner Wahl

## 🆘 Hilfe

Bei Problemen:
- Prüfe ob Docker läuft: `docker --version`
- Prüfe Logs: `docker-compose logs`
- Stoppe Container: `docker-compose down`
