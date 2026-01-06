const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generatePDF(analysis, customerName, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(outputPath);
      
      doc.pipe(stream);
      
      const primaryColor = '#2C3E50';
      const accentColor = '#3498DB';
      const dangerColor = '#E74C3C';
      const warningColor = '#F39C12';
      const successColor = '#27AE60';
      
      function getRiskColor(riskLevel) {
        switch(riskLevel) {
          case 'Kritisch': return dangerColor;
          case 'Hoch': return warningColor;
          case 'Mittel': return '#F1C40F';
          case 'Niedrig': return successColor;
          default: return primaryColor;
        }
      }
      
      doc.fontSize(24).fillColor(primaryColor).text('Phishing-Analyse Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#7F8C8D').text(new Date().toLocaleDateString('de-DE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }), { align: 'center' });
      doc.moveDown(2);
      
      doc.fontSize(16).fillColor(primaryColor).text('Kunde', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor('#34495E').text(customerName);
      doc.moveDown(1.5);
      
      doc.fontSize(16).fillColor(primaryColor).text('Übersicht', { underline: true });
      doc.moveDown(0.5);
      
      const overview = analysis.overview;
      const riskColor = getRiskColor(overview.riskLevel);
      
      doc.fontSize(12).fillColor('#34495E');
      doc.text(`Gesamtanzahl Szenarien: ${overview.totalScenarios}`);
      doc.text(`Gesamtanzahl Benutzer: ${overview.totalUsers}`);
      doc.text(`Klickrate: ${overview.clickRate}%`);
      doc.text(`Erfolgsquote: ${overview.successRate}%`);
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor(riskColor).text(`Risikostufe: ${overview.riskLevel}`, { bold: true });
      doc.moveDown(1.5);
      
      doc.fontSize(16).fillColor(primaryColor).text('Detaillierte Statistiken', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#34495E');
      doc.text(`Gesamt Klicks: ${overview.totalClicks}`);
      doc.text(`Login-Versuche: ${overview.totalLogins}`);
      doc.text(`Datei-Öffnungen: ${overview.totalFileOpens}`);
      doc.text(`Makro-Ausführungen: ${overview.totalMacroExecutions}`);
      doc.text(`Als Phishing gemeldet: ${overview.totalReported}`);
      doc.moveDown(1.5);
      
      doc.addPage();
      
      doc.fontSize(16).fillColor(primaryColor).text('Top 3 Erfolgreichste Phishing-Szenarien', { underline: true });
      doc.moveDown(1);
      
      analysis.topScenarios.forEach((scenario, index) => {
        doc.fontSize(14).fillColor(accentColor).text(`${index + 1}. ${scenario.name}`);
        doc.fontSize(11).fillColor('#34495E');
        doc.text(`   Erfolgsquote: ${scenario.successRate}%`);
        doc.text(`   Klicks: ${scenario.clicks} | Logins: ${scenario.logins}`);
        doc.text(`   Datei-Öffnungen: ${scenario.fileOpens} | Makros: ${scenario.macroExecutions}`);
        doc.text(`   Psychologischer Faktor: ${scenario.psychologicalFactor}`);
        doc.moveDown(1);
      });
      
      doc.moveDown(1);
      doc.fontSize(16).fillColor(primaryColor).text('Häufigste Psychologische Faktoren', { underline: true });
      doc.moveDown(0.5);
      
      analysis.topFactors.forEach((item, index) => {
        doc.fontSize(12).fillColor('#34495E');
        doc.text(`${index + 1}. ${item.factor} (${item.count} Szenarien)`);
      });
      
      doc.moveDown(1.5);
      doc.fontSize(16).fillColor(primaryColor).text('Meldeverhalten', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#34495E');
      doc.text(`Gemeldete Phishing-Versuche: ${analysis.reportedVsSuccessful.reported}`);
      doc.text(`Erfolgreiche Angriffe: ${analysis.reportedVsSuccessful.successful}`);
      doc.text(`Meldequote: ${analysis.reportedVsSuccessful.ratio}%`);
      
      doc.addPage();
      
      doc.fontSize(16).fillColor(primaryColor).text('Awareness-Status', { underline: true });
      doc.moveDown(1);
      
      let awarenessText = '';
      if (overview.riskLevel === 'Kritisch') {
        awarenessText = 'Das Sicherheitsbewusstsein weist erhebliche Schwächen auf. Ein Großteil der Benutzer ist anfällig für Phishing-Angriffe.';
      } else if (overview.riskLevel === 'Hoch') {
        awarenessText = 'Das Sicherheitsbewusstsein benötigt dringend Verbesserung. Viele Benutzer fallen auf Phishing-Versuche herein.';
      } else if (overview.riskLevel === 'Mittel') {
        awarenessText = 'Das Sicherheitsbewusstsein ist durchschnittlich. Es besteht Verbesserungspotenzial durch gezielte Schulungen.';
      } else {
        awarenessText = 'Das Sicherheitsbewusstsein ist gut entwickelt. Die Benutzer zeigen angemessenes Verhalten bei Phishing-Versuchen.';
      }
      
      doc.fontSize(12).fillColor('#34495E').text(awarenessText, { align: 'justify' });
      doc.moveDown(2);
      
      doc.fontSize(16).fillColor(primaryColor).text('Handlungsempfehlungen', { underline: true });
      doc.moveDown(1);
      
      doc.fontSize(12).fillColor('#34495E');
      
      if (overview.successRate > 50) {
        doc.text('• Sofortige Durchführung von Security-Awareness-Trainings');
        doc.text('• Regelmäßige Phishing-Simulationen zur Sensibilisierung');
        doc.text('• Implementierung technischer Schutzmaßnahmen (E-Mail-Filter, Warnhinweise)');
        doc.text('• Etablierung eines klaren Meldeprozesses für verdächtige E-Mails');
      } else if (overview.successRate > 30) {
        doc.text('• Fortführung regelmäßiger Security-Awareness-Schulungen');
        doc.text('• Fokus auf die häufigsten psychologischen Angriffsvektoren');
        doc.text('• Verbesserung der Meldekultur durch Incentivierung');
        doc.text('• Gezielte Nachschulungen für besonders anfällige Bereiche');
      } else {
        doc.text('• Aufrechterhaltung des aktuellen Schulungsniveaus');
        doc.text('• Kontinuierliche Phishing-Simulationen zur Wachsamkeit');
        doc.text('• Positive Verstärkung des guten Meldeverhaltens');
        doc.text('• Anpassung der Szenarien an neue Bedrohungen');
      }
      
      doc.moveDown(3);
      doc.fontSize(10).fillColor('#95A5A6').text('Dieser Report wurde automatisch generiert und enthält ausschließlich aggregierte, anonymisierte Daten.', { align: 'center' });
      doc.text('Intelego Awareness Tool © 2026', { align: 'center' });
      
      doc.end();
      
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
      
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generatePDF };
