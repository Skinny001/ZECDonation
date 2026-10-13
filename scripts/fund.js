#!/usr/bin/env node
const sqlite3 = require('sqlite3');
const path = require('path');
const { SyncWorker } = require('../src/sync');

const dbPath = path.resolve(__dirname, '../donations.db');
const db = new sqlite3.Database(dbPath);

const targetInput = process.argv[2];
const amountZec = parseFloat(process.argv[3]) || 1.0;
const amountZat = BigInt(Math.floor(amountZec * 1e8));

async function fund() {
  db.get(
    targetInput 
      ? "SELECT * FROM campaigns WHERE receive_ua = ? OR payout_ua = ? OR code = ? OR id = ? LIMIT 1"
      : "SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 1",
    targetInput ? [targetInput, targetInput, targetInput, targetInput] : [],
    async (err, campaign) => {
      if (err) {
        console.error("❌ Database error:", err);
        process.exit(1);
      }
      if (!campaign) {
        console.error("❌ No campaign found matching:", targetInput || "latest");
        process.exit(1);
      }

      const txid = 'tx_' + Date.now().toString(16) + '_' + Math.random().toString(16).substring(2, 10);
      const memo = `zd:${campaign.code} Live demo donation of ${amountZec} ZEC`;

      await SyncWorker.processNote({
        txid,
        pool: 'orchard',
        outputIndex: 0,
        valueZat: amountZat,
        memoHex: Buffer.from(memo, 'utf8').toString('hex'),
        receivedAtAddress: campaign.receive_ua || campaign.payout_ua,
        diversifierIndex: campaign.diversifier_index || 1,
        blockHeight: 4491860,
        confirmations: 10
      });

      // Fetch updated numbers
      db.get(`
        SELECT COALESCE(SUM(value_zat), 0) as total_zat 
        FROM received_notes 
        WHERE campaign_id = ? AND status IN ('confirmed', 'paid_out')
      `, [campaign.id], (err2, row) => {
        const totalZec = (Number(row?.total_zat || 0) / 1e8).toFixed(4);
        const targetZec = (campaign.target_zat / 1e8).toFixed(4);
        const pct = Math.min(100, (Number(totalZec) / Number(targetZec)) * 100).toFixed(1);

        console.log(`\n======================================================`);
        console.log(`✅ INSTANTLY FUNDED ${amountZec} ZEC!`);
        console.log(`🎯 Campaign: "${campaign.title}" (${campaign.code})`);
        console.log(`💰 Progress: ${totalZec} / ${targetZec} ZEC (${pct}% funded)`);
        console.log(`📡 TXID: ${txid}`);
        console.log(`======================================================\n`);
        db.close();
        process.exit(0);
      });
    }
  );
}

fund().catch(err => {
  console.error("❌ Error funding:", err);
  process.exit(1);
});
