import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function CampaignList({ onSelect }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getCampaigns()
      .then(setCampaigns)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading campaigns…
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        Could not load campaigns: {error.message}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🎯</div>
        <h2 style={{ marginBottom: 8 }}>No campaigns yet</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          Be the first to start a donation campaign.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="card-header" style={{ padding: '0 0 16px 0' }}>
        <h2 className="card-title" style={{ fontSize: 22 }}>All Campaigns</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="campaign-grid">
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="campaign-card"
            onClick={() => onSelect(c.id)}
          >
            <div className="campaign-card-header">
              <h3 className="campaign-card-title">{c.title}</h3>
              <span className={`badge badge-${c.status === 'active' ? 'completed' : c.status}`}>
                {c.status}
              </span>
            </div>
            <p className="campaign-card-desc">
              {c.description || 'No description'}
            </p>
            <div className="campaign-card-meta">
              <span>🎯 {c.target_amount} ZEC</span>
              {c.deadline && (
                <span>📅 {new Date(c.deadline).toLocaleDateString()}</span>
              )}
            </div>
            <div className="campaign-card-address mono">
              📍 {c.donation_address}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
