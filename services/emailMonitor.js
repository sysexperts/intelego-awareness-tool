const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');
const db = require('../database');
const { processZipFile } = require('./zipProcessor');
const { analyzePhishingData } = require('./phishingAnalyzer');
const { generatePDFReport } = require('./pdfGenerator');
const { sendReportEmail } = require('./emailService');
const config = require('../config');

let monitoringInterval = null;
let isMonitoring = false;

// Start email monitoring
function start() {
  if (isMonitoring) {
    console.log('E-Mail-Monitoring läuft bereits');
    return;
  }
  
  db.get('SELECT * FROM email_settings WHERE id = 1 AND monitoring_enabled = 1', (err, settings) => {
    if (err || !settings) {
      console.log('E-Mail-Monitoring nicht aktiviert oder keine Einstellungen vorhanden');
      return;
    }
    
    isMonitoring = true;
    console.log('E-Mail-Monitoring gestartet');
    
    // Sofort beim Start prüfen
    checkForNewEmails(settings);
    
    // Dann regelmäßig prüfen
    const intervalMs = (settings.check_interval || 15) * 60 * 1000;
    monitoringInterval = setInterval(() => {
      checkForNewEmails(settings);
    }, intervalMs);
  });
}

// Stop email monitoring
function stop() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  isMonitoring = false;
  console.log('E-Mail-Monitoring gestoppt');
}

// Check for new emails
async function checkForNewEmails(settings) {
  console.log('Prüfe E-Mail-Postfach auf neue ZIP-Dateien...');
  
  const imap = new Imap({
    user: settings.email_username,
    password: settings.email_password,
    host: settings.imap_host,
    port: settings.imap_port,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  });
  
  imap.once('ready', () => {
    imap.openBox(settings.monitoring_folder || 'INBOX', false, (err, box) => {
      if (err) {
        console.error('Fehler beim Öffnen des Postfachs:', err);
        imap.end();
        return;
      }
      
      // Suche nach ungelesenen E-Mails mit ZIP-Anhängen
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT', ''],
        struct: true
      };
      
      imap.search(searchCriteria, (err, results) => {
        if (err) {
          console.error('Fehler bei der E-Mail-Suche:', err);
          imap.end();
          return;
        }
        
        if (!results || results.length === 0) {
          console.log('Keine neuen E-Mails gefunden');
          imap.end();
          updateLastCheck();
          return;
        }
        
        console.log(`${results.length} neue E-Mail(s) gefunden`);
        
        const fetch = imap.fetch(results, fetchOptions);
        
        fetch.on('message', (msg, seqno) => {
          let buffer = '';
          let attributes = null;
          
          msg.on('body', (stream, info) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
          });
          
          msg.once('attributes', (attrs) => {
            attributes = attrs;
          });
          
          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(buffer);
              await processEmail(parsed, attributes, imap);
            } catch (error) {
              console.error('Fehler beim Verarbeiten der E-Mail:', error);
            }
          });
        });
        
        fetch.once('error', (err) => {
          console.error('Fetch-Fehler:', err);
        });
        
        fetch.once('end', () => {
          console.log('E-Mail-Prüfung abgeschlossen');
          imap.end();
          updateLastCheck();
        });
      });
    });
  });
  
  imap.once('error', (err) => {
    console.error('IMAP-Fehler:', err);
  });
  
  imap.connect();
}

// Process individual email
async function processEmail(email, attributes, imap) {
  console.log('Verarbeite E-Mail:', email.subject);
  
  // Prüfe ob E-Mail ZIP-Anhänge hat
  if (!email.attachments || email.attachments.length === 0) {
    console.log('Keine Anhänge gefunden');
    return;
  }
  
  const zipAttachments = email.attachments.filter(att => 
    att.filename && att.filename.toLowerCase().endsWith('.zip')
  );
  
  if (zipAttachments.length === 0) {
    console.log('Keine ZIP-Anhänge gefunden');
    return;
  }
  
  console.log(`${zipAttachments.length} ZIP-Anhang(e) gefunden`);
  
  // Identifiziere Kunde anhand E-Mail-Absender oder Betreff
  const customer = await identifyCustomer(email);
  
  if (!customer) {
    console.log('Kunde konnte nicht identifiziert werden. E-Mail-Absender:', email.from.text);
    // Markiere E-Mail trotzdem als gelesen, um Endlosschleife zu vermeiden
    return;
  }
  
  console.log(`Kunde identifiziert: ${customer.name} (ID: ${customer.id})`);
  
  // Verarbeite jeden ZIP-Anhang
  for (const attachment of zipAttachments) {
    try {
      await processZipAttachment(attachment, customer, email);
    } catch (error) {
      console.error('Fehler beim Verarbeiten des ZIP-Anhangs:', error);
    }
  }
}

// Identify customer from email
async function identifyCustomer(email) {
  return new Promise((resolve, reject) => {
    // Extrahiere E-Mail-Adresse aus "From"
    const fromEmail = email.from.value[0].address.toLowerCase();
    
    // Suche Kunde anhand E-Mail-Adresse
    db.get(
      'SELECT * FROM customers WHERE LOWER(email) = ?',
      [fromEmail],
      (err, customer) => {
        if (err) {
          console.error('Datenbankfehler bei Kundensuche:', err);
          return reject(err);
        }
        
        if (customer) {
          return resolve(customer);
        }
        
        // Falls nicht gefunden, versuche anhand Betreff zu identifizieren
        // z.B. "Awareness Report für Intelego GmbH"
        const subject = email.subject || '';
        
        db.all('SELECT * FROM customers', (err, customers) => {
          if (err) {
            return reject(err);
          }
          
          // Suche nach Kundenname im Betreff
          for (const cust of customers) {
            if (subject.toLowerCase().includes(cust.name.toLowerCase())) {
              return resolve(cust);
            }
          }
          
          resolve(null);
        });
      }
    );
  });
}

// Process ZIP attachment
async function processZipAttachment(attachment, customer, email) {
  console.log(`Verarbeite ZIP-Anhang: ${attachment.filename} für Kunde: ${customer.name}`);
  
  // Speichere ZIP temporär
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const tempZipPath = path.join(uploadsDir, `temp_${Date.now()}_${attachment.filename}`);
  fs.writeFileSync(tempZipPath, attachment.content);
  
  try {
    // Analysiere ZIP-Datei
    const csvData = await processZipFile(tempZipPath);
    const analysis = analyzePhishingData(csvData);
    
    // Generiere PDF
    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pdfFilename = `report_${customer.id}_${timestamp}.pdf`;
    const pdfPath = path.join(reportsDir, pdfFilename);
    
    await generatePDFReport(analysis, customer, pdfPath);
    
    // Speichere Report in Datenbank
    const reportId = await saveReport(customer.id, analysis, pdfPath);
    
    // Sende E-Mail an support@intelego.de
    const emailSubject = `Monatlicher Hornetsecurity Awareness Reporting für ${customer.name}`;
    await sendReportEmail(customer.name, pdfPath, 'support@intelego.de');
    
    // Markiere E-Mail als verarbeitet in DB
    db.run(
      'UPDATE reports SET email_sent = 1 WHERE id = ?',
      [reportId],
      (err) => {
        if (err) {
          console.error('Fehler beim Aktualisieren des Report-Status:', err);
        }
      }
    );
    
    console.log(`✓ ZIP-Datei erfolgreich verarbeitet für ${customer.name}`);
    
  } catch (error) {
    console.error('Fehler beim Verarbeiten der ZIP-Datei:', error);
    throw error;
  } finally {
    // Lösche temporäre ZIP-Datei
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }
  }
}

// Save report to database
function saveReport(customerId, analysis, pdfPath) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO reports (customer_id, total_scenarios, total_users, click_rate, success_rate, risk_level, pdf_path, email_sent)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        customerId,
        analysis.overview.totalScenarios,
        analysis.overview.totalUsers,
        analysis.overview.clickRate,
        analysis.overview.successRate,
        analysis.overview.riskLevel,
        pdfPath
      ],
      function(err) {
        if (err) {
          return reject(err);
        }
        resolve(this.lastID);
      }
    );
  });
}

// Update last check timestamp
function updateLastCheck() {
  db.run(
    'UPDATE email_settings SET last_check = CURRENT_TIMESTAMP WHERE id = 1',
    (err) => {
      if (err) {
        console.error('Fehler beim Aktualisieren des Last-Check-Timestamps:', err);
      }
    }
  );
}

// Auto-start monitoring on module load if enabled
db.get('SELECT * FROM email_settings WHERE id = 1 AND monitoring_enabled = 1', (err, settings) => {
  if (!err && settings) {
    console.log('E-Mail-Monitoring ist aktiviert - starte automatisch...');
    setTimeout(() => start(), 5000); // 5 Sekunden Verzögerung beim Serverstart
  }
});

module.exports = {
  start,
  stop,
  isMonitoring: () => isMonitoring
};
