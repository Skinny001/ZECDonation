const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./config');
const fs = require('fs');

// Ensure data dir exists
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(config.dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at', config.dbPath);
  }
});

const initDb = () => {
  db.serialize(() => {
    // Campaigns table
    db.run(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        creator_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        target_zat INTEGER NOT NULL CHECK (target_zat > 0),
        deadline_at INTEGER NOT NULL,
        payout_ua TEXT NOT NULL,
        payout_mode TEXT NOT NULL CHECK (payout_mode IN ('auto','manual')),
        receive_ua TEXT UNIQUE NOT NULL,
        diversifier_index INTEGER UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'active'
          CHECK (status IN ('active','ended','payout_pending','paid_out','suspended')),
        created_at INTEGER NOT NULL
      )
    `);

    // Received notes
    db.run(`
      CREATE TABLE IF NOT EXISTS received_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        txid TEXT NOT NULL,
        pool TEXT NOT NULL,
        output_index INTEGER NOT NULL,
        value_zat INTEGER NOT NULL,
        memo_text TEXT, memo_hex TEXT,
        received_at_ua TEXT, diversifier_index INTEGER,
        campaign_id TEXT REFERENCES campaigns(id),
        attribution_source TEXT CHECK (attribution_source IN ('address','memo','manual')),
        attribution_conflict INTEGER NOT NULL DEFAULT 0,
        donor_message TEXT,
        received_after_deadline INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'seen'
          CHECK (status IN ('seen','confirmed','dust','unattributed','reorged','paid_out')),
        block_height INTEGER,
        first_seen_at INTEGER NOT NULL,
        confirmed_at INTEGER,
        payout_id TEXT REFERENCES payouts(id),
        UNIQUE (txid, pool, output_index)
      )
    `);

    // Payouts
    db.run(`
      CREATE TABLE IF NOT EXISTS payouts (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL REFERENCES campaigns(id),
        kind TEXT NOT NULL CHECK (kind IN ('payout','topup')),
        to_ua TEXT NOT NULL,
        gross_zat INTEGER NOT NULL,
        fee_zat INTEGER,
        platform_fee_zat INTEGER NOT NULL DEFAULT 0,
        net_zat INTEGER,
        status TEXT NOT NULL CHECK (status IN ('planned','submitted','confirmed','failed')),
        triggered_by TEXT NOT NULL,
        error TEXT,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      )
    `);

    // Payout transactions
    db.run(`
      CREATE TABLE IF NOT EXISTS payout_txs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payout_id TEXT NOT NULL REFERENCES payouts(id),
        operation_id TEXT, txid TEXT, status TEXT NOT NULL, error TEXT
      )
    `);

    // Utilities
    db.run(`CREATE TABLE IF NOT EXISTS sync_state (key TEXT PRIMARY KEY, value TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, actor TEXT, action TEXT, detail TEXT)`);

    console.log('Database tables initialized');
  });
};

const ensureMigrations = () => {
  // Can be used for future alterations
};

module.exports = {
  db,
  initDb,
  ensureMigrations
};
