import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function BlockchainInfo() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInfo = () => {
    setLoading(true);
    setError(null);
    api.getBlockchainInfo()
      .then(setInfo)
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Fetching live Zcash blockchain info…
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 560, margin: '40px auto' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>Could not reach Zcash Node</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
          {error.message || 'Unable to fetch blockchain state from the active node RPC.'}
        </p>
        <button className="btn btn-secondary" onClick={fetchInfo}>
          🔄 Retry Connection
        </button>
      </div>
    );
  }

  const fields = [
    { label: 'Network', value: info?.chain || 'Zcash Testnet' },
    { label: 'Current Block Height', value: info?.blocks ? info.blocks.toLocaleString() : '—' },
    { label: 'Estimated Tip Height', value: info?.estimatedHeight ? info.estimatedHeight.toLocaleString() : '—' },
    { label: 'Active Network Upgrade', value: info?.activeUpgrade || 'NU7' },
    { label: 'Sync Verification Progress', value: info?.verificationProgress || '100%' },
    { label: 'Network Difficulty', value: info?.difficulty ? info.difficulty.toLocaleString() : '—' },
    { label: 'Latest Block Hash', value: info?.bestBlockHash || '—', mono: true },
  ];

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="card-title">Zcash Network & Blockchain Info</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Real-time testnet node parameters and shielded consensus state
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-completed">
            ● {info?.status === 'connected' ? 'Connected & Synced' : 'Online'}
          </span>
          <button
            className="btn btn-secondary"
            onClick={fetchInfo}
            style={{ padding: '6px 12px', fontSize: 13 }}
            title="Refresh state"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="detail-grid" style={{ marginTop: 20 }}>
        {fields.map((f) => (
          <div className="detail-item" key={f.label} style={f.mono ? { gridColumn: '1 / -1' } : {}}>
            <div className="detail-label">{f.label}</div>
            <div className={`detail-value ${f.mono ? 'mono' : ''}`} style={f.mono ? { wordBreak: 'break-all', fontSize: 13 } : {}}>
              {f.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
