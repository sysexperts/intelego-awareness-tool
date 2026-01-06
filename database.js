const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('./config');

const dbDir = path.dirname(config.database.filename);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(config.database.filename);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      postal_code TEXT,
      country TEXT,
      pdf_show_user_emails BOOLEAN DEFAULT 1,
      pdf_show_user_names BOOLEAN DEFAULT 1,
      pdf_show_detailed_stats BOOLEAN DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_scenarios INTEGER,
      total_users INTEGER,
      click_rate REAL,
      success_rate REAL,
      risk_level TEXT,
      pdf_path TEXT,
      email_sent BOOLEAN DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS scenario_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      scenario_name TEXT,
      clicks INTEGER,
      logins INTEGER,
      file_opens INTEGER,
      macro_executions INTEGER,
      reported INTEGER,
      success_rate REAL,
      psychological_factor TEXT,
      FOREIGN KEY (report_id) REFERENCES reports(id)
    )
  `);

  const bcrypt = require('bcrypt');
  const defaultPassword = bcrypt.hashSync('admin123', 10);
  const intelegoPassword = bcrypt.hashSync('Intelego01', 10);
  
  db.run(`
    INSERT OR IGNORE INTO users (id, username, password) 
    VALUES (1, 'admin', ?)
  `, [defaultPassword]);
  
  db.run(`
    INSERT OR IGNORE INTO users (id, username, password) 
    VALUES (2, 'intelego', ?)
  `, [intelegoPassword]);
});

module.exports = db;
