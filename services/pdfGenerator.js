const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PRIMARY_COLOR = '#062E3A';
const ACCENT_COLOR = '#F39200';
const GREEN = '#28A745';
const RED = '#DC3545';
const LIGHT_GRAY = '#F8F9FA';
const DARK_GRAY = '#6C757D';

function getRiskColor(riskLevel) {
  if (riskLevel === 'Hoch') return RED;
  if (riskLevel === 'Mittel') return ACCENT_COLOR;
  return GREEN;
}

function drawKPIBox(doc, x, y, width, height, title, value, color = ACCENT_COLOR) {
  doc.rect(x, y, width, height).lineWidth(1).strokeColor(PRIMARY_COLOR).stroke();
  doc.fontSize(10).fillColor(DARK_GRAY).text(title, x + 10, y + 10, { width: width - 20, align: 'center' });
  doc.fontSize(24).fillColor(color).text(value, x + 10, y + 35, { width: width - 20, align: 'center' });
}

function drawTableHeader(doc, headers, x, y, columnWidths) {
  doc.rect(x, y, columnWidths.reduce((a, b) => a + b, 0), 20).fillAndStroke(PRIMARY_COLOR, PRIMARY_COLOR);
  
  let currentX = x;
  headers.forEach((header, i) => {
    doc.fontSize(9).fillColor('#FFFFFF').text(header, currentX + 5, y + 6, { width: columnWidths[i] - 10, align: 'left' });
    currentX += columnWidths[i];
  });
}

function drawTableRow(doc, values, x, y, columnWidths, isAlternate = false) {
  const bgColor = isAlternate ? LIGHT_GRAY : '#FFFFFF';
  doc.rect(x, y, columnWidths.reduce((a, b) => a + b, 0), 18).fillAndStroke(bgColor, PRIMARY_COLOR);
  
  let currentX = x;
  values.forEach((value, i) => {
    doc.fontSize(8).fillColor('#000000').text(String(value), currentX + 5, y + 5, { width: columnWidths[i] - 10, align: 'left' });
    currentX += columnWidths[i];
  });
}

async function generatePDFReport(analysis, customerName, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      const overview = analysis.overview;
      const riskColor = getRiskColor(overview.sicherheitsbewertung);
      
      // 🟦 TITELSEITE
      const logoPath = path.join(__dirname, '..', 'public', 'intelego-logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 200, 50, { width: 200 });
        doc.moveDown(4);
      }
      
      doc.fontSize(28).fillColor(PRIMARY_COLOR).text('Hornetsecurity Phishing Analyse', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(18).fillColor(DARK_GRAY).text('Phishing-Analyse Report', { align: 'center' });
      doc.moveDown(3);
      
      doc.fontSize(12).fillColor('#000000').text(`Kunde: ${customerName}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor(DARK_GRAY).text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, { align: 'center' });
      doc.moveDown(4);
      
      doc.fontSize(14).fillColor(DARK_GRAY).text('Sicherheitsbewertung:', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(36).fillColor(riskColor).text(overview.sicherheitsbewertung.toUpperCase(), { align: 'center' });
      
      // 1️⃣ ÜBERBLICK
      doc.addPage();
      doc.fontSize(20).fillColor(PRIMARY_COLOR).text('1. Überblick');
      doc.moveDown(1);
      
      if (overview.hasCompany) {
        const kpiY = doc.y;
        const kpiWidth = 120;
        const kpiHeight = 70;
        const spacing = 15;
        
        drawKPIBox(doc, 50, kpiY, kpiWidth, kpiHeight, 'Gesamtangriffe', overview.attacksSent.toString(), PRIMARY_COLOR);
        drawKPIBox(doc, 50 + kpiWidth + spacing, kpiY, kpiWidth, kpiHeight, 'Erfolgsquote', overview.erfolgsquote + '%', riskColor);
        drawKPIBox(doc, 50 + (kpiWidth + spacing) * 2, kpiY, kpiWidth, kpiHeight, 'Klickrate', overview.gesamtKlickrate + '%', ACCENT_COLOR);
        drawKPIBox(doc, 50 + (kpiWidth + spacing) * 3, kpiY, kpiWidth, kpiHeight, 'Meldequote', overview.meldequote + '%', GREEN);
        
        doc.y = kpiY + kpiHeight + 30;
        
        doc.fontSize(11).fillColor('#000000').text(
          `Basierend auf der Erfolgsquote von ${overview.erfolgsquote}% der Phishing-Angriffe wird die Sicherheitslage als ${overview.sicherheitsbewertung.toUpperCase()} eingestuft.`,
          { align: 'justify' }
        );
      }
      
      // 2️⃣ SZENARIEN
      if (overview.hasScenarios && analysis.topScenarios.length > 0) {
        doc.addPage();
        doc.fontSize(20).fillColor(PRIMARY_COLOR).text('2. Szenarien');
        doc.moveDown(1);
        
        doc.fontSize(14).fillColor(PRIMARY_COLOR).text('Top 3 gefährlichste Szenarien');
        doc.moveDown(0.5);
        
        const tableY = doc.y;
        const columnWidths = [60, 200, 80, 80];
        
        drawTableHeader(doc, ['Szenario-ID', 'Beschreibung', 'Angriffe', 'Erfolgsquote'], 50, tableY, columnWidths);
        
        let currentY = tableY + 20;
        analysis.topScenarios.forEach((scenario, index) => {
          drawTableRow(doc, [
            scenario.scenarioId,
            scenario.description.substring(0, 50) + (scenario.description.length > 50 ? '...' : ''),
            scenario.attacksSent,
            scenario.successRate + '%'
          ], 50, currentY, columnWidths, index % 2 === 1);
          currentY += 18;
        });
        
        doc.y = currentY + 20;
        
        if (analysis.topPsychFactors.length > 0) {
          doc.fontSize(14).fillColor(PRIMARY_COLOR).text('Häufigste psychologische Faktoren');
          doc.moveDown(0.5);
          
          analysis.topPsychFactors.forEach((item, index) => {
            doc.fontSize(10).fillColor('#000000').text(`${index + 1}. ${item.factor} (${item.count} Vorkommen)`);
          });
        }
      }
      
      // 3️⃣ BENUTZERVERHALTEN (ÜBERSICHT)
      if (overview.hasUsers) {
        doc.addPage();
        doc.fontSize(20).fillColor(PRIMARY_COLOR).text('3. Benutzerverhalten (Übersicht)');
        doc.moveDown(1);
        
        const kpiY = doc.y;
        const kpiWidth = 240;
        const kpiHeight = 70;
        
        drawKPIBox(doc, 50, kpiY, kpiWidth, kpiHeight, 'Benutzer mit Klicks', overview.vulnerableUsers.toString(), ACCENT_COLOR);
        drawKPIBox(doc, 50 + kpiWidth + 15, kpiY, kpiWidth, kpiHeight, 'Anteil an allen Benutzern', overview.vulnerableUsersPercent + '%', riskColor);
        
        doc.y = kpiY + kpiHeight + 30;
        
        if (analysis.levelData.some(l => l.employees > 0)) {
          doc.fontSize(14).fillColor(PRIMARY_COLOR).text('Klickrate nach Level');
          doc.moveDown(0.5);
          
          const tableY = doc.y;
          const columnWidths = [80, 120, 120, 100];
          
          drawTableHeader(doc, ['Level', 'Angriffe gesendet', 'Erfolgreiche', 'Erfolgsquote'], 50, tableY, columnWidths);
          
          let currentY = tableY + 20;
          analysis.levelData.forEach((level, index) => {
            if (level.employees > 0 || level.attacksSent > 0) {
              drawTableRow(doc, [
                'Level ' + level.level,
                level.attacksSent,
                level.attacksSuccessful,
                level.clickRate + '%'
              ], 50, currentY, columnWidths, index % 2 === 1);
              currentY += 18;
            }
          });
        }
      }
      
      // 4️⃣ DETAILLIERTE BENUTZERANALYSE
      if (overview.hasUsers && analysis.topVulnerableUsers.length > 0) {
        doc.addPage();
        doc.fontSize(20).fillColor(PRIMARY_COLOR).text('4. Detaillierte Benutzeranalyse');
        doc.moveDown(1);
        
        doc.fontSize(14).fillColor(PRIMARY_COLOR).text('Top anfälligste Benutzer');
        doc.moveDown(0.5);
        
        const tableY = doc.y;
        const columnWidths = [40, 50, 50, 50, 50, 60, 60];
        
        drawTableHeader(doc, ['ID', 'Level', 'Gesendet', 'Erfolg', 'Klicks', 'Trainings', 'Anfälligkeit'], 50, tableY, columnWidths);
        
        let currentY = tableY + 20;
        analysis.topVulnerableUsers.slice(0, 10).forEach((user, index) => {
          drawTableRow(doc, [
            user.id.toString().substring(0, 8),
            user.level,
            user.sent,
            user.successful,
            user.clicked,
            user.trainingsCompleted,
            user.vulnerability + '%'
          ], 50, currentY, columnWidths, index % 2 === 1);
          currentY += 18;
          
          if (currentY > 700) {
            doc.addPage();
            doc.fontSize(14).fillColor(PRIMARY_COLOR).text('Top anfälligste Benutzer (Fortsetzung)');
            doc.moveDown(0.5);
            currentY = doc.y;
            drawTableHeader(doc, ['ID', 'Level', 'Gesendet', 'Erfolg', 'Klicks', 'Trainings', 'Anfälligkeit'], 50, currentY, columnWidths);
            currentY += 20;
          }
        });
        
        doc.y = currentY + 20;
        
        doc.fontSize(14).fillColor(PRIMARY_COLOR).text('Benutzer nach Trainingsstand');
        doc.moveDown(0.5);
        
        doc.fontSize(10).fillColor('#000000');
        doc.text(`Trainings abgeschlossen: ${overview.trainingsCompleted}`);
        doc.text(`In Bearbeitung: ${overview.trainingsStarted}`);
        doc.text(`Nicht gestartet: ${overview.trainingsNotStarted}`);
        doc.text(`Ø Trainings pro Benutzer: ${overview.avgTrainingsPerUser}`);
        
        doc.moveDown(1);
        
        if (analysis.levelStats.length > 0) {
          doc.fontSize(14).fillColor(PRIMARY_COLOR).text('Benutzerverteilung nach Level');
          doc.moveDown(0.5);
          
          const tableY2 = doc.y;
          const columnWidths2 = [80, 120, 140, 140];
          
          drawTableHeader(doc, ['Level', 'Anzahl Benutzer', 'Ø erfolgreiche Angriffe', 'Ø Trainings'], 50, tableY2, columnWidths2);
          
          let currentY2 = tableY2 + 20;
          analysis.levelStats.forEach((stat, index) => {
            drawTableRow(doc, [
              stat.level,
              stat.userCount,
              stat.avgSuccessful,
              stat.avgTrainings
            ], 50, currentY2, columnWidths2, index % 2 === 1);
            currentY2 += 18;
          });
        }
      }
      
      // 5️⃣ DETAILLIERTE SZENARIO-ANALYSE
      if (overview.hasScenarios && analysis.exploitTypeAnalysis.length > 0) {
        doc.addPage();
        doc.fontSize(20).fillColor(PRIMARY_COLOR).text('5. Detaillierte Szenario-Analyse');
        doc.moveDown(1);
        
        doc.fontSize(14).fillColor(PRIMARY_COLOR).text('Analyse nach Angriffstyp');
        doc.moveDown(0.5);
        
        const tableY = doc.y;
        const columnWidths = [120, 80, 100, 100, 100];
        
        drawTableHeader(doc, ['Angriffstyp', 'Szenarien', 'Ø Erfolgsrate', 'Angriffe', 'Erfolgreich'], 50, tableY, columnWidths);
        
        let currentY = tableY + 20;
        analysis.exploitTypeAnalysis.forEach((type, index) => {
          drawTableRow(doc, [
            type.type,
            type.scenarioCount,
            type.avgSuccessRate + '%',
            type.totalAttacks,
            type.successfulAttacks
          ], 50, currentY, columnWidths, index % 2 === 1);
          currentY += 18;
        });
        
        doc.y = currentY + 20;
        
        doc.fontSize(14).fillColor(PRIMARY_COLOR).text('Alle Szenarien im Detail');
        doc.moveDown(0.5);
        
        const tableY2 = doc.y;
        const columnWidths2 = [40, 80, 40, 50, 40, 40, 40, 40];
        
        drawTableHeader(doc, ['ID', 'Typ', 'Level', 'Erfolg%', 'Klicks', 'Logins', 'Dateien', 'Makros'], 50, tableY2, columnWidths2);
        
        let currentY2 = tableY2 + 20;
        analysis.scenarioStats.forEach((scenario, index) => {
          if (currentY2 > 700) {
            doc.addPage();
            doc.fontSize(14).fillColor(PRIMARY_COLOR).text('Alle Szenarien im Detail (Fortsetzung)');
            doc.moveDown(0.5);
            currentY2 = doc.y;
            drawTableHeader(doc, ['ID', 'Typ', 'Level', 'Erfolg%', 'Klicks', 'Logins', 'Dateien', 'Makros'], 50, currentY2, columnWidths2);
            currentY2 += 20;
          }
          
          drawTableRow(doc, [
            scenario.scenarioId.toString().substring(0, 8),
            scenario.exploitType.substring(0, 15),
            scenario.level,
            scenario.successRate + '%',
            scenario.attacksClicked,
            scenario.attacksLogins,
            scenario.attacksFilesOpened,
            scenario.attacksMacrosExecuted
          ], 50, currentY2, columnWidths2, index % 2 === 1);
          currentY2 += 18;
        });
      }
      
      // 6️⃣ TRAINING-EFFEKTIVITÄT
      if (overview.hasUsers && analysis.trainingEffectiveness) {
        doc.addPage();
        doc.fontSize(20).fillColor(PRIMARY_COLOR).text('6. Training-Effektivität');
        doc.moveDown(1);
        
        if (analysis.levelStats.length > 0) {
          doc.fontSize(14).fillColor(PRIMARY_COLOR).text('Trainingsabschluss nach Level');
          doc.moveDown(0.5);
          
          const tableY = doc.y;
          const columnWidths = [60, 80, 90, 80, 90, 100];
          
          drawTableHeader(doc, ['Level', 'Benutzer', 'Abgeschl.', 'Gestartet', 'Nicht gest.', 'Ø Trainings'], 50, tableY, columnWidths);
          
          let currentY = tableY + 20;
          analysis.levelStats.forEach((stat, index) => {
            drawTableRow(doc, [
              stat.level,
              stat.userCount,
              '-',
              '-',
              '-',
              stat.avgTrainings
            ], 50, currentY, columnWidths, index % 2 === 1);
            currentY += 18;
          });
          
          doc.y = currentY + 20;
        }
        
        doc.fontSize(14).fillColor(PRIMARY_COLOR).text('Korrelation: Training vs. Anfälligkeit');
        doc.moveDown(0.5);
        
        const kpiY = doc.y;
        const kpiWidth = 240;
        const kpiHeight = 80;
        
        drawKPIBox(doc, 50, kpiY, kpiWidth, kpiHeight, 
          `Benutzer MIT Training (${analysis.trainingEffectiveness.withTraining.users})`, 
          analysis.trainingEffectiveness.withTraining.successRate + '%', GREEN);
        
        drawKPIBox(doc, 50 + kpiWidth + 15, kpiY, kpiWidth, kpiHeight, 
          `Benutzer OHNE Training (${analysis.trainingEffectiveness.withoutTraining.users})`, 
          analysis.trainingEffectiveness.withoutTraining.successRate + '%', RED);
        
        doc.y = kpiY + kpiHeight + 20;
        
        const diff = analysis.trainingEffectiveness.withoutTraining.successRate - analysis.trainingEffectiveness.withTraining.successRate;
        
        doc.fontSize(11).fillColor('#000000').text(
          `Benutzer mit abgeschlossenen Trainings zeigen eine um ${Math.abs(diff).toFixed(1)} Prozentpunkte ${diff > 0 ? 'niedrigere' : 'höhere'} Erfolgsquote bei Phishing-Angriffen.`,
          { align: 'justify' }
        );
      }
      
      // 7️⃣ FAZIT
      doc.addPage();
      doc.fontSize(20).fillColor(PRIMARY_COLOR).text('7. Fazit');
      doc.moveDown(1);
      
      doc.fontSize(14).fillColor(DARK_GRAY).text('Sicherheitslage:', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(32).fillColor(riskColor).text(overview.sicherheitsbewertung.toUpperCase(), { align: 'center' });
      doc.moveDown(2);
      
      doc.fontSize(14).fillColor(PRIMARY_COLOR).text('Handlungsempfehlungen');
      doc.moveDown(0.5);
      
      doc.fontSize(11).fillColor('#000000');
      
      if (overview.sicherheitsbewertung === 'Hoch') {
        doc.text('• DRINGEND: Sofortige Durchführung von Security-Awareness-Trainings für alle Mitarbeiter');
        doc.text('• Regelmäßige Phishing-Simulationen zur Sensibilisierung (mindestens monatlich)');
        doc.text('• Implementierung technischer Schutzmaßnahmen (E-Mail-Filter, Warnhinweise)');
        doc.text('• Etablierung eines klaren Meldeprozesses für verdächtige E-Mails');
        doc.text('• Level-basierte Schulungen mit Fokus auf besonders anfällige Gruppen');
      } else if (overview.sicherheitsbewertung === 'Mittel') {
        doc.text('• Fortführung regelmäßiger Security-Awareness-Schulungen (quartalsweise)');
        doc.text('• Regelmäßige Phishing-Simulationen zur Sensibilisierung');
        doc.text('• Verbesserung der Meldekultur durch Incentivierung');
        doc.text('• Technische Schutzmaßnahmen evaluieren und implementieren');
        doc.text('• Level-basierte Schulungen für besonders anfällige Bereiche');
      } else {
        doc.text('• Aufrechterhaltung des aktuellen Schulungsniveaus');
        doc.text('• Kontinuierliche Phishing-Simulationen zur Wachsamkeit (halbjährlich)');
        doc.text('• Positive Verstärkung des guten Meldeverhaltens');
        doc.text('• Meldesysteme weiter stärken und bekannt machen');
        doc.text('• Best-Practice-Sharing zwischen den Sicherheitslevels');
      }
      
      doc.moveDown(3);
      doc.fontSize(9).fillColor(DARK_GRAY).text(
        'Dieser Report wurde automatisch generiert und enthält ausschließlich aggregierte, anonymisierte Daten.',
        { align: 'center' }
      );
      doc.text('Hornetsecurity Phishing Analyse © 2026', { align: 'center' });
      
      doc.end();
      
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generatePDFReport };
