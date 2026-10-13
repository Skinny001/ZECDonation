require('dotenv').config();

const required = [
  'ZCASH_NETWORK',
  'WALLET_BACKEND',
  'ESCROW_ACCOUNT_ID',
];

const config = {
  network: process.env.ZCASH_NETWORK || 'testnet',
  walletBackend: process.env.WALLET_BACKEND || 'mock',
  zalletRpcUrl: process.env.ZALLET_RPC_URL || 'http://127.0.0.1:8232',
  escrowAccountId: parseInt(process.env.ESCROW_ACCOUNT_ID || '0', 10),
  includeSaplingReceiver: process.env.INCLUDE_SAPLING_RECEIVER === 'true',
  confirmSeconds: parseInt(process.env.CONFIRM_SECONDS || '300', 10),
  reorgBufferSeconds: parseInt(process.env.REORG_BUFFER_SECONDS || '3600', 10),
  payoutSettleSeconds: parseInt(process.env.PAYOUT_SETTLE_SECONDS || '600', 10),
  minDonationZat: BigInt(process.env.MIN_DONATION_ZAT || '10000'),
  minTopupPayoutZat: BigInt(process.env.MIN_TOPUP_PAYOUT_ZAT || '1000000'),
  topupMaxWaitHours: parseInt(process.env.TOPUP_MAX_WAIT_HOURS || '72', 10),
  syncIntervalMs: parseInt(process.env.SYNC_INTERVAL_MS || '10000', 10),
  platformFeeBps: parseInt(process.env.PLATFORM_FEE_BPS || '0', 10),
  maxCampaignDays: parseInt(process.env.MAX_CAMPAIGN_DAYS || '365', 10),
  dbPath: process.env.DB_PATH || './data/zecdonation.db',
  port: parseInt(process.env.PORT || '3000', 10),
};

for (const req of required) {
  if (!process.env[req] && !config[req]) {
    console.warn(`WARNING: Missing environment variable ${req}`);
  }
}

if (config.network !== 'testnet' && config.network !== 'mainnet') {
  throw new Error(`Invalid ZCASH_NETWORK: ${config.network}. Must be 'testnet' or 'mainnet'.`);
}

module.exports = config;
