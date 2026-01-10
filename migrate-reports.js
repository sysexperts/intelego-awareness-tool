const db = require('./database');

console.log('Starte Migration der reports-Tabelle...');

// Schritt 1: Backup erstellen
db.run('CREATE TABLE reports_backup AS SELECT * FROM reports', (err) => {
  if (err) {
    console.error('Fehler beim Backup:', err);
    return;
  }
  console.log('✓ Backup erstellt');
  
  // Schritt 2: Alte Tabelle löschen
  db.run('DROP TABLE reports', (err) => {
    if (err) {
      console.error('Fehler beim Löschen:', err);
      return;
    }
    console.log('✓ Alte Tabelle gelöscht');
    
    // Schritt 3: Neue Tabelle mit customer_id als nullable erstellen
    db.run(`
      CREATE TABLE reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_scenarios INTEGER,
        total_users INTEGER,
        click_rate REAL,
        success_rate REAL,
        risk_level TEXT,
        pdf_path TEXT,
        email_sent BOOLEAN DEFAULT 0,
        source TEXT DEFAULT 'manual',
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `, (err) => {
      if (err) {
        console.error('Fehler beim Erstellen der neuen Tabelle:', err);
        return;
      }
      console.log('✓ Neue Tabelle erstellt');
      
      // Schritt 4: Daten zurückkopieren
      db.run('INSERT INTO reports SELECT * FROM reports_backup', (err) => {
        if (err) {
          console.error('Fehler beim Kopieren der Daten:', err);
          return;
        }
        console.log('✓ Daten wiederhergestellt');
        
        // Schritt 5: Backup löschen
        db.run('DROP TABLE reports_backup', (err) => {
          if (err) {
            console.error('Fehler beim Löschen des Backups:', err);
            return;
          }
          console.log('✓ Backup gelöscht');
          console.log('✅ Migration erfolgreich abgeschlossen!');
          process.exit(0);
        });
      });
    });
  });
});
