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

  // Migration: Add new columns if they don't exist
  db.all("PRAGMA table_info(customers)", (err, columns) => {
    if (err) return;
    
    const columnNames = columns.map(col => col.name);
    
    if (!columnNames.includes('customer_number')) {
      db.run("ALTER TABLE customers ADD COLUMN customer_number TEXT");
    }
    if (!columnNames.includes('email')) {
      db.run("ALTER TABLE customers ADD COLUMN email TEXT");
    }
    if (!columnNames.includes('phone')) {
      db.run("ALTER TABLE customers ADD COLUMN phone TEXT");
    }
    if (!columnNames.includes('address')) {
      db.run("ALTER TABLE customers ADD COLUMN address TEXT");
    }
    if (!columnNames.includes('city')) {
      db.run("ALTER TABLE customers ADD COLUMN city TEXT");
    }
    if (!columnNames.includes('postal_code')) {
      db.run("ALTER TABLE customers ADD COLUMN postal_code TEXT");
    }
    if (!columnNames.includes('country')) {
      db.run("ALTER TABLE customers ADD COLUMN country TEXT");
    }
    if (!columnNames.includes('pdf_show_user_emails')) {
      db.run("ALTER TABLE customers ADD COLUMN pdf_show_user_emails BOOLEAN DEFAULT 1");
    }
    if (!columnNames.includes('pdf_show_user_names')) {
      db.run("ALTER TABLE customers ADD COLUMN pdf_show_user_names BOOLEAN DEFAULT 1");
    }
    if (!columnNames.includes('pdf_show_detailed_stats')) {
      db.run("ALTER TABLE customers ADD COLUMN pdf_show_detailed_stats BOOLEAN DEFAULT 1");
    }
    if (!columnNames.includes('notes')) {
      db.run("ALTER TABLE customers ADD COLUMN notes TEXT");
    }
  });

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
      source TEXT DEFAULT 'manual',
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  // Add source column to existing reports table if it doesn't exist
  db.all("PRAGMA table_info(reports)", (err, columns) => {
    if (err) return;
    const columnNames = columns.map(col => col.name);
    if (!columnNames.includes('source')) {
      db.run("ALTER TABLE reports ADD COLUMN source TEXT DEFAULT 'manual'");
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS email_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      imap_host TEXT,
      imap_port INTEGER DEFAULT 993,
      email_username TEXT,
      email_password TEXT,
      monitoring_folder TEXT DEFAULT 'INBOX',
      check_interval INTEGER DEFAULT 15,
      monitoring_enabled BOOLEAN DEFAULT 0,
      last_check DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      report_id INTEGER,
      customer_id INTEGER,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
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
