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

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

function getRiskColor(riskLevel) {
  if (riskLevel === 'Hoch') return RED;
  if (riskLevel === 'Mittel') return ACCENT_COLOR;
  return GREEN;
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
        margin: MARGIN,
        bufferPages: true
      });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      const overview = analysis.overview;
      const riskColor = getRiskColor(overview.sicherheitsbewertung);
      
      // ==================== TITELSEITE ====================
      let yPos = 100;
      
      const logoPath = path.join(__dirname, '..', 'public', 'intelego-logo.png');
      if (fs.existsSync(logoPath)) {
        const logoWidth = 220;
        const logoX = (PAGE_WIDTH - logoWidth) / 2;
        doc.image(logoPath, logoX, yPos, { width: logoWidth });
        yPos += 100;
      }
      
      yPos += 50;
      doc.fontSize(36).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Phishing-Analyse Report', MARGIN, yPos, { width: CONTENT_WIDTH, align: 'center' });
      
      yPos += 50;
      doc.fontSize(16).font('Helvetica').fillColor(ACCENT_COLOR).text('Security Awareness Auswertung', MARGIN, yPos, { width: CONTENT_WIDTH, align: 'center' });
      
      yPos += 60;
      const infoBoxWidth = 400;
      const infoBoxX = (PAGE_WIDTH - infoBoxWidth) / 2;
      doc.roundedRect(infoBoxX, yPos, infoBoxWidth, 80, 10).lineWidth(1).strokeColor(DARK_GRAY).stroke();
      
      doc.fontSize(13).fillColor('#000000').text(`Kunde: ${customerName}`, infoBoxX + 20, yPos + 20, { width: infoBoxWidth - 40, align: 'center' });
      doc.fontSize(11).fillColor(DARK_GRAY).text(`Erstellt am: ${new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}`, infoBoxX + 20, yPos + 50, { width: infoBoxWidth - 40, align: 'center' });
      
      yPos += 120;
      doc.fontSize(14).fillColor(DARK_GRAY).text('Sicherheitsbewertung', MARGIN, yPos, { width: CONTENT_WIDTH, align: 'center' });
      
      yPos += 40;
      const titleRiskBoxWidth = 280;
      const titleRiskBoxX = (PAGE_WIDTH - titleRiskBoxWidth) / 2;
      doc.roundedRect(titleRiskBoxX, yPos, titleRiskBoxWidth, 100, 12).lineWidth(4).strokeColor(riskColor).stroke();
      doc.fontSize(48).font('Helvetica-Bold').fillColor(riskColor).text(overview.sicherheitsbewertung.toUpperCase(), titleRiskBoxX + 20, yPos + 30, { width: titleRiskBoxWidth - 40, align: 'center' });
      doc.font('Helvetica');
      
      // ==================== 1. ZUSAMMENFASSUNG ====================
      doc.addPage();
      yPos = MARGIN;
      
      doc.fontSize(16).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('1. Zusammenfassung', MARGIN, yPos);
      yPos += 25;
      doc.moveTo(MARGIN, yPos).lineTo(PAGE_WIDTH - MARGIN, yPos).lineWidth(2).strokeColor(ACCENT_COLOR).stroke();
      yPos += 30;
      doc.font('Helvetica');
      
      if (overview.hasCompany) {
        const kpiWidth = 115;
        const kpiHeight = 80;
        const kpiSpacing = 12;
        const totalKpiWidth = (kpiWidth * 4) + (kpiSpacing * 3);
        const kpiStartX = (PAGE_WIDTH - totalKpiWidth) / 2;
        
        const reportedCount = overview.attacksReported;
        const totalAttacks = overview.attacksSent;
        const reportRatio = totalAttacks > 0 ? `${reportedCount} von ${totalAttacks}` : '0';
        const reportPercent = overview.meldequote;
        
        // KPI Box 1
        doc.roundedRect(kpiStartX, yPos, kpiWidth, kpiHeight, 8).lineWidth(2).strokeColor(PRIMARY_COLOR).stroke();
        doc.fontSize(9).fillColor(DARK_GRAY).text('Gesendete Angriffe', kpiStartX + 10, yPos + 15, { width: kpiWidth - 20, align: 'center' });
        doc.fontSize(28).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text(overview.attacksSent.toString(), kpiStartX + 10, yPos + 40, { width: kpiWidth - 20, align: 'center' });
        
        // KPI Box 2
        const kpi2X = kpiStartX + kpiWidth + kpiSpacing;
        doc.roundedRect(kpi2X, yPos, kpiWidth, kpiHeight, 8).lineWidth(2).strokeColor(riskColor).stroke();
        doc.fontSize(9).font('Helvetica').fillColor(DARK_GRAY).text('Erfolgsquote', kpi2X + 10, yPos + 15, { width: kpiWidth - 20, align: 'center' });
        doc.fontSize(28).font('Helvetica-Bold').fillColor(riskColor).text(overview.erfolgsquote + '%', kpi2X + 10, yPos + 40, { width: kpiWidth - 20, align: 'center' });
        
        // KPI Box 3
        const kpi3X = kpi2X + kpiWidth + kpiSpacing;
        doc.roundedRect(kpi3X, yPos, kpiWidth, kpiHeight, 8).lineWidth(2).strokeColor(ACCENT_COLOR).stroke();
        doc.fontSize(9).font('Helvetica').fillColor(DARK_GRAY).text('Klickrate', kpi3X + 10, yPos + 15, { width: kpiWidth - 20, align: 'center' });
        doc.fontSize(28).font('Helvetica-Bold').fillColor(ACCENT_COLOR).text(overview.gesamtKlickrate + '%', kpi3X + 10, yPos + 40, { width: kpiWidth - 20, align: 'center' });
        
        // KPI Box 4
        const kpi4X = kpi3X + kpiWidth + kpiSpacing;
        doc.roundedRect(kpi4X, yPos, kpiWidth, kpiHeight, 8).lineWidth(2).strokeColor(GREEN).stroke();
        doc.fontSize(9).font('Helvetica').fillColor(DARK_GRAY).text('Gemeldet', kpi4X + 10, yPos + 15, { width: kpiWidth - 20, align: 'center' });
        doc.fontSize(18).font('Helvetica-Bold').fillColor(GREEN).text(`${reportRatio}\n(${reportPercent}%)`, kpi4X + 10, yPos + 35, { width: kpiWidth - 20, align: 'center' });
        
        yPos += kpiHeight + 30;
        doc.font('Helvetica');
        
        doc.fontSize(11).fillColor('#000000').text(
          `Bei ${overview.attacksSent} durchgeführten Phishing-Simulationen wurden ${overview.attacksSuccessful} erfolgreiche Angriffe verzeichnet. ` +
          `Dies entspricht einer Erfolgsquote von ${overview.erfolgsquote}%. ${reportedCount} Angriffe wurden von Mitarbeitern gemeldet. ` +
          `Basierend auf dieser Auswertung wird die Sicherheitslage als `,
          MARGIN, yPos, { width: CONTENT_WIDTH, align: 'justify', continued: true }
        );
        doc.fillColor(riskColor).font('Helvetica-Bold').text(overview.sicherheitsbewertung.toUpperCase(), { continued: true });
        doc.fillColor('#000000').font('Helvetica').text(' eingestuft.');
      }
      
      // ==================== 2. SZENARIEN ====================
      if (overview.hasScenarios && analysis.topScenarios.length > 0) {
        doc.addPage();
        yPos = MARGIN;
        
        doc.fontSize(16).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('2. Gefährlichste Phishing-Szenarien', MARGIN, yPos);
        yPos += 25;
        doc.moveTo(MARGIN, yPos).lineTo(PAGE_WIDTH - MARGIN, yPos).lineWidth(2).strokeColor(ACCENT_COLOR).stroke();
        yPos += 30;
        doc.font('Helvetica');
        
        doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Top 3 Szenarien mit höchster Erfolgsquote', MARGIN, yPos);
        yPos += 25;
        doc.font('Helvetica');
        
        const colWidths = [320, 80, 95];
        const tableX = MARGIN;
        
        // Header
        doc.rect(tableX, yPos, colWidths[0] + colWidths[1] + colWidths[2], 25).fillAndStroke(PRIMARY_COLOR, PRIMARY_COLOR);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE).text('Beschreibung', tableX + 8, yPos + 8, { width: colWidths[0] - 16 });
        doc.text('Angriffe', tableX + colWidths[0] + 8, yPos + 8, { width: colWidths[1] - 16 });
        doc.text('Erfolgsquote', tableX + colWidths[0] + colWidths[1] + 8, yPos + 8, { width: colWidths[2] - 16 });
        yPos += 25;
        doc.font('Helvetica');
        
        analysis.topScenarios.forEach((scenario, index) => {
          const bgColor = index % 2 === 1 ? LIGHT_GRAY : WHITE;
          doc.rect(tableX, yPos, colWidths[0] + colWidths[1] + colWidths[2], 22).fillAndStroke(bgColor, '#DDDDDD');
          doc.fontSize(9).fillColor('#000000').text(scenario.description.substring(0, 70) + (scenario.description.length > 70 ? '...' : ''), tableX + 8, yPos + 6, { width: colWidths[0] - 16, ellipsis: true });
          doc.text(scenario.attacksSent.toString(), tableX + colWidths[0] + 8, yPos + 6, { width: colWidths[1] - 16 });
          doc.text(scenario.successRate + '%', tableX + colWidths[0] + colWidths[1] + 8, yPos + 6, { width: colWidths[2] - 16 });
          yPos += 22;
        });
        
        yPos += 30;
        
        if (analysis.topPsychFactors.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Häufigste psychologische Trigger', MARGIN, yPos);
          yPos += 25;
          doc.font('Helvetica');
          
          analysis.topPsychFactors.forEach((item) => {
            const translatedFactor = translatePsychFactor(item.factor);
            doc.fontSize(10).fillColor('#000000').text(`• ${translatedFactor} (${item.count} Szenarien)`, MARGIN, yPos);
            yPos += 20;
          });
        }
      }
      
      // ==================== 3. BENUTZERVERHALTEN ====================
      if (overview.hasUsers) {
        doc.addPage();
        yPos = MARGIN;
        
        doc.fontSize(16).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('3. Benutzerverhalten - Übersicht', MARGIN, yPos);
        yPos += 25;
        doc.moveTo(MARGIN, yPos).lineTo(PAGE_WIDTH - MARGIN, yPos).lineWidth(2).strokeColor(ACCENT_COLOR).stroke();
        yPos += 30;
        doc.font('Helvetica');
        
        const kpiWidth = 240;
        const kpiHeight = 80;
        const kpiSpacing = 15;
        const totalKpiWidth = (kpiWidth * 2) + kpiSpacing;
        const kpiStartX = (PAGE_WIDTH - totalKpiWidth) / 2;
        
        doc.roundedRect(kpiStartX, yPos, kpiWidth, kpiHeight, 8).lineWidth(2).strokeColor(ACCENT_COLOR).stroke();
        doc.fontSize(9).fillColor(DARK_GRAY).text('Benutzer mit Klicks auf Phishing', kpiStartX + 10, yPos + 15, { width: kpiWidth - 20, align: 'center' });
        doc.fontSize(28).font('Helvetica-Bold').fillColor(ACCENT_COLOR).text(overview.vulnerableUsers.toString(), kpiStartX + 10, yPos + 40, { width: kpiWidth - 20, align: 'center' });
        
        const kpi2X = kpiStartX + kpiWidth + kpiSpacing;
        doc.roundedRect(kpi2X, yPos, kpiWidth, kpiHeight, 8).lineWidth(2).strokeColor(riskColor).stroke();
        doc.fontSize(9).font('Helvetica').fillColor(DARK_GRAY).text('Anteil gefährdeter Benutzer', kpi2X + 10, yPos + 15, { width: kpiWidth - 20, align: 'center' });
        doc.fontSize(28).font('Helvetica-Bold').fillColor(riskColor).text(overview.vulnerableUsersPercent + '%', kpi2X + 10, yPos + 40, { width: kpiWidth - 20, align: 'center' });
        
        yPos += kpiHeight + 30;
        doc.font('Helvetica');
        
        if (analysis.levelData.some(l => l.employees > 0)) {
          doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Erfolgsquote nach Sicherheitslevel', MARGIN, yPos);
          yPos += 25;
          doc.font('Helvetica');
          
          const colWidths = [100, 120, 120, 155];
          const tableX = MARGIN;
          
          doc.rect(tableX, yPos, colWidths.reduce((a, b) => a + b), 25).fillAndStroke(PRIMARY_COLOR, PRIMARY_COLOR);
          doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE).text('Level', tableX + 8, yPos + 8, { width: colWidths[0] - 16 });
          doc.text('Gesendete Angriffe', tableX + colWidths[0] + 8, yPos + 8, { width: colWidths[1] - 16 });
          doc.text('Erfolgreiche Angriffe', tableX + colWidths[0] + colWidths[1] + 8, yPos + 8, { width: colWidths[2] - 16 });
          doc.text('Erfolgsquote', tableX + colWidths[0] + colWidths[1] + colWidths[2] + 8, yPos + 8, { width: colWidths[3] - 16 });
          yPos += 25;
          doc.font('Helvetica');
          
          let rowIndex = 0;
          analysis.levelData.forEach((level) => {
            if (level.employees > 0 || level.attacksSent > 0) {
              const bgColor = rowIndex % 2 === 1 ? LIGHT_GRAY : WHITE;
              doc.rect(tableX, yPos, colWidths.reduce((a, b) => a + b), 22).fillAndStroke(bgColor, '#DDDDDD');
              doc.fontSize(9).fillColor('#000000').text('Level ' + level.level, tableX + 8, yPos + 6, { width: colWidths[0] - 16 });
              doc.text(level.attacksSent.toString(), tableX + colWidths[0] + 8, yPos + 6, { width: colWidths[1] - 16 });
              doc.text(level.attacksSuccessful.toString(), tableX + colWidths[0] + colWidths[1] + 8, yPos + 6, { width: colWidths[2] - 16 });
              doc.text(level.clickRate + '%', tableX + colWidths[0] + colWidths[1] + colWidths[2] + 8, yPos + 6, { width: colWidths[3] - 16 });
              yPos += 22;
              rowIndex++;
            }
          });
          
          yPos += 30;
          
          doc.fontSize(11).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Was bedeuten die Sicherheitslevel?', MARGIN, yPos);
          yPos += 25;
          doc.font('Helvetica').fontSize(10).fillColor(DARK_GRAY);
          
          const levelDescriptions = [
            'Level 1: Einstiegslevel - Neue Mitarbeiter ohne Security-Training',
            'Level 2: Grundkenntnisse - Basis-Schulung absolviert',
            'Level 3: Fortgeschritten - Regelmäßige Trainings und gutes Bewusstsein',
            'Level 4: Experte - Hohe Sensibilität und vorbildliches Verhalten',
            'Level 5: Security Champion - Multiplikator und Vorbild für andere'
          ];
          
          levelDescriptions.forEach(desc => {
            doc.text(desc, MARGIN, yPos);
            yPos += 18;
          });
        }
      }
      
      // ==================== 4. ANFÄLLIGSTE BENUTZER ====================
      if (overview.hasUsers && analysis.topVulnerableUsers.length > 0) {
        doc.addPage();
        yPos = MARGIN;
        
        doc.fontSize(16).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('4. Anfälligste Benutzer - Detailanalyse', MARGIN, yPos);
        yPos += 25;
        doc.moveTo(MARGIN, yPos).lineTo(PAGE_WIDTH - MARGIN, yPos).lineWidth(2).strokeColor(ACCENT_COLOR).stroke();
        yPos += 30;
        doc.font('Helvetica');
        
        doc.fontSize(11).fillColor(DARK_GRAY).text('Die folgende Tabelle zeigt die Mitarbeiter mit der höchsten Anfälligkeit für Phishing-Angriffe. Rot markierte Benutzer sind besonders gefährdet und sollten prioritär geschult werden.', MARGIN, yPos, { width: CONTENT_WIDTH });
        yPos += 40;
        
        const colWidths = [140, 50, 60, 60, 50, 60, 75];
        const tableX = MARGIN;
        
        doc.rect(tableX, yPos, colWidths.reduce((a, b) => a + b), 25).fillAndStroke(PRIMARY_COLOR, PRIMARY_COLOR);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE);
        let xPos = tableX + 8;
        ['E-Mail', 'Level', 'Gesendet', 'Erfolge', 'Klicks', 'Trainings', 'Anfälligkeit'].forEach((header, i) => {
          doc.text(header, xPos, yPos + 8, { width: colWidths[i] - 16 });
          xPos += colWidths[i];
        });
        yPos += 25;
        doc.font('Helvetica');
        
        analysis.topVulnerableUsers.slice(0, 15).forEach((user, index) => {
          if (yPos > 750) {
            doc.addPage();
            yPos = MARGIN;
            doc.fontSize(16).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('4. Anfälligste Benutzer - Fortsetzung', MARGIN, yPos);
            yPos += 25;
            doc.moveTo(MARGIN, yPos).lineTo(PAGE_WIDTH - MARGIN, yPos).lineWidth(2).strokeColor(ACCENT_COLOR).stroke();
            yPos += 30;
            doc.font('Helvetica');
            
            doc.rect(tableX, yPos, colWidths.reduce((a, b) => a + b), 25).fillAndStroke(PRIMARY_COLOR, PRIMARY_COLOR);
            doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE);
            xPos = tableX + 8;
            ['E-Mail', 'Level', 'Gesendet', 'Erfolge', 'Klicks', 'Trainings', 'Anfälligkeit'].forEach((header, i) => {
              doc.text(header, xPos, yPos + 8, { width: colWidths[i] - 16 });
              xPos += colWidths[i];
            });
            yPos += 25;
            doc.font('Helvetica');
          }
          
          let rowColor = WHITE;
          if (user.successful >= 3) {
            rowColor = '#FFCCCC';
          } else if (user.successful >= 1) {
            rowColor = '#FFF9C4';
          } else if (index % 2 === 1) {
            rowColor = LIGHT_GRAY;
          }
          
          doc.rect(tableX, yPos, colWidths.reduce((a, b) => a + b), 22).fillAndStroke(rowColor, '#DDDDDD');
          doc.fontSize(9).fillColor('#000000');
          xPos = tableX + 8;
          [user.email, user.level, user.sent, user.successful, user.clicked, user.trainingsCompleted, user.vulnerability + '%'].forEach((val, i) => {
            doc.text(String(val), xPos, yPos + 6, { width: colWidths[i] - 16, ellipsis: true });
            xPos += colWidths[i];
          });
          yPos += 22;
        });
        
        yPos += 30;
        
        doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Trainingsstand der Mitarbeiter', MARGIN, yPos);
        yPos += 25;
        doc.font('Helvetica');
        
        const trainingWidth = 160;
        const trainingHeight = 70;
        const trainingSpacing = 10;
        const totalTrainingWidth = (trainingWidth * 3) + (trainingSpacing * 2);
        const trainingStartX = (PAGE_WIDTH - totalTrainingWidth) / 2;
        
        doc.roundedRect(trainingStartX, yPos, trainingWidth, trainingHeight, 8).lineWidth(2).strokeColor(GREEN).stroke();
        doc.fontSize(9).fillColor(DARK_GRAY).text('Trainings abgeschlossen', trainingStartX + 10, yPos + 15, { width: trainingWidth - 20, align: 'center' });
        doc.fontSize(28).font('Helvetica-Bold').fillColor(GREEN).text(overview.trainingsCompleted.toString(), trainingStartX + 10, yPos + 35, { width: trainingWidth - 20, align: 'center' });
        
        const training2X = trainingStartX + trainingWidth + trainingSpacing;
        doc.roundedRect(training2X, yPos, trainingWidth, trainingHeight, 8).lineWidth(2).strokeColor(ACCENT_COLOR).stroke();
        doc.fontSize(9).font('Helvetica').fillColor(DARK_GRAY).text('In Bearbeitung', training2X + 10, yPos + 15, { width: trainingWidth - 20, align: 'center' });
        doc.fontSize(28).font('Helvetica-Bold').fillColor(ACCENT_COLOR).text(overview.trainingsStarted.toString(), training2X + 10, yPos + 35, { width: trainingWidth - 20, align: 'center' });
        
        const training3X = training2X + trainingWidth + trainingSpacing;
        doc.roundedRect(training3X, yPos, trainingWidth, trainingHeight, 8).lineWidth(2).strokeColor(RED).stroke();
        doc.fontSize(9).font('Helvetica').fillColor(DARK_GRAY).text('Nicht gestartet', training3X + 10, yPos + 15, { width: trainingWidth - 20, align: 'center' });
        doc.fontSize(28).font('Helvetica-Bold').fillColor(RED).text(overview.trainingsNotStarted.toString(), training3X + 10, yPos + 35, { width: trainingWidth - 20, align: 'center' });
        
        yPos += trainingHeight + 20;
        doc.font('Helvetica');
        doc.fontSize(10).fillColor(DARK_GRAY).text(`Durchschnittlich ${overview.avgTrainingsPerUser} Trainings pro Mitarbeiter`, MARGIN, yPos, { width: CONTENT_WIDTH, align: 'center' });
      }
      
      // ==================== 5. ANGRIFFSTYPEN ====================
      if (overview.hasScenarios && analysis.exploitTypeAnalysis.length > 0) {
        doc.addPage();
        yPos = MARGIN;
        
        doc.fontSize(16).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('5. Angriffstypen - Detailanalyse', MARGIN, yPos);
        yPos += 25;
        doc.moveTo(MARGIN, yPos).lineTo(PAGE_WIDTH - MARGIN, yPos).lineWidth(2).strokeColor(ACCENT_COLOR).stroke();
        yPos += 30;
        doc.font('Helvetica');
        
        doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Erfolgsquote nach Angriffstyp', MARGIN, yPos);
        yPos += 25;
        doc.font('Helvetica');
        
        const colWidths = [180, 80, 110, 90, 85];
        const tableX = MARGIN;
        
        doc.rect(tableX, yPos, colWidths.reduce((a, b) => a + b), 25).fillAndStroke(PRIMARY_COLOR, PRIMARY_COLOR);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE);
        xPos = tableX + 8;
        ['Angriffstyp', 'Szenarien', 'Ø Erfolgsrate', 'Angriffe', 'Erfolgreich'].forEach((header, i) => {
          doc.text(header, xPos, yPos + 8, { width: colWidths[i] - 16 });
          xPos += colWidths[i];
        });
        yPos += 25;
        doc.font('Helvetica');
        
        analysis.exploitTypeAnalysis.forEach((type, index) => {
          const bgColor = index % 2 === 1 ? LIGHT_GRAY : WHITE;
          doc.rect(tableX, yPos, colWidths.reduce((a, b) => a + b), 22).fillAndStroke(bgColor, '#DDDDDD');
          doc.fontSize(9).fillColor('#000000');
          xPos = tableX + 8;
          [translateExploitType(type.type), type.scenarioCount, type.avgSuccessRate + '%', type.totalAttacks, type.successfulAttacks].forEach((val, i) => {
            doc.text(String(val), xPos, yPos + 6, { width: colWidths[i] - 16, ellipsis: true });
            xPos += colWidths[i];
          });
          yPos += 22;
        });
        
        yPos += 30;
        
        doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Szenario-Zusammenfassung', MARGIN, yPos);
        yPos += 25;
        doc.font('Helvetica');
        
        doc.fontSize(10).fillColor(DARK_GRAY).text(
          `Insgesamt wurden ${analysis.scenarioStats.length} verschiedene Phishing-Szenarien getestet. ` +
          `Die durchschnittliche Erfolgsquote über alle Szenarien beträgt ${overview.erfolgsquote}%. ` +
          `Die gefährlichsten Angriffstypen sind oben aufgeführt.`,
          MARGIN, yPos, { width: CONTENT_WIDTH }
        );
      }
      
      // ==================== 6. TRAINING-EFFEKTIVITÄT ====================
      if (overview.hasUsers && analysis.trainingEffectiveness) {
        doc.addPage();
        yPos = MARGIN;
        
        doc.fontSize(16).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('6. Training-Effektivität', MARGIN, yPos);
        yPos += 25;
        doc.moveTo(MARGIN, yPos).lineTo(PAGE_WIDTH - MARGIN, yPos).lineWidth(2).strokeColor(ACCENT_COLOR).stroke();
        yPos += 30;
        doc.font('Helvetica');
        
        doc.fontSize(11).fillColor(DARK_GRAY).text('Vergleich der Erfolgsquote bei Phishing-Angriffen zwischen Mitarbeitern mit und ohne abgeschlossene Trainings.', MARGIN, yPos, { width: CONTENT_WIDTH });
        yPos += 40;
        
        const kpiWidth = 240;
        const kpiHeight = 90;
        const kpiSpacing = 15;
        const totalKpiWidth = (kpiWidth * 2) + kpiSpacing;
        const kpiStartX = (PAGE_WIDTH - totalKpiWidth) / 2;
        
        const withTrainingRate = analysis.trainingEffectiveness.withTraining.successRate;
        const withoutTrainingRate = analysis.trainingEffectiveness.withoutTraining.successRate;
        
        doc.roundedRect(kpiStartX, yPos, kpiWidth, kpiHeight, 8).lineWidth(2).strokeColor(GREEN).stroke();
        doc.fontSize(9).fillColor(DARK_GRAY).text(`Mitarbeiter MIT Training (${analysis.trainingEffectiveness.withTraining.users} Personen)`, kpiStartX + 10, yPos + 15, { width: kpiWidth - 20, align: 'center' });
        doc.fontSize(28).font('Helvetica-Bold').fillColor(GREEN).text(withTrainingRate + '%', kpiStartX + 10, yPos + 45, { width: kpiWidth - 20, align: 'center' });
        
        const kpi2X = kpiStartX + kpiWidth + kpiSpacing;
        doc.roundedRect(kpi2X, yPos, kpiWidth, kpiHeight, 8).lineWidth(2).strokeColor(RED).stroke();
        doc.fontSize(9).font('Helvetica').fillColor(DARK_GRAY).text(`Mitarbeiter OHNE Training (${analysis.trainingEffectiveness.withoutTraining.users} Personen)`, kpi2X + 10, yPos + 15, { width: kpiWidth - 20, align: 'center' });
        doc.fontSize(28).font('Helvetica-Bold').fillColor(RED).text(withoutTrainingRate + '%', kpi2X + 10, yPos + 45, { width: kpiWidth - 20, align: 'center' });
        
        yPos += kpiHeight + 25;
        doc.font('Helvetica');
        
        const diff = withoutTrainingRate - withTrainingRate;
        
        if (diff > 0) {
          doc.fontSize(11).fillColor('#000000').text('Mitarbeiter mit abgeschlossenen Trainings zeigen eine um ', MARGIN, yPos, { width: CONTENT_WIDTH, continued: true });
          doc.font('Helvetica-Bold').fillColor(GREEN).text(`${Math.abs(diff).toFixed(1)} Prozentpunkte niedrigere`, { continued: true });
          doc.font('Helvetica').fillColor('#000000').text(` Erfolgsquote bei Phishing-Angriffen. Dies unterstreicht die Wirksamkeit der Security-Awareness-Trainings.`);
        } else if (diff < 0) {
          doc.fontSize(11).fillColor(RED).text('Achtung: Mitarbeiter mit Trainings zeigen eine höhere Erfolgsquote. Dies sollte analysiert werden.', MARGIN, yPos, { width: CONTENT_WIDTH });
        } else {
          doc.fontSize(11).fillColor(DARK_GRAY).text('Kein signifikanter Unterschied zwischen trainierten und untrainierten Mitarbeitern feststellbar.', MARGIN, yPos, { width: CONTENT_WIDTH });
        }
      }
      
      // ==================== 7. FAZIT ====================
      doc.addPage();
      yPos = MARGIN;
      
      doc.fontSize(16).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('7. Fazit und Handlungsempfehlungen', MARGIN, yPos);
      yPos += 25;
      doc.moveTo(MARGIN, yPos).lineTo(PAGE_WIDTH - MARGIN, yPos).lineWidth(2).strokeColor(ACCENT_COLOR).stroke();
      yPos += 30;
      doc.font('Helvetica');
      
      doc.fontSize(14).fillColor(DARK_GRAY).text('Gesamtbewertung der Sicherheitslage', MARGIN, yPos, { width: CONTENT_WIDTH, align: 'center' });
      yPos += 40;
      
      const finalRiskBoxWidth = 280;
      const finalRiskBoxX = (PAGE_WIDTH - finalRiskBoxWidth) / 2;
      doc.roundedRect(finalRiskBoxX, yPos, finalRiskBoxWidth, 100, 12).lineWidth(4).strokeColor(riskColor).stroke();
      doc.fontSize(48).font('Helvetica-Bold').fillColor(riskColor).text(overview.sicherheitsbewertung.toUpperCase(), finalRiskBoxX + 20, yPos + 30, { width: finalRiskBoxWidth - 40, align: 'center' });
      yPos += 120;
      doc.font('Helvetica');
      
      doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('Empfohlene Maßnahmen', MARGIN, yPos);
      yPos += 25;
      doc.font('Helvetica');
      
      const recommendations = overview.sicherheitsbewertung === 'Hoch' ? [
        'DRINGEND: Sofortige Durchführung von Security-Awareness-Trainings für alle Mitarbeiter',
        'Regelmäßige Phishing-Simulationen zur Sensibilisierung (mindestens monatlich)',
        'Implementierung technischer Schutzmaßnahmen (E-Mail-Filter, Warnhinweise)',
        'Etablierung eines klaren Meldeprozesses für verdächtige E-Mails',
        'Level-basierte Schulungen mit Fokus auf besonders anfällige Gruppen',
        'Individuelle Nachschulungen für die am stärksten gefährdeten Mitarbeiter'
      ] : overview.sicherheitsbewertung === 'Mittel' ? [
        'Fortführung regelmäßiger Security-Awareness-Schulungen (quartalsweise)',
        'Regelmäßige Phishing-Simulationen zur Aufrechterhaltung der Wachsamkeit',
        'Verbesserung der Meldekultur durch Incentivierung',
        'Technische Schutzmaßnahmen evaluieren und implementieren',
        'Level-basierte Schulungen für besonders anfällige Bereiche',
        'Monitoring und Nachverfolgung der Trainingseffektivität'
      ] : [
        'Aufrechterhaltung des aktuellen Schulungsniveaus',
        'Kontinuierliche Phishing-Simulationen zur Wachsamkeit (halbjährlich)',
        'Positive Verstärkung des guten Meldeverhaltens',
        'Meldesysteme weiter stärken und bekannt machen',
        'Best-Practice-Sharing zwischen den Sicherheitslevels',
        'Regelmäßige Auffrischungskurse für alle Mitarbeiter'
      ];
      
      recommendations.forEach((rec, index) => {
        doc.fontSize(10).fillColor('#000000').text(`${index + 1}. ${rec}`, MARGIN, yPos, { width: CONTENT_WIDTH });
        yPos += 22;
      });
      
      yPos += 40;
      
      doc.fontSize(9).fillColor(DARK_GRAY).text('Dieser Report wurde automatisch generiert und enthält ausschließlich aggregierte, anonymisierte Daten.', MARGIN, yPos, { width: CONTENT_WIDTH, align: 'center' });
      yPos += 15;
      doc.text('© 2026 Intelego Awareness Tool - Powered by Hornetsecurity', MARGIN, yPos, { width: CONTENT_WIDTH, align: 'center' });
      
      doc.end();
      
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generatePDFReport };
