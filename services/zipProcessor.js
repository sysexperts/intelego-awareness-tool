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
    
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      
      const fileName = entry.entryName.toLowerCase();
      
      if (fileName.includes('phishing') && fileName.endsWith('.csv')) {
        csvFiles.scenarios = entry.getData().toString('utf8');
      } else if (fileName.includes('user') && fileName.endsWith('.csv')) {
        csvFiles.users = entry.getData().toString('utf8');
      } else if (fileName.includes('company') && fileName.endsWith('.csv')) {
        csvFiles.company = entry.getData().toString('utf8');
      }
    }
    
    if (!csvFiles.scenarios || !csvFiles.users || !csvFiles.company) {
      throw new Error('ZIP-Datei enthält nicht alle erforderlichen CSV-Dateien (Szenarien, Benutzer, Unternehmen)');
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
