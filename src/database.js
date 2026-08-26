const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || './donations.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

const initDb = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        target_amount REAL NOT NULL,
        donation_address TEXT NOT NULL,
        deadline DATETIME,
        status TEXT DEFAULT 'active',
        slug TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS donations (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        donor_address TEXT,
        amount REAL NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending',
        tx_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS donation_history (
        id TEXT PRIMARY KEY,
        donation_id TEXT NOT NULL,
        status TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        details TEXT,
        FOREIGN KEY (donation_id) REFERENCES donations(id)
      )
    `);

    console.log('Database tables initialized');
  });
};

// Ensure migrations for older DB versions
const ensureMigrations = () => {
  db.serialize(() => {
    db.all("PRAGMA table_info('donations')", (err, rows) => {
      if (err) {
        console.error('Error reading donations table info:', err);
        return;
      }

      const existing = (rows || []).map(r => r.name);
      const required = [
        { name: 'campaign_id', sql: 'TEXT' },
        { name: 'donor_address', sql: 'TEXT' },
        { name: 'message', sql: 'TEXT' },
        { name: 'status', sql: "TEXT DEFAULT 'pending'" },
        { name: 'tx_id', sql: 'TEXT' }
      ];

      required.forEach(col => {
        if (!existing.includes(col.name)) {
          console.log(`Migrating donations table: adding ${col.name} column`);
          db.run(`ALTER TABLE donations ADD COLUMN ${col.name} ${col.sql}`, (alterErr) => {
            if (alterErr) console.error(`Failed to add ${col.name} column:`, alterErr);
            else console.log(`${col.name} column added to donations table`);
          });
        }
      });
    });
  });
};

module.exports = {
  db,
  initDb
  , ensureMigrations
};
