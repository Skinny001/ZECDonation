const { v4: uuidv4 } = require('uuid');
const { db } = require('./database');

class DonationService {
  static createDonation(campaignId, amount, donorAddress = '', message = '', status = 'pending') {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const sql = `
        INSERT INTO donations (id, campaign_id, donor_address, amount, message, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.run(sql, [id, campaignId, donorAddress, amount, message, status], function (err) {
        if (err) return reject(err);
        DonationService.addHistory(id, status, 'Donation recorded').catch(() => {});
        resolve({ id, campaignId, donorAddress, amount, message, status });
      });
    });
  }

  static getDonation(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM donations WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  static getAllDonations(limit = 100) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM donations ORDER BY created_at DESC LIMIT ?',
        [limit],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  static getDonationsByStatus(status) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM donations WHERE status = ? ORDER BY created_at DESC',
        [status],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  static getDonationsByCampaign(campaignId) {
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

  static updateDonationStatus(id, status, txId = null) {
    return new Promise((resolve, reject) => {
      const sql = txId
        ? 'UPDATE donations SET status = ?, tx_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        : 'UPDATE donations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

      const params = txId ? [status, txId, id] : [status, id];

      db.run(sql, params, function (err) {
        if (err) return reject(err);
        DonationService.addHistory(id, status, `Status updated to ${status}`).catch(() => {});
        resolve({ id, status });
      });
    });
  }

  static addHistory(donationId, status, details = '') {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      db.run(
        'INSERT INTO donation_history (id, donation_id, status, details) VALUES (?, ?, ?, ?)',
        [id, donationId, status, details],
        function (err) {
          if (err) return reject(err);
          resolve({ id });
        }
      );
    });
  }

  static getStatistics() {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT
          COUNT(*) as total_donations,
          SUM(amount) as total_amount,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
        FROM donations`,
        [],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  }
}

module.exports = DonationService;
