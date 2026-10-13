const { v4: uuidv4 } = require('uuid');
const { db } = require('./database');
const config = require('./config');
const BackendClass = config.walletBackend === 'mock'
  ? require('./wallet/mockBackend')
  : config.walletBackend === 'zingo'
    ? require('./wallet/zingoBackend')
    : require('./wallet/zalletBackend');
const wallet = new BackendClass(config);

class PayoutWorker {
  static async runPayouts() {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      const rows = await new Promise((resolve, reject) => {
        db.all(`
          SELECT c.*, 
                 COALESCE(SUM(n.value_zat), 0) as confirmed_balance
          FROM campaigns c
          LEFT JOIN received_notes n ON c.id = n.campaign_id AND n.status = 'confirmed' AND n.payout_id IS NULL
          WHERE c.status IN ('active', 'ended', 'paid_out')
            AND c.payout_mode = 'auto'
          GROUP BY c.id
          HAVING confirmed_balance > 0 AND 
                (c.deadline_at <= ? OR confirmed_balance >= c.target_zat OR c.status = 'paid_out')
        `, [now], (err, rows) => err ? reject(err) : resolve(rows));
      });

      for (const campaign of rows) {
        await this.processCampaignPayout(campaign, 'system');
      }
    } catch (e) {
      console.error('Payout Worker Error:', e.message);
    }
  }

  static async processCampaignPayout(campaign, triggeredBy = 'system') {
    const amountZat = campaign.confirmed_balance;
    const kind = campaign.status === 'paid_out' ? 'topup' : 'payout';
    const payoutId = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const platformFeeZat = Math.floor(amountZat * ((config.platformFeeBps || 0) / 10000));
    const payoutAmountZat = amountZat - platformFeeZat;

    console.log(`Starting ${kind} for campaign ${campaign.code} - Gross: ${amountZat} zat, Fee: ${platformFeeZat} zat`);

    try {
      // 1. Lock notes & update campaign status
      await new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          db.run(`UPDATE received_notes SET payout_id = ? WHERE campaign_id = ? AND status = 'confirmed' AND payout_id IS NULL`, 
            [payoutId, campaign.id]);
          
          if (kind === 'payout') {
            db.run(`UPDATE campaigns SET status = 'payout_pending' WHERE id = ?`, [campaign.id]);
          }

          db.run(`
            INSERT INTO payouts (id, campaign_id, kind, to_ua, gross_zat, platform_fee_zat, status, triggered_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'planned', ?, ?, ?)
          `, [payoutId, campaign.id, kind, campaign.payout_ua, amountZat, platformFeeZat, triggeredBy, now, now]);

          db.run('COMMIT', (err) => err ? reject(err) : resolve());
        });
      });

      let proposal;
      try {
        proposal = await wallet.proposePayout({ 
          toUA: campaign.payout_ua, 
          amountZat: BigInt(payoutAmountZat) 
        });
      } catch(e) {
        throw new Error('Proposal failed: ' + e.message);
      }
      
      const feeZat = Number(proposal.feeZat);
      const netZat = payoutAmountZat - feeZat;
      
      await new Promise(r => db.run(`UPDATE payouts SET fee_zat = ?, net_zat = ? WHERE id = ?`, [feeZat, netZat, payoutId], r));

      const execution = await wallet.executePayout(proposal.proposalId);
      const operationId = execution.operationIds ? execution.operationIds[0] : null;

      let txid = null;
      if (operationId) {
        await new Promise(r => db.run(`INSERT INTO payout_txs (payout_id, operation_id, status) VALUES (?, ?, 'submitted')`, [payoutId, operationId], r));
        
        let opStatus = null;
        for (let i = 0; i < 5; i++) {
          const op = await wallet.getOperation(operationId);
          if (op && op.status === 'confirmed') {
            opStatus = 'confirmed';
            txid = op.txid;
            break;
          }
          await new Promise(r => setTimeout(r, 1000));
        }
        if (opStatus === 'confirmed') {
          await new Promise(r => db.run(`UPDATE payout_txs SET status = 'confirmed', txid = ? WHERE operation_id = ?`, [txid, operationId], r));
        }
      } else {
        await new Promise(r => db.run(`INSERT INTO payout_txs (payout_id, txid, status) VALUES (?, ?, 'confirmed')`, [payoutId, 'mock-tx-id'], r));
        txid = 'mock-tx-id';
      }

      // 3. Mark confirmed
      await new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          db.run(`UPDATE payouts SET status = 'confirmed', updated_at = ? WHERE id = ?`, [Math.floor(Date.now() / 1000), payoutId]);
          db.run(`UPDATE received_notes SET status = 'paid_out' WHERE payout_id = ?`, [payoutId]);
          if (kind === 'payout') {
            db.run(`UPDATE campaigns SET status = 'paid_out' WHERE id = ?`, [campaign.id]);
          }
          db.run('COMMIT', (err) => err ? reject(err) : resolve());
        });
      });

      console.log(`✅ ${kind} confirmed for ${campaign.code}! TxID: ${txid || 'unknown'}`);

    } catch (err) {
      console.error(`❌ Payout failed for ${campaign.code}:`, err.message);
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(`UPDATE received_notes SET status = 'confirmed', payout_id = NULL WHERE payout_id = ?`, [payoutId]);
        if (kind === 'payout') {
          db.run(`UPDATE campaigns SET status = 'active' WHERE id = ?`, [campaign.id]);
        }
        db.run(`UPDATE payouts SET status = 'failed', error = ? WHERE id = ?`, [err.message, payoutId]);
        db.run('COMMIT');
      });
    }
  }

  static start() {
    this.runPayouts();
    setInterval(() => this.runPayouts(), config.payoutIntervalMs || 30000); // Check every 30s
  }
}

module.exports = { PayoutWorker };
