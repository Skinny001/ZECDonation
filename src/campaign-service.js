const { v4: uuidv4 } = require('uuid');
const { db } = require('./database');
const lightwalletd = require('./lightwalletd-client').sharedClient;

function generateSlug(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${suffix}`;
}

class CampaignService {
  static createCampaign(title, description, targetAmount, deadline, donationAddress) {
    return new Promise(async (resolve, reject) => {
      try {
        const id = uuidv4();
        const slug = generateSlug(title);

        const address = typeof donationAddress === 'string' ? donationAddress.trim() : '';
        if (!address) {
          return reject(new Error('donationAddress is required for campaign creation'));
        }

        const sql = `
          INSERT INTO campaigns (id, title, description, target_amount, donation_address, deadline, slug)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(sql, [id, title, description, targetAmount, address, deadline, slug], function (err) {
          if (err) return reject(err);
          resolve({
            id,
            title,
            description,
            target_amount: targetAmount,
            donation_address: address,
            deadline,
            slug,
            status: 'active',
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  static getCampaign(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM campaigns WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  static getCampaignBySlug(slug) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM campaigns WHERE slug = ?', [slug], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  static getAllCampaigns() {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM campaigns ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  static getCampaignsByStatus(status) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM campaigns WHERE status = ? ORDER BY created_at DESC',
        [status],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  static updateCampaignStatus(id, status) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE campaigns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id],
        function (err) {
          if (err) return reject(err);
          resolve({ id, status });
        }
      );
    });
  }

  static updateCampaignDeadline(id, newDeadline) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE campaigns SET deadline = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newDeadline, id],
        function (err) {
          if (err) return reject(err);
          resolve({ id, deadline: newDeadline });
        }
      );
    });
  }

  static async getCampaignBlockchainData(address) {
    try {
      const info = await lightwalletd.getLightdInfo();
      const currentHeight = Number(info.blockHeight) || 0;
      const startHeight = Math.max(0, currentHeight - 500);

      const blocks = await lightwalletd.getBlockRange(startHeight, currentHeight, ['POOL_TYPE_TRANSPARENT']);

      const txHashes = [];
      let totalReceived = 0;

      for (const block of blocks) {
        if (!block.vtx) continue;
        for (const tx of block.vtx) {
          if (!tx.outputs) continue;
          for (const output of tx.outputs) {
            if (output.address === address && output.valueZat) {
              const amountZec = Number(output.valueZat) / 1e8;
              totalReceived += amountZec;
              if (!txHashes.some(t => t.txid === tx.hash)) {
                txHashes.push({
                  txid: tx.hash,
                  amount: amountZec,
                  confirmations: currentHeight - Number(block.height) + 1,
                  time: block.time,
                  address: output.address,
                  category: 'receive',
                });
              }
            }
          }
        }
      }

      return {
        total_received: totalReceived || null,
        txs: txHashes,
      };
    } catch (error) {
      console.error('getCampaignBlockchainData error:', error.message);
      return { total_received: null, txs: [] };
    }
  }

  static getCampaignDonations(campaignId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM donations WHERE campaign_id = ? ORDER BY created_at DESC',
        [campaignId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }
}

module.exports = CampaignService;
