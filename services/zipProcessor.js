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
    
    if (csvCount < 2 || csvCount > 4) {
      throw new Error(`ZIP-Datei muss 2-4 CSV-Dateien enthalten. Gefunden: ${csvCount}`);
    }
    
    if (!csvFiles.scenarios && !csvFiles.users && !csvFiles.company) {
      throw new Error('Keine erkennbaren CSV-Dateien gefunden. Dateinamen müssen "scenario/phishing", "user/employee" oder "company/enterprise" enthalten.');
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
