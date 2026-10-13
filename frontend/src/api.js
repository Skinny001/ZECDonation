const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => request('/health'),

  // Campaigns
  getCampaigns: () => request('/campaigns'),
  getCampaign: (id) => request(`/campaigns/${id}`),
  getCampaignByCode: (code) => request(`/campaigns/by-code/${code}`),
  createCampaign: (data) =>
    request('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  getCampaignPayment: (id) => request(`/campaigns/${id}/payment`),
  releaseFunds: (id) => request(`/campaigns/${id}/payout`, { method: 'POST' }),
  updateCampaignDeadline: (id, deadline) =>
    request(`/campaigns/${id}/deadline`, { method: 'PATCH', body: JSON.stringify({ deadline }) }),
  getCampaignBlockchain: (id) => request(`/campaigns/${id}/blockchain`),
  getCampaignDonations: (id) => request(`/campaigns/${id}/donations`),

  // Notes (Sync Worker Dashboard)
  getNotes: () => request('/notes'),
  assignNote: (id, campaign_id) => request(`/notes/${id}/assign`, { method: 'POST', body: JSON.stringify({ campaign_id }) }),

  // Stats
  getStatistics: () => request('/statistics').catch(() => ({})), // Removed backend for this for now

  // Wallet
  getWalletBalance: () => request('/wallet/balance'),

  // Blockchain
  getBlockchainInfo: () => request('/blockchain/info'),

  // Test / Demo Simulation
  simulateDonation: (data) => request('/test/simulate-donation', { method: 'POST', body: JSON.stringify(data) }),
};
