require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { db, initDb, ensureMigrations } = require('./database');
const DonationService = require('./donation-service');
const CampaignService = require('./campaign-service');
const lightwalletd = require('./lightwalletd-client').sharedClient;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

initDb();
ensureMigrations();

const isLikelyZcashAddress = (addr) => {
  if (!addr || typeof addr !== 'string') return false;
  const s = addr.trim();
  if (!s) return false;
  // Reject obvious placeholders and strings with underscores or spaces
  if (s.toLowerCase().includes('your_local') || s.indexOf(' ') !== -1 || s.indexOf('_') !== -1) return false;
  // Basic check: starts with t or z and is alphanumeric afterwards (len >= 10)
  return /^(t|z)[A-Za-z0-9]{10,}$/.test(s);
};

// ── Campaign Routes ──

// Create campaign
app.post('/api/campaigns', async (req, res) => {
  try {
    const { title, description, target_amount, deadline, donation_address } = req.body;
    if (!title || !target_amount) {
      return res.status(400).json({ error: 'Title and target_amount are required' });
    }
    if (!donation_address || !String(donation_address).trim() || !isLikelyZcashAddress(donation_address)) {
      return res.status(400).json({ error: 'donation_address is required and must be a valid t- or z- receiving wallet address (no placeholders)'});
    }
    if (target_amount <= 0) {
      return res.status(400).json({ error: 'Target amount must be greater than 0' });
    }
    const campaign = await CampaignService.createCampaign(
      title, description, target_amount, deadline, donation_address
    );
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all campaigns
app.get('/api/campaigns', async (req, res) => {
  try {
    const campaigns = await CampaignService.getAllCampaigns();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign by ID
app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const campaign = await CampaignService.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign by slug (shareable link)
app.get('/api/campaigns/slug/:slug', async (req, res) => {
  try {
    const campaign = await CampaignService.getCampaignBySlug(req.params.slug);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update campaign deadline
app.patch('/api/campaigns/:id/deadline', async (req, res) => {
  try {
    const { deadline } = req.body;
    if (!deadline) return res.status(400).json({ error: 'Deadline is required' });
    const updated = await CampaignService.updateCampaignDeadline(req.params.id, deadline);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blockchain data for a campaign (on-chain received amount + tx list)
app.get('/api/campaigns/:id/blockchain', async (req, res) => {
  try {
    const campaign = await CampaignService.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const data = await CampaignService.getCampaignBlockchainData(campaign.donation_address);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get manual donations for a campaign
app.get('/api/campaigns/:id/donations', async (req, res) => {
  try {
    const campaign = await CampaignService.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const donations = await DonationService.getDonationsByCampaign(req.params.id);
    res.json(donations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record a manual donation to a campaign
app.post('/api/campaigns/:id/donations', async (req, res) => {
  try {
    const { amount, donor_address, message, tx_id } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    const donation = await DonationService.createDonation(
      req.params.id, amount, donor_address || '', message || ''
    );
    if (tx_id) {
      await DonationService.updateDonationStatus(donation.id, 'completed', tx_id);
    }
    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Existing Donation Routes (kept for backward compat) ──

app.post('/api/donations', async (req, res) => {
  try {
    const { address, amount, message } = req.body;
    if (!address || !amount) {
      return res.status(400).json({ error: 'Missing required fields: address, amount' });
    }
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    const donation = await DonationService.createDonation(null, amount, address, message || '');
    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/donations', async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const donations = await DonationService.getAllDonations(parseInt(limit));
    res.json(donations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/donations/:id', async (req, res) => {
  try {
    const donation = await DonationService.getDonation(req.params.id);
    if (!donation) return res.status(404).json({ error: 'Donation not found' });
    res.json(donation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/donations/status/:status', async (req, res) => {
  try {
    const donations = await DonationService.getDonationsByStatus(req.params.status);
    res.json(donations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/donations/:id', async (req, res) => {
  try {
    const { status, tx_id } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });
    const updated = await DonationService.updateDonationStatus(req.params.id, status, tx_id || null);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Statistics ──

app.get('/api/statistics', async (req, res) => {
  try {
    const stats = await DonationService.getStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Wallet ──

app.get('/api/wallet/balance', async (req, res) => {
  try {
    const balance = await lightwalletd.getWalletBalance();
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wallet/address', async (req, res) => {
  try {
    if (req.body && req.body.address) {
      const address = await lightwalletd.setReceiveAddress(req.body.address);
      return res.json({ address, source: 'local-wallet' });
    }

    const address = await lightwalletd.getNewAddress();
    res.json({ address, source: 'local-wallet' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Blockchain Info ──

app.get('/api/blockchain/info', async (req, res) => {
  try {
    const info = await lightwalletd.getBlockchainInfo();
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

app.listen(PORT, () => {
  console.log(`Zcash Donation API server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  db.close((err) => {
    if (err) console.error(err.message);
    console.log('Database connection closed');
    process.exit(0);
  });
});
