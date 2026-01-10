const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { processZipFile } = require('../services/zipProcessor');
const { analyzePhishingData } = require('../services/phishingAnalyzer');
const { generatePDFReport } = require('../services/pdfGenerator');
const { sendReportEmail } = require('../services/emailService');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
const reportsDir = path.join(__dirname, '../reports');

[uploadDir, reportsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
      cb(null, true);
    } else {
      cb(new Error('Nur ZIP-Dateien sind erlaubt'));
    }
  }
});

router.post('/upload', upload.single('zipfile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }
    
    const { customerId, recipientEmail } = req.body;
    
    if (!customerId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Kunden-ID erforderlich' });
    }
    
    const customer = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!customer) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Kunde nicht gefunden' });
    }
    
    const csvData = await processZipFile(req.file.path);
    
    const analysis = analyzePhishingData(csvData);
    
    const pdfFilename = `Report_${customer.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const pdfPath = path.join(reportsDir, pdfFilename);
    
    await generatePDFReport(analysis, customer, pdfPath);
    
    let emailSent = false;
    if (recipientEmail && recipientEmail.trim() !== '') {
      const emailResult = await sendReportEmail(customer.name, pdfPath, recipientEmail);
      emailSent = emailResult.sent;
    }
    
    const reportId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO reports (
          customer_id, total_scenarios, total_users, click_rate, 
          success_rate, risk_level, pdf_path, email_sent, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        customerId,
        analysis.overview.totalScenarios,
        analysis.overview.totalUsers,
        analysis.overview.gesamtKlickrate,
        analysis.overview.erfolgsquote,
        analysis.overview.sicherheitsbewertung,
        pdfPath,
        emailSent ? 1 : 0,
        'manual'
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    for (const scenario of analysis.scenarioStats) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO scenario_stats (
            report_id, scenario_name, clicks, logins, file_opens, 
            macro_executions, reported, success_rate, psychological_factor
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          reportId,
          scenario.description,
          scenario.attacksClicked,
          scenario.attacksLogins,
          scenario.attacksFilesOpened,
          scenario.attacksMacrosExecuted,
          scenario.attacksReported,
          scenario.successRate,
          scenario.psychologicalFactors
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      reportId,
      analysis,
      pdfPath: `/api/reports/download/${reportId}`,
      emailSent
    });
    
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Upload-Fehler:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', (req, res) => {
  db.all(`
    SELECT r.*, c.name as customer_name 
    FROM reports r 
    JOIN customers c ON r.customer_id = c.id 
    ORDER BY r.upload_date DESC
  `, (err, reports) => {
    if (err) {
      return res.status(500).json({ error: 'Datenbankfehler' });
    }
    res.json(reports);
  });
});

router.get('/download/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM reports WHERE id = ?', [id], (err, report) => {
    if (err) {
      return res.status(500).json({ error: 'Datenbankfehler' });
    }
    
    if (!report) {
      return res.status(404).json({ error: 'Report nicht gefunden' });
    }
    
    if (!fs.existsSync(report.pdf_path)) {
      return res.status(404).json({ error: 'PDF-Datei nicht gefunden' });
    }
    
    res.download(report.pdf_path);
  });
});

router.get('/:id/details', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT r.*, c.name as customer_name 
    FROM reports r 
    LEFT JOIN customers c ON r.customer_id = c.id 
    WHERE r.id = ?
  `, [id], (err, report) => {
    if (err) {
      return res.status(500).json({ error: 'Datenbankfehler' });
    }
    
    if (!report) {
      return res.status(404).json({ error: 'Report nicht gefunden' });
    }
    
    db.all('SELECT * FROM scenario_stats WHERE report_id = ?', [id], (err, scenarios) => {
      if (err) {
        return res.status(500).json({ error: 'Datenbankfehler' });
      }
      
      res.json({
        ...report,
        scenarios
      });
    });
  });
});

// Assign customer to report
router.post('/:id/assign-customer', (req, res) => {
  const { id } = req.params;
  const { customerId } = req.body;
  
  if (!customerId) {
    return res.status(400).json({ error: 'Kunden-ID erforderlich' });
  }
  
  db.run(
    'UPDATE reports SET customer_id = ? WHERE id = ?',
    [customerId, id],
    function(err) {
      if (err) {
        console.error('Fehler beim Zuweisen des Kunden:', err);
        return res.status(500).json({ error: 'Fehler beim Zuweisen des Kunden' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Report nicht gefunden' });
      }
      
      res.json({ success: true, message: 'Kunde erfolgreich zugewiesen' });
    }
  );
});

// Send report email
router.post('/:id/send-email', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT r.*, c.name as customer_name 
    FROM reports r 
    LEFT JOIN customers c ON r.customer_id = c.id 
    WHERE r.id = ?
  `, [id], async (err, report) => {
    if (err) {
      return res.status(500).json({ error: 'Datenbankfehler' });
    }
    
    if (!report) {
      return res.status(404).json({ error: 'Report nicht gefunden' });
    }
    
    if (!report.customer_id) {
      return res.status(400).json({ error: 'Bitte zuerst einen Kunden zuweisen' });
    }
    
    try {
      const emailResult = await sendReportEmail(
        report.customer_name, 
        report.pdf_path, 
        'support@intelego.net'
      );
      
      if (emailResult.sent) {
        db.run(
          'UPDATE reports SET email_sent = 1 WHERE id = ?',
          [id],
          (err) => {
            if (err) {
              console.error('Fehler beim Aktualisieren des E-Mail-Status:', err);
            }
          }
        );
        
        res.json({ 
          success: true, 
          message: `Report erfolgreich an support@intelego.net versendet (Betreff: Monatlicher Hornetsecurity Awareness Reporting für ${report.customer_name})` 
        });
      } else {
        res.status(500).json({ error: 'E-Mail konnte nicht versendet werden' });
      }
    } catch (error) {
      console.error('Fehler beim E-Mail-Versand:', error);
      res.status(500).json({ error: 'Fehler beim E-Mail-Versand: ' + error.message });
    }
  });
});

module.exports = router;
