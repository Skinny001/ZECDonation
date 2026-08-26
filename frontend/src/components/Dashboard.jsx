import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function Dashboard({ onSelect }) {
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTipQr, setShowTipQr] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getStatistics().catch(() => null),
      api.getCampaigns().catch(() => []),
    ])
      .then(([s, c]) => {
        setStats(s);
        setCampaigns(c);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        Failed to load dashboard: {error.message}
      </div>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const totalRaised = campaigns.reduce(
    (s, c) => s + (stats?.total_amount ? parseFloat(stats.total_amount) : 0),
    0
  );

  return (
    <div>
<div id="zectip" style={{ display: 'inline-block', textAlign: 'center', fontFamily: 'sans-serif', marginBottom: '20px', width: '100%' }}>
  <button
    onClick={() => setShowTipQr(!showTipQr)}
    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '999px', background: '#f4b942', color: '#0c0c0d', border: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
    ⚡ Tip me in ZEC
  </button>
  {showTipQr && (
    <div id="zectip-qr" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
      <img
        src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=zcash%3Autest1ct89nsculkxuqjsdj70neu7v9ggtqpjqd8lt3kxpyqfh3hw9qwplv8ua82q4vdwspv68n6kgkllwkum7czvutrf6qf8ug0pwpgxz3hq4%3Fmemo%3DThanks%2520for%2520supporting%2520my%2520work!"
        width="180" height="180"
        alt="Scan to tip in ZEC"
        style={{ borderRadius: '12px' }} />
      <p style={{ fontSize: '10px', fontFamily: 'monospace', color: '#888', wordBreak: 'break-all', maxWidth: '220px' }}>utest1ct89nsculkxuqjsdj70neu7v9ggtqpjqd8lt3kxpyqfh3hw9qwplv8ua82q4vdwspv68n6kgkllwkum7czvutrf6qf8ug0pwpgxz3hq4</p>
      <p style={{ fontSize: '12px', color: '#aaa', fontStyle: 'italic' }}>"Thanks for supporting my work!"</p>
      <span style={{ fontSize: '11px', color: '#3ecfb2' }}>🔒 shielded transaction</span>
    </div>
  )}
</div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{campaigns.length}</div>
          <div className="stat-label">Total Campaigns</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeCampaigns.length}</div>
          <div className="stat-label">Active Campaigns</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.total_donations ?? 0}</div>
          <div className="stat-label">Donations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {stats?.total_amount
              ? parseFloat(stats.total_amount).toFixed(4)
              : '0.0000'}
          </div>
          <div className="stat-label">Total ZEC Donated</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.completed_count ?? 0}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {campaigns.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Campaigns Overview</h2>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => onSelect && onSelect(c.id)}
                    style={{ cursor: 'pointer' }}
                    className="clickable-row"
                  >
                    <td style={{ fontWeight: 600 }}>{c.title}</td>
                    <td>{c.target_amount} ZEC</td>
                    <td>
                      <span className={`badge badge-${c.status === 'active' ? 'completed' : c.status}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {c.deadline
                        ? new Date(c.deadline).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
