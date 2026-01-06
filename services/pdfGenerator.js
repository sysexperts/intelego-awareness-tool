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
      const riskColor = getRiskColor(overview.sicherheitsbewertung);
      
      doc.fontSize(12).fillColor('#34495E');
      doc.text(`ESI (Enterprise Security Index): ${overview.esi}`);
      doc.text(`Gesamtanzahl Szenarien: ${overview.totalScenarios}`);
      doc.text(`Gesamtanzahl Benutzer: ${overview.totalUsers}`);
      doc.text(`Anfällige Benutzer: ${overview.vulnerableUsers} (${overview.vulnerableUsersPercent}%)`);
      doc.text(`Gesamtklickrate: ${overview.gesamtKlickrate}%`);
      doc.text(`Erfolgsquote: ${overview.erfolgsquote}%`);
      doc.text(`Meldequote: ${overview.meldequote}%`);
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor(riskColor).text(`Sicherheitsbewertung: ${overview.sicherheitsbewertung}`, { bold: true });
      doc.moveDown(1.5);
      
      doc.fontSize(16).fillColor(primaryColor).text('Detaillierte Statistiken', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#34495E');
      doc.text(`Angriffe gesendet: ${overview.attacksSent}`);
      doc.text(`Angriffe erfolgreich: ${overview.attacksSuccessful}`);
      doc.text(`Angriffe gemeldet: ${overview.attacksReported}`);
      doc.text(`Klicks: ${overview.attacksClicked}`);
      doc.text(`Login-Versuche: ${overview.attacksLogins}`);
      doc.text(`Datei-Öffnungen: ${overview.attacksFilesOpened}`);
      doc.text(`Makro-Ausführungen: ${overview.attacksMacrosExecuted}`);
      doc.moveDown(1);
      doc.text(`E-Trainings abgeschlossen: ${overview.trainingsCompleted}`);
      doc.text(`E-Trainings gestartet: ${overview.trainingsStarted}`);
      doc.text(`E-Trainings nicht gestartet: ${overview.trainingsNotStarted}`);
      doc.moveDown(1.5);
      
      doc.addPage();
      
      doc.fontSize(16).fillColor(primaryColor).text('Top 3 Erfolgreichste Phishing-Szenarien', { underline: true });
      doc.moveDown(1);
      
      analysis.topScenarios.forEach((scenario, index) => {
        doc.fontSize(14).fillColor(accentColor).text(`${index + 1}. ${scenario.description}`);
        doc.fontSize(11).fillColor('#34495E');
        doc.text(`   Szenario-ID: ${scenario.scenarioId}`);
        doc.text(`   Exploit-Typ: ${scenario.exploitType}`);
        doc.text(`   Level: ${scenario.level}`);
        doc.text(`   Erfolgsquote: ${scenario.successRate}%`);
        doc.text(`   Meldequote: ${scenario.reportRate}%`);
        doc.text(`   Angriffe: ${scenario.attacksSent} gesendet, ${scenario.attacksSuccessful} erfolgreich`);
        doc.text(`   Klicks: ${scenario.attacksClicked} | Logins: ${scenario.attacksLogins}`);
        doc.text(`   Datei-Öffnungen: ${scenario.attacksFilesOpened} | Makros: ${scenario.attacksMacrosExecuted}`);
        doc.text(`   Psychologische Faktoren: ${scenario.psychologicalFactors}`);
        doc.moveDown(1);
      });
      
      doc.moveDown(1);
      doc.fontSize(16).fillColor(primaryColor).text('Top 5 Psychologische Faktoren', { underline: true });
      doc.moveDown(0.5);
      
      analysis.topPsychFactors.forEach((item, index) => {
        doc.fontSize(12).fillColor('#34495E');
        doc.text(`${index + 1}. ${item.factor} (${item.count} Vorkommen)`);
      });
      
      doc.moveDown(1.5);
      doc.fontSize(16).fillColor(primaryColor).text('Meldeverhalten', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#34495E');
      doc.text(`Gemeldete Phishing-Versuche: ${analysis.reportedVsSuccessful.reported}`);
      doc.text(`Erfolgreiche Angriffe: ${analysis.reportedVsSuccessful.successful}`);
      doc.text(`Meldequote: ${analysis.reportedVsSuccessful.ratio}%`);
      
      doc.addPage();
      
      doc.fontSize(16).fillColor(primaryColor).text('Klickrate nach Sicherheitslevel', { underline: true });
      doc.moveDown(1);
      
      analysis.levelData.forEach(level => {
        doc.fontSize(12).fillColor(primaryColor).text(`Level ${level.level}:`);
        doc.fontSize(11).fillColor('#34495E');
        doc.text(`   Mitarbeiter: ${level.employees}`);
        doc.text(`   Angriffe gesendet: ${level.attacksSent}`);
        doc.text(`   Angriffe erfolgreich: ${level.attacksSuccessful}`);
        doc.text(`   Angriffe gemeldet: ${level.attacksReported}`);
        doc.text(`   Klickrate: ${level.clickRate}%`);
        doc.moveDown(0.5);
      });
      
      doc.addPage();
      
      doc.fontSize(16).fillColor(primaryColor).text('Awareness-Status', { underline: true });
      doc.moveDown(1);
      
      let awarenessText = '';
      if (overview.sicherheitsbewertung === 'Hoch') {
        awarenessText = 'Das Sicherheitsbewusstsein weist erhebliche Schwächen auf. Ein Großteil der Benutzer ist anfällig für Phishing-Angriffe. Die Erfolgsquote der Angriffe liegt über 50%, was auf dringenden Handlungsbedarf hinweist.';
      } else if (overview.sicherheitsbewertung === 'Mittel') {
        awarenessText = 'Das Sicherheitsbewusstsein ist durchschnittlich entwickelt. Die Erfolgsquote liegt zwischen 30% und 50%. Es besteht Verbesserungspotenzial durch gezielte Schulungen und verstärkte Sensibilisierung.';
      } else {
        awarenessText = 'Das Sicherheitsbewusstsein ist gut entwickelt. Die Erfolgsquote liegt unter 30%. Die Benutzer zeigen angemessenes Verhalten bei Phishing-Versuchen, jedoch sollte das Niveau durch kontinuierliche Schulungen aufrechterhalten werden.';
      }
      
      doc.fontSize(12).fillColor('#34495E').text(awarenessText, { align: 'justify' });
      doc.moveDown(1);
      
      doc.fontSize(12).fillColor('#34495E');
      doc.text(`ESI (Enterprise Security Index): ${overview.esi}`);
      doc.text(`Anfällige Benutzer: ${overview.vulnerableUsersPercent}% der Gesamtbelegschaft`);
      doc.text(`Effektivste psychologische Faktoren: ${overview.mostEffectivePsychFactors}`);
      doc.moveDown(2);
      
      doc.fontSize(16).fillColor(primaryColor).text('Handlungsempfehlungen', { underline: true });
      doc.moveDown(1);
      
      doc.fontSize(12).fillColor('#34495E');
      
      if (overview.sicherheitsbewertung === 'Hoch') {
        doc.text('• DRINGEND: Sofortige Durchführung von Security-Awareness-Trainings für alle Mitarbeiter');
        doc.text('• Fokus auf die identifizierten psychologischen Faktoren: ' + overview.mostEffectivePsychFactors);
        doc.text('• Regelmäßige Phishing-Simulationen zur Sensibilisierung (mindestens monatlich)');
        doc.text('• Implementierung technischer Schutzmaßnahmen (E-Mail-Filter, Warnhinweise)');
        doc.text('• Etablierung eines klaren Meldeprozesses für verdächtige E-Mails');
        doc.text('• Besondere Aufmerksamkeit für Mitarbeiter in höheren Sicherheitslevels');
        doc.text('• Nachschulung der ' + overview.vulnerableUsers + ' anfälligen Benutzer');
      } else if (overview.sicherheitsbewertung === 'Mittel') {
        doc.text('• Fortführung regelmäßiger Security-Awareness-Schulungen (quartalsweise)');
        doc.text('• Fokus auf die häufigsten psychologischen Angriffsvektoren');
        doc.text('• Verbesserung der Meldekultur durch Incentivierung (aktuell: ' + overview.meldequote + '%)');
        doc.text('• Gezielte Nachschulungen für die ' + overview.vulnerableUsers + ' anfälligen Benutzer');
        doc.text('• Analyse der Level-spezifischen Schwachstellen');
        doc.text('• Erhöhung der E-Training-Abschlussquote');
      } else {
        doc.text('• Aufrechterhaltung des aktuellen Schulungsniveaus');
        doc.text('• Kontinuierliche Phishing-Simulationen zur Wachsamkeit (halbjährlich)');
        doc.text('• Positive Verstärkung des guten Meldeverhaltens (Meldequote: ' + overview.meldequote + '%)');
        doc.text('• Anpassung der Szenarien an neue Bedrohungen');
        doc.text('• Weiterhin Fokus auf die effektivsten psychologischen Faktoren');
        doc.text('• Best-Practice-Sharing zwischen den Sicherheitslevels');
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
