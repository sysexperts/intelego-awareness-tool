const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PRIMARY_COLOR = '#062E3A';
const ACCENT_COLOR = '#F39200';
const GREEN = '#28A745';
const RED = '#DC3545';
const YELLOW = '#FFC107';
const LIGHT_GRAY = '#F8F9FA';
const DARK_GRAY = '#6C757D';
const WHITE = '#FFFFFF';

function getRiskColor(riskLevel) {
  if (riskLevel === 'Hoch') return RED;
  if (riskLevel === 'Mittel') return ACCENT_COLOR;
  return GREEN;
}

function drawKPIBox(doc, x, y, width, height, title, value, color = ACCENT_COLOR) {
  doc.save();
  doc.roundedRect(x, y, width, height, 8).lineWidth(2).strokeColor(color).stroke();
  doc.fontSize(9).fillColor(DARK_GRAY).text(title, x + 10, y + 15, { width: width - 20, align: 'center' });
  doc.fontSize(28).font('Helvetica-Bold').fillColor(color).text(value, x + 10, y + 35, { width: width - 20, align: 'center' });
  doc.font('Helvetica');
  doc.restore();
}

function drawSectionHeader(doc, title) {
  doc.fontSize(16).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text(title);
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(2).strokeColor(ACCENT_COLOR).stroke();
  doc.moveDown(0.8);
  doc.font('Helvetica');
}

function drawTableHeader(doc, headers, x, y, columnWidths) {
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
  doc.rect(x, y, totalWidth, 25).fillAndStroke(PRIMARY_COLOR, PRIMARY_COLOR);
  
  let currentX = x;
  headers.forEach((header, i) => {
    doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE).text(header, currentX + 8, y + 8, { 
      width: columnWidths[i] - 16, 
      align: 'left' 
    });
    currentX += columnWidths[i];
  });
  doc.font('Helvetica');
}

function drawTableRow(doc, values, x, y, columnWidths, isAlternate = false, bgColor = null) {
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
  const backgroundColor = bgColor || (isAlternate ? LIGHT_GRAY : WHITE);
  doc.rect(x, y, totalWidth, 22).fillAndStroke(backgroundColor, '#DDDDDD');
  
  let currentX = x;
  values.forEach((value, i) => {
    doc.fontSize(9).fillColor('#000000').text(String(value), currentX + 8, y + 6, { 
      width: columnWidths[i] - 16, 
      align: 'left',
      ellipsis: true
    });
    currentX += columnWidths[i];
  });
}

function translateExploitType(type) {
  const translations = {
    'link-login': 'Link mit Login',
    'link-download': 'Link mit Download',
    'attachment-macro': 'Anhang mit Makro',
    'attachment-exe': 'Anhang mit Programm',
    'qr-code': 'QR-Code',
    'phone-call': 'Telefonanruf',
    'sms': 'SMS/Textnachricht'
  };
  return translations[type] || type;
}

function translatePsychFactor(factor) {
  const translations = {
    'fear': 'Angst',
    'urgency': 'Zeitdruck',
    'curiosity': 'Neugier',
    'greed': 'Gier',
    'authority': 'Autorität',
    'trust': 'Vertrauen',
    'helpfulness': 'Hilfsbereitschaft',
    'scarcity': 'Knappheit'
  };
  return translations[factor.toLowerCase()] || factor;
}

async function generatePDFReport(analysis, customerName, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        bufferPages: true
      });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      const overview = analysis.overview;
      const riskColor = getRiskColor(overview.sicherheitsbewertung);
      
      // 🟦 TITELSEITE - Moderner und zentriert
      const logoPath = path.join(__dirname, '..', 'public', 'intelego-logo.png');
      if (fs.existsSync(logoPath)) {
        const logoWidth = 220;
        const logoX = (595.28 - logoWidth) / 2;
        doc.image(logoPath, logoX, 100, { width: logoWidth });
      }
      
      doc.moveDown(9);
      
      // Moderner Titel mit Schatten-Effekt
      doc.fontSize(36).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Phishing-Analyse Report', { align: 'center' });
      doc.moveDown(0.8);
      doc.fontSize(16).font('Helvetica').fillColor(ACCENT_COLOR).text('Security Awareness Auswertung', { align: 'center' });
      doc.moveDown(4);
      
      // Kundeninfo in Box
      const infoBoxY = doc.y;
      const infoBoxWidth = 400;
      const infoBoxX = (595.28 - infoBoxWidth) / 2;
      doc.roundedRect(infoBoxX, infoBoxY, infoBoxWidth, 80, 10).lineWidth(1).strokeColor(DARK_GRAY).stroke();
      
      doc.fontSize(13).fillColor('#000000').text(`Kunde: ${customerName}`, infoBoxX, infoBoxY + 20, { width: infoBoxWidth, align: 'center' });
      doc.fontSize(11).fillColor(DARK_GRAY).text(`Erstellt am: ${new Date().toLocaleDateString('de-DE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, infoBoxX, infoBoxY + 50, { width: infoBoxWidth, align: 'center' });
      
      doc.y = infoBoxY + 100;
      doc.moveDown(2);
      
      doc.fontSize(14).fillColor(DARK_GRAY).text('Sicherheitsbewertung', { align: 'center' });
      doc.moveDown(1);
      
      const riskBoxWidth = 280;
      const riskBoxX = (595.28 - riskBoxWidth) / 2;
      const riskBoxY = doc.y;
      doc.roundedRect(riskBoxX, riskBoxY, riskBoxWidth, 100, 12).lineWidth(4).strokeColor(riskColor).stroke();
      doc.fontSize(48).font('Helvetica-Bold').fillColor(riskColor).text(
        overview.sicherheitsbewertung.toUpperCase(), 
        riskBoxX, 
        riskBoxY + 25, 
        { width: riskBoxWidth, align: 'center' }
      );
      doc.font('Helvetica');
      
      // 1️⃣ ÜBERBLICK - Text UNTER den Statistiken
      doc.addPage();
      drawSectionHeader(doc, '1. Zusammenfassung');
      
      if (overview.hasCompany) {
        const kpiY = doc.y;
        const kpiWidth = 115;
        const kpiHeight = 80;
        const spacing = 12;
        
        // Meldequote verständlicher: "8 von 10 gemeldet (80%)"
        const reportedCount = overview.attacksReported;
        const totalAttacks = overview.attacksSent;
        const reportRatio = totalAttacks > 0 ? `${reportedCount} von ${totalAttacks}` : '0';
        const reportPercent = overview.meldequote;
        
        drawKPIBox(doc, 50, kpiY, kpiWidth, kpiHeight, 'Gesendete Angriffe', overview.attacksSent.toString(), PRIMARY_COLOR);
        drawKPIBox(doc, 50 + kpiWidth + spacing, kpiY, kpiWidth, kpiHeight, 'Erfolgsquote', overview.erfolgsquote + '%', riskColor);
        drawKPIBox(doc, 50 + (kpiWidth + spacing) * 2, kpiY, kpiWidth, kpiHeight, 'Klickrate', overview.gesamtKlickrate + '%', ACCENT_COLOR);
        drawKPIBox(doc, 50 + (kpiWidth + spacing) * 3, kpiY, kpiWidth, kpiHeight, 'Gemeldet', `${reportRatio}\n(${reportPercent}%)`, GREEN);
        
        // Text UNTER den KPI-Boxen
        doc.y = kpiY + kpiHeight + 25;
        
        doc.fontSize(11).fillColor('#000000').text(
          `Bei ${overview.attacksSent} durchgeführten Phishing-Simulationen wurden ${overview.attacksSuccessful} erfolgreiche Angriffe verzeichnet. ` +
          `Dies entspricht einer Erfolgsquote von ${overview.erfolgsquote}%. ${reportedCount} Angriffe wurden von Mitarbeitern gemeldet. ` +
          `Basierend auf dieser Auswertung wird die Sicherheitslage als `,
          { align: 'justify', continued: true }
        );
        doc.fillColor(riskColor).font('Helvetica-Bold').text(overview.sicherheitsbewertung.toUpperCase(), { continued: true });
        doc.fillColor('#000000').font('Helvetica').text(' eingestuft.');
      }
      
      // 2️⃣ SZENARIEN - Ohne Szenario-ID, psychologische Faktoren übersetzt
      if (overview.hasScenarios && analysis.topScenarios.length > 0) {
        doc.addPage();
        drawSectionHeader(doc, '2. Gefährlichste Phishing-Szenarien');
        
        doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Top 3 Szenarien mit höchster Erfolgsquote');
        doc.moveDown(0.5);
        doc.font('Helvetica');
        
        const tableY = doc.y;
        const columnWidths = [320, 80, 95];
        
        drawTableHeader(doc, ['Beschreibung', 'Angriffe', 'Erfolgsquote'], 50, tableY, columnWidths);
        
        let currentY = tableY + 25;
        analysis.topScenarios.forEach((scenario, index) => {
          drawTableRow(doc, [
            scenario.description.substring(0, 70) + (scenario.description.length > 70 ? '...' : ''),
            scenario.attacksSent,
            scenario.successRate + '%'
          ], 50, currentY, columnWidths, index % 2 === 1);
          currentY += 22;
        });
        
        doc.y = currentY + 20;
        
        if (analysis.topPsychFactors.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Häufigste psychologische Trigger');
          doc.moveDown(0.5);
          doc.font('Helvetica');
          
          analysis.topPsychFactors.forEach((item, index) => {
            const translatedFactor = translatePsychFactor(item.factor);
            doc.fontSize(10).fillColor('#000000').text(`${index + 1}. ${translatedFactor} (${item.count} Szenarien)`);
            doc.moveDown(0.3);
          });
        }
      }
      
      // 3️⃣ BENUTZERVERHALTEN - Mit Level-Erklärung
      if (overview.hasUsers) {
        doc.addPage();
        drawSectionHeader(doc, '3. Benutzerverhalten - Übersicht');
        
        const kpiY = doc.y;
        const kpiWidth = 240;
        const kpiHeight = 80;
        
        drawKPIBox(doc, 50, kpiY, kpiWidth, kpiHeight, 'Benutzer mit Klicks auf Phishing', overview.vulnerableUsers.toString(), ACCENT_COLOR);
        drawKPIBox(doc, 50 + kpiWidth + 15, kpiY, kpiWidth, kpiHeight, 'Anteil gefährdeter Benutzer', overview.vulnerableUsersPercent + '%', riskColor);
        
        doc.y = kpiY + kpiHeight + 25;
        
        if (analysis.levelData.some(l => l.employees > 0)) {
          doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Erfolgsquote nach Sicherheitslevel');
          doc.moveDown(0.5);
          doc.font('Helvetica');
          
          const tableY = doc.y;
          const columnWidths = [100, 120, 120, 155];
          
          drawTableHeader(doc, ['Level', 'Gesendete Angriffe', 'Erfolgreiche Angriffe', 'Erfolgsquote'], 50, tableY, columnWidths);
          
          let currentY = tableY + 25;
          analysis.levelData.forEach((level, index) => {
            if (level.employees > 0 || level.attacksSent > 0) {
              drawTableRow(doc, [
                'Level ' + level.level,
                level.attacksSent,
                level.attacksSuccessful,
                level.clickRate + '%'
              ], 50, currentY, columnWidths, index % 2 === 1);
              currentY += 22;
            }
          });
          
          doc.y = currentY + 20;
          
          // Level-Erklärung
          doc.fontSize(11).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Was bedeuten die Sicherheitslevel?');
          doc.moveDown(0.5);
          doc.font('Helvetica').fontSize(10).fillColor(DARK_GRAY);
          doc.text('Level 1: Einstiegslevel - Neue Mitarbeiter ohne Security-Training');
          doc.text('Level 2: Grundkenntnisse - Basis-Schulung absolviert');
          doc.text('Level 3: Fortgeschritten - Regelmäßige Trainings und gutes Bewusstsein');
          doc.text('Level 4: Experte - Hohe Sensibilität und vorbildliches Verhalten');
          doc.text('Level 5: Security Champion - Multiplikator und Vorbild für andere');
        }
      }
      
      // 4️⃣ ANFÄLLIGSTE BENUTZER - Mit Farbmarkierung
      if (overview.hasUsers && analysis.topVulnerableUsers.length > 0) {
        doc.addPage();
        drawSectionHeader(doc, '4. Anfälligste Benutzer - Detailanalyse');
        
        doc.fontSize(11).fillColor(DARK_GRAY).text(
          'Die folgende Tabelle zeigt die Mitarbeiter mit der höchsten Anfälligkeit für Phishing-Angriffe. ' +
          'Rot markierte Benutzer sind besonders gefährdet und sollten prioritär geschult werden.'
        );
        doc.moveDown(1);
        
        const tableY = doc.y;
        const columnWidths = [140, 50, 60, 60, 50, 60, 75];
        
        drawTableHeader(doc, ['E-Mail', 'Level', 'Gesendet', 'Erfolge', 'Klicks', 'Trainings', 'Anfälligkeit'], 50, tableY, columnWidths);
        
        let currentY = tableY + 25;
        analysis.topVulnerableUsers.slice(0, 15).forEach((user, index) => {
          if (currentY > 750) {
            doc.addPage();
            drawSectionHeader(doc, '4. Anfälligste Benutzer - Fortsetzung');
            currentY = doc.y;
            drawTableHeader(doc, ['E-Mail', 'Level', 'Gesendet', 'Erfolge', 'Klicks', 'Trainings', 'Anfälligkeit'], 50, currentY, columnWidths);
            currentY += 25;
          }
          
          // Farbmarkierung: Rot wenn >= 3 erfolgreiche Angriffe, Gelb wenn >= 1
          let rowColor = null;
          if (user.successful >= 3) {
            rowColor = '#FFCCCC'; // Hellrot
          } else if (user.successful >= 1) {
            rowColor = '#FFF9C4'; // Hellgelb
          }
          
          drawTableRow(doc, [
            user.email,
            user.level,
            user.sent,
            user.successful,
            user.clicked,
            user.trainingsCompleted,
            user.vulnerability + '%'
          ], 50, currentY, columnWidths, index % 2 === 1, rowColor);
          currentY += 22;
        });
        
        doc.y = currentY + 20;
        
        doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Trainingsstand der Mitarbeiter');
        doc.moveDown(0.5);
        doc.font('Helvetica');
        
        const trainingY = doc.y;
        const trainingWidth = 160;
        const trainingHeight = 70;
        const trainingSpacing = 10;
        
        drawKPIBox(doc, 50, trainingY, trainingWidth, trainingHeight, 'Trainings abgeschlossen', overview.trainingsCompleted.toString(), GREEN);
        drawKPIBox(doc, 50 + trainingWidth + trainingSpacing, trainingY, trainingWidth, trainingHeight, 'In Bearbeitung', overview.trainingsStarted.toString(), ACCENT_COLOR);
        drawKPIBox(doc, 50 + (trainingWidth + trainingSpacing) * 2, trainingY, trainingWidth, trainingHeight, 'Nicht gestartet', overview.trainingsNotStarted.toString(), RED);
        
        doc.y = trainingY + trainingHeight + 15;
        doc.fontSize(10).fillColor(DARK_GRAY).text(`Durchschnittlich ${overview.avgTrainingsPerUser} Trainings pro Mitarbeiter`);
        
        if (analysis.levelStats.length > 0) {
          doc.moveDown(1.5);
          doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Mitarbeiter-Verteilung nach Level');
          doc.moveDown(0.5);
          doc.font('Helvetica');
          
          const tableY2 = doc.y;
          const columnWidths2 = [100, 130, 180, 135];
          
          drawTableHeader(doc, ['Level', 'Anzahl Mitarbeiter', 'Ø erfolgreiche Angriffe', 'Ø Trainings'], 50, tableY2, columnWidths2);
          
          let currentY2 = tableY2 + 25;
          analysis.levelStats.forEach((stat, index) => {
            drawTableRow(doc, [
              stat.level,
              stat.userCount,
              stat.avgSuccessful,
              stat.avgTrainings
            ], 50, currentY2, columnWidths2, index % 2 === 1);
            currentY2 += 22;
          });
        }
      }
      
      // 5️⃣ ANGRIFFSTYPEN - Zentriert, übersetzt, zusammengefasst
      if (overview.hasScenarios && analysis.exploitTypeAnalysis.length > 0) {
        doc.addPage();
        drawSectionHeader(doc, '5. Angriffstypen - Detailanalyse');
        
        doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Erfolgsquote nach Angriffstyp');
        doc.moveDown(0.5);
        doc.font('Helvetica');
        
        const tableY = doc.y;
        const columnWidths = [180, 80, 110, 90, 85];
        const tableX = 50;
        
        drawTableHeader(doc, ['Angriffstyp', 'Szenarien', 'Ø Erfolgsrate', 'Angriffe', 'Erfolgreich'], tableX, tableY, columnWidths);
        
        let currentY = tableY + 25;
        analysis.exploitTypeAnalysis.forEach((type, index) => {
          drawTableRow(doc, [
            translateExploitType(type.type),
            type.scenarioCount,
            type.avgSuccessRate + '%',
            type.totalAttacks,
            type.successfulAttacks
          ], tableX, currentY, columnWidths, index % 2 === 1);
          currentY += 22;
        });
        
        doc.y = currentY + 25;
        
        // Zusammenfassung statt alle Details
        doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Szenario-Zusammenfassung');
        doc.moveDown(0.5);
        doc.font('Helvetica');
        
        doc.fontSize(10).fillColor(DARK_GRAY).text(
          `Insgesamt wurden ${analysis.scenarioStats.length} verschiedene Phishing-Szenarien getestet. ` +
          `Die durchschnittliche Erfolgsquote über alle Szenarien beträgt ${overview.erfolgsquote}%. ` +
          `Die gefährlichsten Angriffstypen sind oben aufgeführt.`
        );
      }
      
      // 6️⃣ TRAINING-EFFEKTIVITÄT - 0%-Bug behoben, Tabelle ausgerichtet
      if (overview.hasUsers && analysis.trainingEffectiveness) {
        doc.addPage();
        drawSectionHeader(doc, '6. Training-Effektivität');
        
        doc.fontSize(11).fillColor(DARK_GRAY).text(
          'Vergleich der Erfolgsquote bei Phishing-Angriffen zwischen Mitarbeitern mit und ohne abgeschlossene Trainings.'
        );
        doc.moveDown(1.5);
        
        const kpiY = doc.y;
        const kpiWidth = 240;
        const kpiHeight = 90;
        
        const withTrainingRate = analysis.trainingEffectiveness.withTraining.successRate;
        const withoutTrainingRate = analysis.trainingEffectiveness.withoutTraining.successRate;
        
        drawKPIBox(doc, 50, kpiY, kpiWidth, kpiHeight, 
          `Mitarbeiter MIT Training (${analysis.trainingEffectiveness.withTraining.users} Personen)`, 
          withTrainingRate + '%', GREEN);
        
        drawKPIBox(doc, 50 + kpiWidth + 15, kpiY, kpiWidth, kpiHeight, 
          `Mitarbeiter OHNE Training (${analysis.trainingEffectiveness.withoutTraining.users} Personen)`, 
          withoutTrainingRate + '%', RED);
        
        doc.y = kpiY + kpiHeight + 20;
        
        const diff = withoutTrainingRate - withTrainingRate;
        
        if (diff > 0) {
          doc.fontSize(11).fillColor('#000000').text(
            `Mitarbeiter mit abgeschlossenen Trainings zeigen eine um `,
            { continued: true }
          );
          doc.font('Helvetica-Bold').fillColor(GREEN).text(`${Math.abs(diff).toFixed(1)} Prozentpunkte niedrigere`, { continued: true });
          doc.font('Helvetica').fillColor('#000000').text(` Erfolgsquote bei Phishing-Angriffen. Dies unterstreicht die Wirksamkeit der Security-Awareness-Trainings.`);
        } else if (diff < 0) {
          doc.fontSize(11).fillColor(RED).text(
            `Achtung: Mitarbeiter mit Trainings zeigen eine höhere Erfolgsquote. Dies sollte analysiert werden.`
          );
        } else {
          doc.fontSize(11).fillColor(DARK_GRAY).text(
            `Kein signifikanter Unterschied zwischen trainierten und untrainierten Mitarbeitern feststellbar.`
          );
        }
        
        if (analysis.levelStats.length > 0) {
          doc.moveDown(2);
          doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Trainingsabschluss nach Level');
          doc.moveDown(0.5);
          doc.font('Helvetica');
          
          const tableY = doc.y;
          const columnWidths = [100, 130, 180, 135];
          const tableX = 50;
          
          drawTableHeader(doc, ['Level', 'Anzahl Mitarbeiter', 'Ø erfolgreiche Angriffe', 'Ø Trainings'], tableX, tableY, columnWidths);
          
          let currentY = tableY + 25;
          analysis.levelStats.forEach((stat, index) => {
            drawTableRow(doc, [
              stat.level,
              stat.userCount,
              stat.avgSuccessful,
              stat.avgTrainings
            ], tableX, currentY, columnWidths, index % 2 === 1);
            currentY += 22;
          });
        }
      }
      
      // 7️⃣ FAZIT - Footer zentriert
      doc.addPage();
      drawSectionHeader(doc, '7. Fazit und Handlungsempfehlungen');
      
      doc.fontSize(14).fillColor(DARK_GRAY).text('Gesamtbewertung der Sicherheitslage', { align: 'center' });
      doc.moveDown(1);
      
      const riskBoxWidth2 = 280;
      const riskBoxX2 = (595.28 - riskBoxWidth2) / 2;
      const riskBoxY2 = doc.y;
      doc.roundedRect(riskBoxX2, riskBoxY2, riskBoxWidth2, 100, 12).lineWidth(4).strokeColor(riskColor).stroke();
      doc.fontSize(48).font('Helvetica-Bold').fillColor(riskColor).text(
        overview.sicherheitsbewertung.toUpperCase(), 
        riskBoxX2, 
        riskBoxY2 + 25, 
        { width: riskBoxWidth2, align: 'center' }
      );
      doc.font('Helvetica');
      
      doc.y = riskBoxY2 + 120;
      
      doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Empfohlene Maßnahmen');
      doc.moveDown(0.8);
      doc.font('Helvetica');
      
      if (overview.sicherheitsbewertung === 'Hoch') {
        const recommendations = [
          'DRINGEND: Sofortige Durchführung von Security-Awareness-Trainings für alle Mitarbeiter',
          'Regelmäßige Phishing-Simulationen zur Sensibilisierung (mindestens monatlich)',
          'Implementierung technischer Schutzmaßnahmen (E-Mail-Filter, Warnhinweise)',
          'Etablierung eines klaren Meldeprozesses für verdächtige E-Mails',
          'Level-basierte Schulungen mit Fokus auf besonders anfällige Gruppen',
          'Individuelle Nachschulungen für die am stärksten gefährdeten Mitarbeiter'
        ];
        recommendations.forEach((rec, index) => {
          doc.fontSize(10).fillColor('#000000').text(`${index + 1}. ${rec}`);
          doc.moveDown(0.5);
        });
      } else if (overview.sicherheitsbewertung === 'Mittel') {
        const recommendations = [
          'Fortführung regelmäßiger Security-Awareness-Schulungen (quartalsweise)',
          'Regelmäßige Phishing-Simulationen zur Aufrechterhaltung der Wachsamkeit',
          'Verbesserung der Meldekultur durch Incentivierung',
          'Technische Schutzmaßnahmen evaluieren und implementieren',
          'Level-basierte Schulungen für besonders anfällige Bereiche',
          'Monitoring und Nachverfolgung der Trainingseffektivität'
        ];
        recommendations.forEach((rec, index) => {
          doc.fontSize(10).fillColor('#000000').text(`${index + 1}. ${rec}`);
          doc.moveDown(0.5);
        });
      } else {
        const recommendations = [
          'Aufrechterhaltung des aktuellen Schulungsniveaus',
          'Kontinuierliche Phishing-Simulationen zur Wachsamkeit (halbjährlich)',
          'Positive Verstärkung des guten Meldeverhaltens',
          'Meldesysteme weiter stärken und bekannt machen',
          'Best-Practice-Sharing zwischen den Sicherheitslevels',
          'Regelmäßige Auffrischungskurse für alle Mitarbeiter'
        ];
        recommendations.forEach((rec, index) => {
          doc.fontSize(10).fillColor('#000000').text(`${index + 1}. ${rec}`);
          doc.moveDown(0.5);
        });
      }
      
      doc.moveDown(3);
      
      // Footer zentriert
      doc.fontSize(9).fillColor(DARK_GRAY).text(
        'Dieser Report wurde automatisch generiert und enthält ausschließlich aggregierte, anonymisierte Daten.',
        { align: 'center' }
      );
      doc.moveDown(0.3);
      doc.text('© 2026 Intelego Awareness Tool - Powered by Hornetsecurity', { align: 'center' });
      
      doc.end();
      
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generatePDFReport };
