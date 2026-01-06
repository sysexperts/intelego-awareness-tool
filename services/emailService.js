const nodemailer = require('nodemailer');
const config = require('../config');

async function sendReportEmail(customerName, pdfPath, recipientEmail) {
  if (!config.email.auth.user || !config.email.auth.pass) {
    console.warn('E-Mail-Konfiguration nicht vollständig. E-Mail wird nicht versendet.');
    return { sent: false, reason: 'E-Mail nicht konfiguriert' };
  }
  
  try {
    const transporter = nodemailer.createTransport(config.email);
    
    const mailOptions = {
      from: config.email.from,
      to: recipientEmail,
      subject: `Phishing-Analyse Report - ${customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2C3E50;">Phishing-Analyse Report</h2>
          <p>Sehr geehrte Damen und Herren,</p>
          <p>anbei erhalten Sie den automatisch generierten Phishing-Analyse Report für <strong>${customerName}</strong>.</p>
          <p>Der Report enthält eine detaillierte Auswertung der durchgeführten Phishing-Simulation sowie Handlungsempfehlungen zur Verbesserung des Security-Awareness-Levels.</p>
          <hr style="border: 1px solid #ecf0f1; margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px;">
            Dieser Report wurde automatisch generiert und enthält ausschließlich aggregierte, anonymisierte Daten.<br>
            Intelego Awareness Tool © 2026
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Phishing_Report_${customerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
          path: pdfPath
        }
      ]
    };
    
    await transporter.sendMail(mailOptions);
    
    return { sent: true };
  } catch (error) {
    console.error('E-Mail-Versand fehlgeschlagen:', error);
    return { sent: false, reason: error.message };
  }
}

module.exports = { sendReportEmail };
