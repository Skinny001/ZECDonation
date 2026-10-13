const { db } = require('./database');
const config = require('./config');
const { decodeMemo, parseDonationMessage } = require('./domain/memo');

const BackendClass = config.walletBackend === 'mock'
  ? require('./wallet/mockBackend')
  : config.walletBackend === 'zingo'
    ? require('./wallet/zingoBackend')
    : require('./wallet/zalletBackend');
const wallet = new BackendClass(config);

class SyncWorker {
  static async getSyncHeight() {
    return new Promise((resolve, reject) => {
      db.get("SELECT value FROM sync_state WHERE key = 'last_height'", [], (err, row) => {
        if (err) return reject(err);
        resolve(row ? parseInt(row.value, 10) : 0);
      });
    });
  }

  static async updateSyncHeight(height) {
    return new Promise((resolve, reject) => {
      db.run("INSERT OR REPLACE INTO sync_state (key, value) VALUES ('last_height', ?)", [height.toString()], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  static async processNote(note) {
    return new Promise(async (resolve, reject) => {
      try {
        let text = decodeMemo(note.memoHex);
        let token = null;
        let message = null;
        
        if (text) {
          const parsed = parseDonationMessage(text);
          token = parsed.token;
          message = parsed.message;
        }

        let campaignId = null;
        let attributionSource = null;
        let conflict = 0;

        // 1. By Address
        let addrCampaign = null;
        if (note.receivedAtAddress) {
          addrCampaign = await new Promise((res) => {
            db.get("SELECT id FROM campaigns WHERE receive_ua = ? OR payout_ua = ?", [note.receivedAtAddress, note.receivedAtAddress], (err, row) => res(row));
          });
        }

        // 2. By Memo Token
        let memoCampaign = null;
        if (token) {
          const code = token.replace('ZD:', '');
          memoCampaign = await new Promise((res) => {
            db.get("SELECT id FROM campaigns WHERE code = ?", [code], (err, row) => res(row));
          });
        }

        if (addrCampaign && memoCampaign && addrCampaign.id !== memoCampaign.id) {
          conflict = 1;
        } else if (addrCampaign) {
          campaignId = addrCampaign.id;
          attributionSource = 'address';
        } else if (memoCampaign) {
          campaignId = memoCampaign.id;
          attributionSource = 'memo';
        }

        const status = (campaignId && !conflict) ? 'confirmed' : 'unattributed';
        const now = Math.floor(Date.now() / 1000);

        db.run(`
          INSERT INTO received_notes 
          (txid, pool, output_index, value_zat, memo_text, memo_hex, received_at_ua, diversifier_index, campaign_id, attribution_source, attribution_conflict, donor_message, status, block_height, first_seen_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(txid, pool, output_index) DO UPDATE SET
            block_height = excluded.block_height,
            status = CASE WHEN received_notes.status = 'seen' THEN excluded.status ELSE received_notes.status END
        `, [
          note.txid,
          note.pool,
          note.outputIndex,
          Number(note.valueZat),
          text,
          note.memoHex,
          note.receivedAtAddress,
          note.diversifierIndex,
          campaignId,
          attributionSource,
          conflict,
          message,
          status,
          note.blockHeight,
          now
        ], (err) => {
          if (err) return reject(err);
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  static async runSync() {
    try {
      const sinceHeight = await this.getSyncHeight();
      const notes = await wallet.listReceivedNotes({ sinceHeight });
      
      let maxHeight = sinceHeight;
      for (const note of notes) {
        await this.processNote(note);
        if (note.blockHeight && note.blockHeight > maxHeight) {
          maxHeight = note.blockHeight;
        }
      }
      
      if (maxHeight > sinceHeight) {
        await this.updateSyncHeight(maxHeight);
      }
    } catch(e) {
      console.error('Sync Worker Error:', e.message);
    }
  }

  static start() {
    this.runSync();
    setInterval(() => this.runSync(), config.syncIntervalMs);
  }
}

module.exports = { SyncWorker, wallet };
