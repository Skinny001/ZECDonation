import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function CampaignList({ onSelect, onCreate }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCampaigns = () => {
    setLoading(true);
    setError(null);
    api.getCampaigns()
      .then(setCampaigns)
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCampaigns();
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
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 580, margin: '40px auto' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>Unable to load campaigns</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
          {error.message || 'Please check your connection or ensure the backend server is running.'}
        </p>
        <button className="btn btn-secondary" onClick={loadCampaigns}>
          🔄 Try Again
        </button>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '64px 24px', maxWidth: 640, margin: '40px auto' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>No Campaigns Yet</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>
          There are currently no active donation campaigns on the platform. Be the first to start a privacy-preserving fundraiser!
        </p>
        {onCreate && (
          <button className="btn btn-primary" onClick={onCreate} style={{ padding: '12px 28px', fontSize: 15 }}>
            + Start Your First Campaign
          </button>
        )}
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
              <span className={`badge badge-${c.status === 'paid_out' ? 'completed' : (c.status === 'active' ? 'completed' : c.status)}`}>
                {c.status === 'paid_out' ? 'Completed 🎉' : (c.status === 'active' ? 'Active' : c.status)}
              </span>
            </div>
            <p className="campaign-card-desc">
              {c.description || 'No description'}
            </p>
            <div className="campaign-card-meta">
              <span>🎯 Target: {c.target_zat ? (c.target_zat / 1e8).toFixed(2) : (c.target_amount || 0)} ZEC</span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                💰 Raised: {((c.total_raised_zat || c.confirmed_balance || 0) / 1e8).toFixed(4)} ZEC
              </span>
            </div>
            {c.target_zat ? (
              <div style={{ marginTop: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>{Math.min(100, (((c.total_raised_zat || c.confirmed_balance || 0) / c.target_zat) * 100)).toFixed(1)}% funded</span>
                </div>
                <div className="progress-bar" style={{ height: 6 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, (((c.total_raised_zat || c.confirmed_balance || 0) / c.target_zat) * 100))}%`
                    }}
                  />
                </div>
              </div>
            ) : null}
            <div className="campaign-card-address mono">
              📍 {c.receive_ua ? `${c.receive_ua.slice(0, 16)}…${c.receive_ua.slice(-8)}` : (c.donation_address || '')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
