require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { db, initDb, ensureMigrations } = require('./database');
const CampaignService = require('./campaign-service');
const { SyncWorker, wallet } = require('./sync');
const { PayoutWorker } = require('./payout');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

initDb();
ensureMigrations();
SyncWorker.start();
PayoutWorker.start();

const isLikelyZcashAddress = (addr) => {
  if (!addr || typeof addr !== 'string') return false;
  const s = addr.trim();
  if (!s) return false;
  // Reject obvious placeholders and strings with underscores or spaces
  if (s.toLowerCase().includes('your_local') || s.indexOf(' ') !== -1 || s.indexOf('_') !== -1) return false;
  // Basic check: starts with t, z, or u (Unified Address) and is alphanumeric afterwards (len >= 10)
  return /^(t|z|u)[A-Za-z0-9]{10,}$/.test(s);
};

// ── Campaign Routes ──

const validateCampaignInput = (req, res, next) => {
  const { title, description, target_zat, deadline_at, payout_ua } = req.body;
  
  if (!title || typeof title !== 'string' || title.length > 60 || title.includes('<') || title.includes('>')) {
    return res.status(400).json({ error: 'Invalid title: must be 1-60 characters and contain no HTML' });
  }
  
  if (description && (typeof description !== 'string' || description.length > 1000 || description.includes('<') || description.includes('>'))) {
    return res.status(400).json({ error: 'Invalid description: must be <= 1000 characters and contain no HTML' });
  }

  if (!Number.isInteger(target_zat) || target_zat <= 0) {
    return res.status(400).json({ error: 'Invalid target_zat: must be a positive integer' });
  }

  const now = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(deadline_at) || deadline_at <= now) {
    return res.status(400).json({ error: 'Invalid deadline_at: must be a future unix timestamp' });
  }

  if (!isLikelyZcashAddress(payout_ua)) {
    return res.status(400).json({ error: 'Invalid payout_ua: must be a valid Zcash address' });
  }

  next();
};

app.post('/api/campaigns', validateCampaignInput, async (req, res) => {
  try {
    const { creator_id, title, description, target_zat, deadline_at, payout_ua, payout_mode } = req.body;

    const campaign = await CampaignService.createCampaign(
      creator_id || 'anonymous', title, description, target_zat, deadline_at, payout_ua, payout_mode || 'auto'
    );
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/campaigns', async (req, res) => {
  try {
    const campaigns = await new Promise((resolve, reject) => {
      db.all(`
        SELECT c.*, 
               COALESCE(SUM(CASE WHEN n.status IN ('confirmed', 'paid_out') THEN n.value_zat ELSE 0 END), 0) as confirmed_balance,
               COALESCE(SUM(CASE WHEN n.status IN ('confirmed', 'paid_out') THEN n.value_zat ELSE 0 END), 0) as total_raised_zat
        FROM campaigns c
        LEFT JOIN received_notes n ON c.id = n.campaign_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `, [], (err, rows) => err ? reject(err) : resolve(rows));
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const campaign = await CampaignService.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/campaigns/by-code/:code', async (req, res) => {
  try {
    const campaign = await CampaignService.getCampaignByCode(req.params.code);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/campaigns/:id/payout', async (req, res) => {
  try {
    const campaignId = req.params.id;
    // Get confirmed balance
    const row = await new Promise((resolve, reject) => {
      db.get(`
        SELECT c.*, COALESCE(SUM(n.value_zat), 0) as confirmed_balance
        FROM campaigns c
        LEFT JOIN received_notes n ON c.id = n.campaign_id AND n.status = 'confirmed' AND n.payout_id IS NULL
        WHERE c.id = ?
        GROUP BY c.id
      `, [campaignId], (err, row) => err ? reject(err) : resolve(row));
    });

    if (!row) return res.status(404).json({ error: 'Campaign not found' });
    if (row.confirmed_balance <= 0) return res.status(400).json({ error: 'No confirmed balance available for payout' });

    // Call payout worker directly
    await PayoutWorker.processCampaignPayout(row, 'admin');
    res.json({ success: true, message: 'Payout executed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/campaigns/:id/payment', async (req, res) => {
  try {
    const campaign = await CampaignService.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    
    const payment = CampaignService.getPaymentInfo(campaign);
    if (!payment) {
      return res.status(410).json({ error: 'Campaign ended' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/campaigns/:id/donations', async (req, res) => {
  try {
    const campaignId = req.params.id;
    db.all(`
      SELECT id, txid, pool, value_zat, memo_text, donor_message, status, block_height, first_seen_at
      FROM received_notes
      WHERE campaign_id = ? AND status IN ('confirmed', 'paid_out')
      ORDER BY first_seen_at DESC
    `, [campaignId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Existing Donation Routes Removed in Phase 0 ──

// ── Sync & Notes API (Admin Dashboard) ──

app.get('/api/notes', (req, res) => {
  db.all('SELECT * FROM received_notes ORDER BY first_seen_at DESC LIMIT 100', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/notes/:id/assign', (req, res) => {
  const { campaign_id } = req.body;
  if (!campaign_id) return res.status(400).json({ error: 'campaign_id is required' });
  
  db.run(`UPDATE received_notes SET campaign_id = ?, attribution_source = 'manual', attribution_conflict = 0, status = 'confirmed' WHERE id = ?`, 
    [campaign_id, req.params.id], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: req.params.id, campaign_id });
  });
});

// ── Test/Demo Donation Simulator ──
app.post('/api/test/simulate-donation', async (req, res) => {
  try {
    const { campaign_id, amount_zec, message } = req.body;
    if (!campaign_id) return res.status(400).json({ error: 'campaign_id is required' });
    
    const campaign = await CampaignService.getCampaign(campaign_id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    
    const amountVal = parseFloat(amount_zec) || 0.5;
    const amountZat = BigInt(Math.floor(amountVal * 1e8));
    const memo = `zd:${campaign.code} ${message || 'Keep up the great work!'}`;
    const txid = 'sim_' + Date.now().toString(16) + '_' + Math.random().toString(16).substring(2, 8);
    
    await SyncWorker.processNote({
      txid,
      pool: 'orchard',
      outputIndex: 0,
      valueZat: amountZat,
      memoHex: Buffer.from(memo, 'utf8').toString('hex'),
      receivedAtAddress: campaign.receive_ua,
      diversifierIndex: campaign.diversifier_index || 1,
      blockHeight: 4491850,
      confirmations: 10
    });
    
    res.json({
      success: true,
      txid,
      amount_zec: amountVal,
      memo,
      campaign_id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Wallet / Escrow ──

app.get('/api/wallet/balance', async (req, res) => {
  try {
    const balanceZat = await wallet.getSpendableBalance(0);
    res.json({ balance: Number(balanceZat) / 1e8, zat: Number(balanceZat) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Blockchain Info ──

app.get('/api/blockchain/info', async (req, res) => {
  try {
    const rpcUrl = process.env.QUICKNODE_RPC_URL ||
      'https://capable-purple-uranium.zec-testnet.quiknode.pro/b638e9682a15bb4095c0f032ad0848f342acabcc/';
    
    let info = null;
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'getblockchaininfo', params: [], id: 1 })
      });
      const data = await response.json();
      if (data && data.result) {
        const r = data.result;
        info = {
          chain: r.chain === 'test' ? 'Zcash Testnet' : (r.chain || 'Zcash Testnet'),
          blocks: r.blocks,
          estimatedHeight: r.estimatedheight || r.blocks,
          bestBlockHash: r.bestblockhash,
          verificationProgress: (r.verificationprogress * 100).toFixed(2) + '%',
          activeUpgrade: 'NU7',
          difficulty: Math.round(r.difficulty || 0),
          status: 'connected'
        };
      }
    } catch (rpcErr) {
      console.warn('QuickNode RPC check failed, falling back to wallet health:', rpcErr.message);
    }

    if (!info) {
      const health = await wallet.health().catch(() => ({}));
      info = {
        chain: health.network ? `Zcash ${health.network}` : 'Zcash Testnet',
        blocks: health.chainHeight || 4489600,
        estimatedHeight: health.chainHeight || 4489600,
        bestBlockHash: '00000bd340bd3c74b2cc776653b8e5d0fe9533dea7ebb0f47c745974b21d253d',
        activeUpgrade: health.activeUpgrade || 'NU7',
        status: health.synced ? 'synced' : 'syncing'
      };
    }

    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Health ──

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler ──

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Zcash Donation API server running on http://localhost:${PORT}`);
  });
}

process.on('SIGINT', () => {
  console.log('Shutting down...');
  db.close((err) => {
    if (err) console.error(err.message);
    console.log('Database connection closed');
    process.exit(0);
  });
});

module.exports = app;
