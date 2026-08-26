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
  getCampaignBySlug: (slug) => request(`/campaigns/slug/${slug}`),
  createCampaign: (data) =>
    request('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  updateCampaignDeadline: (id, deadline) =>
    request(`/campaigns/${id}/deadline`, { method: 'PATCH', body: JSON.stringify({ deadline }) }),
  getCampaignBlockchain: (id) => request(`/campaigns/${id}/blockchain`),
  getCampaignDonations: (id) => request(`/campaigns/${id}/donations`),
  recordDonation: (campaignId, data) =>
    request(`/campaigns/${campaignId}/donations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Donations (backward compat)
  getDonations: (limit = 100) => request(`/donations?limit=${limit}`),
  getDonation: (id) => request(`/donations/${id}`),
  getDonationsByStatus: (status) => request(`/donations/status/${status}`),
  createDonation: (data) =>
    request('/donations', { method: 'POST', body: JSON.stringify(data) }),
  updateDonation: (id, data) =>
    request(`/donations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Stats
  getStatistics: () => request('/statistics'),

  // Wallet
  getWalletBalance: () => request('/wallet/balance'),
  generateAddress: () =>
    request('/wallet/address', { method: 'POST' }),

  // Blockchain
  getBlockchainInfo: () => request('/blockchain/info'),
};
