const AdmZip = require('adm-zip');
const csv = require('csv-parser');
const { Readable } = require('stream');

const REQUIRED_FILES = [
  'phishing_scenarios.csv',
  'user_statistics.csv',
  'company_statistics.csv'
];

async function validateAndExtractZip(zipPath) {
  try {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    
    const csvFiles = {};
    let csvCount = 0;
    
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      
      const fileName = entry.entryName.toLowerCase();
      
      if (!fileName.endsWith('.csv')) continue;
      
      csvCount++;
      
      if ((fileName.includes('scenario') || fileName.includes('phishing')) && !csvFiles.scenarios) {
        csvFiles.scenarios = entry.getData().toString('utf8');
      } else if ((fileName.includes('user') || fileName.includes('employee')) && !csvFiles.users) {
        csvFiles.users = entry.getData().toString('utf8');
      } else if ((fileName.includes('company') || fileName.includes('enterprise')) && !csvFiles.company) {
        csvFiles.company = entry.getData().toString('utf8');
      }
    }
    
    if (csvCount !== 3) {
      throw new Error(`ZIP-Datei muss genau 3 CSV-Dateien enthalten. Gefunden: ${csvCount}`);
    }
    
    if (!csvFiles.scenarios) {
      throw new Error('Szenario-CSV nicht gefunden. Dateiname muss "scenario" oder "phishing" enthalten.');
    }
    
    if (!csvFiles.users) {
      throw new Error('Benutzer-CSV nicht gefunden. Dateiname muss "user" oder "employee" enthalten.');
    }
    
    if (!csvFiles.company) {
      throw new Error('Unternehmens-CSV nicht gefunden. Dateiname muss "company" oder "enterprise" enthalten.');
    }
    
    return csvFiles;
  } catch (error) {
    throw new Error(`ZIP-Verarbeitung fehlgeschlagen: ${error.message}`);
  }
}

async function parseCSV(csvContent) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from([csvContent]);
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

async function processZipFile(zipPath) {
  const csvFiles = await validateAndExtractZip(zipPath);
  
  const scenarios = await parseCSV(csvFiles.scenarios);
  const users = await parseCSV(csvFiles.users);
  const company = await parseCSV(csvFiles.company);
  
  return {
    scenarios,
    users,
    company
  };
}

module.exports = {
  processZipFile,
  validateAndExtractZip
};
