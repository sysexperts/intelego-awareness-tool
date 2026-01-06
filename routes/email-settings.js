const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// GET email settings
router.get('/', authenticateToken, (req, res) => {
  db.get('SELECT * FROM email_settings WHERE id = 1', (err, row) => {
    if (err) {
      console.error('Fehler beim Laden der E-Mail-Einstellungen:', err);
      return res.status(500).json({ error: 'Fehler beim Laden der Einstellungen' });
    }
    
    if (!row) {
      return res.json({
        imapHost: '',
        imapPort: 993,
        emailUsername: '',
        emailPassword: '',
        monitoringFolder: 'INBOX',
        checkInterval: 15,
        monitoringEnabled: false
      });
    }
    
    res.json({
      imapHost: row.imap_host,
      imapPort: row.imap_port,
      emailUsername: row.email_username,
      emailPassword: row.email_password,
      monitoringFolder: row.monitoring_folder,
      checkInterval: row.check_interval,
      monitoringEnabled: row.monitoring_enabled === 1
    });
  });
});

// POST/UPDATE email settings
router.post('/', authenticateToken, (req, res) => {
  const { imapHost, imapPort, emailUsername, emailPassword, monitoringFolder, checkInterval, monitoringEnabled } = req.body;
  
  if (!imapHost || !imapPort || !emailUsername || !emailPassword) {
    return res.status(400).json({ error: 'IMAP-Server, Port, E-Mail und Passwort sind erforderlich' });
  }
  
  db.get('SELECT id FROM email_settings WHERE id = 1', (err, row) => {
    if (err) {
      console.error('Fehler beim Prüfen der Einstellungen:', err);
      return res.status(500).json({ error: 'Datenbankfehler' });
    }
    
    const sql = row 
      ? `UPDATE email_settings SET 
          imap_host = ?, imap_port = ?, email_username = ?, email_password = ?,
          monitoring_folder = ?, check_interval = ?, monitoring_enabled = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = 1`
      : `INSERT INTO email_settings (id, imap_host, imap_port, email_username, email_password, 
          monitoring_folder, check_interval, monitoring_enabled)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [
      imapHost,
      imapPort,
      emailUsername,
      emailPassword,
      monitoringFolder || 'INBOX',
      checkInterval || 15,
      monitoringEnabled ? 1 : 0
    ], function(err) {
      if (err) {
        console.error('Fehler beim Speichern der Einstellungen:', err);
        return res.status(500).json({ error: 'Fehler beim Speichern der Einstellungen' });
      }
      
      // Start or stop email monitoring based on settings
      const emailMonitor = require('../services/emailMonitor');
      if (monitoringEnabled) {
        emailMonitor.start();
      } else {
        emailMonitor.stop();
      }
      
      res.json({ 
        success: true,
        message: 'Einstellungen erfolgreich gespeichert'
      });
    });
  });
});

// POST test email connection
router.post('/test', authenticateToken, async (req, res) => {
  const { imapHost, imapPort, emailUsername, emailPassword, monitoringFolder } = req.body;
  
  if (!imapHost || !imapPort || !emailUsername || !emailPassword) {
    return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
  }
  
  try {
    const Imap = require('imap');
    
    const imap = new Imap({
      user: emailUsername,
      password: emailPassword,
      host: imapHost,
      port: imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });
    
    await new Promise((resolve, reject) => {
      imap.once('ready', () => {
        imap.openBox(monitoringFolder || 'INBOX', true, (err, box) => {
          if (err) {
            imap.end();
            return reject(new Error('Ordner konnte nicht geöffnet werden: ' + err.message));
          }
          
          imap.end();
          resolve();
        });
      });
      
      imap.once('error', (err) => {
        reject(new Error('IMAP-Verbindung fehlgeschlagen: ' + err.message));
      });
      
      imap.connect();
      
      // Timeout nach 10 Sekunden
      setTimeout(() => {
        imap.end();
        reject(new Error('Verbindungs-Timeout'));
      }, 10000);
    });
    
    res.json({ 
      success: true,
      message: 'Verbindung erfolgreich! IMAP-Server ist erreichbar und Authentifizierung war erfolgreich.'
    });
    
  } catch (error) {
    console.error('E-Mail-Verbindungstest fehlgeschlagen:', error);
    res.status(400).json({ 
      error: error.message || 'Verbindung fehlgeschlagen'
    });
  }
});

module.exports = router;
