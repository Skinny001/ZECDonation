const { v4: uuidv4 } = require('uuid');
const { db } = require('./database');
const config = require('./config');
const { generateCode } = require('./domain/campaign');
const { buildPaymentUri } = require('./domain/zip321');

const BackendClass = config.walletBackend === 'mock'
  ? require('./wallet/mockBackend')
  : config.walletBackend === 'zingo'
    ? require('./wallet/zingoBackend')
    : require('./wallet/zalletBackend');
const wallet = new BackendClass(config);

class CampaignService {
  static createCampaign(creatorId, title, description, targetZat, deadlineAt, payoutUA, payoutMode) {
    return new Promise(async (resolve, reject) => {
      try {
        const valid = await wallet.validateAddress(payoutUA);
        if (!valid.valid) {
          return reject(new Error('Invalid payout address'));
        }

        const id = uuidv4();
        const code = generateCode();

        db.get('SELECT MAX(diversifier_index) as maxIdx FROM campaigns', [], async (err, row) => {
          if (err) return reject(err);
          const nextIdx = (row.maxIdx !== null ? row.maxIdx : 0) + 1;
          
          try {
            // Use the creator's dropped address as receive_ua so QR code and copy button use the user's address
            const receiveUA = payoutUA || await wallet.getAddressAtIndex(config.escrowAccountId, nextIdx);
            const now = Math.floor(Date.now() / 1000);

            const sql = `
              INSERT INTO campaigns (id, code, creator_id, title, description, target_zat, deadline_at, payout_ua, payout_mode, receive_ua, diversifier_index, status, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.run(sql, [id, code, creatorId, title, description, targetZat, deadlineAt, payoutUA, payoutMode, receiveUA, nextIdx, 'active', now], function(insertErr) {
              if (insertErr) return reject(insertErr);
              resolve({
                id, code, title, receive_ua: receiveUA, status: 'active'
              });
            });
          } catch(e) {
            reject(e);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  static getCampaign(id) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT c.*, 
               COALESCE(SUM(CASE WHEN n.status IN ('confirmed', 'paid_out') THEN n.value_zat ELSE 0 END), 0) as confirmed_balance,
               COALESCE(SUM(CASE WHEN n.status IN ('confirmed', 'paid_out') THEN n.value_zat ELSE 0 END), 0) as total_raised_zat
        FROM campaigns c
        LEFT JOIN received_notes n ON c.id = n.campaign_id
        WHERE c.id = ?
        GROUP BY c.id
      `, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
  
  static getCampaignByCode(code) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT c.*, 
               COALESCE(SUM(CASE WHEN n.status IN ('confirmed', 'paid_out') THEN n.value_zat ELSE 0 END), 0) as confirmed_balance,
               COALESCE(SUM(CASE WHEN n.status IN ('confirmed', 'paid_out') THEN n.value_zat ELSE 0 END), 0) as total_raised_zat
        FROM campaigns c
        LEFT JOIN received_notes n ON c.id = n.campaign_id
        WHERE c.code = ?
        GROUP BY c.id
      `, [code], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  static getAllCampaigns() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM campaigns ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  static getPaymentInfo(campaign) {
    const now = Math.floor(Date.now() / 1000);
    if (campaign.deadline_at <= now) {
      return null; // Expired
    }
    const template = ` zd:${campaign.code}`;
    // Use the user's dropped payout_ua so the QR code and copy button reflect their address
    const effectiveAddress = (campaign.payout_ua && !campaign.payout_ua.includes('mock'))
      ? campaign.payout_ua
      : campaign.receive_ua;
    const uri = buildPaymentUri(effectiveAddress, null, template);
    return {
      receive_ua: effectiveAddress,
      payout_ua: campaign.payout_ua,
      code: campaign.code,
      memo_template: template,
      zip321_uri: uri
    };
  }
}

module.exports = CampaignService;
