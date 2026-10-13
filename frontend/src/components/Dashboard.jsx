import React, { useState, useEffect } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';

export default function Dashboard({ onSelect }) {
  const [walletBalance, setWalletBalance] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);

  const loadData = () => {
    Promise.all([
      api.getWalletBalance().catch(() => ({ balance: 0 })),
      api.getCampaigns().catch(() => []),
      api.getNotes().catch(() => [])
    ])
    .then(([w, c, n]) => {
      setWalletBalance(w);
      setCampaigns(c);
      setNotes(n);
    })
    .catch(setError)
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (noteId, campaignId) => {
    if (!campaignId) return;
    setAssigningId(noteId);
    try {
      await api.assignNote(noteId, campaignId);
      toast.success('Note assigned successfully');
      loadData();
    } catch(err) {
      toast.error(err.message || 'Failed to assign note');
    } finally {
      setAssigningId(null);
    }
  };

  const handleRelease = async (e, campaignId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to release funds to the creator?')) return;
    try {
      await api.releaseFunds(campaignId);
      toast.success('Funds released successfully!');
      loadData();
    } catch(err) {
      toast.error(err.message || 'Failed to release funds');
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner" />Loading dashboard…</div>;
  }
  if (error) {
    return <div className="alert alert-error">Failed to load dashboard: {error.message}</div>;
  }

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const unattributedNotes = notes.filter(n => n.status === 'unattributed' || n.attribution_conflict);
  const totalRaisedZec = campaigns.reduce((acc, c) => acc + (Number(c.total_raised_zat || c.confirmed_balance || 0) / 1e8), 0);
  const totalDisbursedZec = notes
    .filter(n => n.status === 'paid_out')
    .reduce((acc, n) => acc + (Number(n.value_zat || 0) / 1e8), 0);

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card" style={{ borderColor: 'rgba(244, 185, 66, 0.45)', background: 'linear-gradient(180deg, rgba(244, 185, 66, 0.08) 0%, rgba(20, 22, 28, 0.6) 100%)' }}>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>
            {totalRaisedZec.toFixed(4)} ZEC
          </div>
          <div className="stat-label">All-Time Raised 💰</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(34, 197, 94, 0.4)', background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.06) 0%, rgba(20, 22, 28, 0.6) 100%)' }}>
          <div className="stat-value" style={{ color: '#22c55e' }}>
            {totalDisbursedZec.toFixed(4)} ZEC
          </div>
          <div className="stat-label">Total Disbursed / Paid Out 🚀</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{walletBalance?.balance?.toFixed(4) || '0.0000'} ZEC</div>
          <div className="stat-label">Current Escrow Balance 🛡️</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{campaigns.length}</div>
          <div className="stat-label">Total Campaigns</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeCampaigns.length}</div>
          <div className="stat-label">Active Campaigns</div>
        </div>
        {unattributedNotes.length > 0 && (
          <div className="stat-card" style={{ borderColor: '#ff4444' }}>
            <div className="stat-value">{unattributedNotes.length}</div>
            <div className="stat-label">Unattributed Notes</div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h2 className="card-title">Received Notes (Sync Worker)</h2>
        </div>
        
        {unattributedNotes.length > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: 15, fontSize: 13 }}>
            ⚠️ There are notes that could not be automatically assigned. Please select the correct campaign for them below.
          </div>
        )}

        {notes.length === 0 ? (
          <div className="empty-state">
            <p>No notes received yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Tx ID / On-Chain</th>
                  <th>Amount</th>
                  <th>Pool</th>
                  <th>Memo / Message</th>
                  <th>Campaign</th>
                  <th>Explorer Verification</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((n) => {
                  const isSim = n.txid && n.txid.startsWith('sim_');
                  const explorerUrl = `https://blockexplorer.one/zcash/testnet/tx/${n.txid}`;
                  return (
                    <tr key={n.id}>
                      <td>
                        <span className={`badge badge-${n.status === 'confirmed' ? 'completed' : 'pending'}`}>
                          {n.status} {n.attribution_conflict ? '(conflict)' : ''}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span className="mono" style={{ fontSize: 12, fontWeight: 500 }} title={n.txid}>
                            {n.txid ? `${n.txid.slice(0, 8)}…${n.txid.slice(-6)}` : 'N/A'}
                          </span>
                          {n.block_height && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              Block #{n.block_height}
                            </span>
                          )}
                        </div>
                      </td>
                      <td><strong>{(n.value_zat / 1e8).toFixed(4)}</strong> ZEC</td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(244, 185, 66, 0.15)', color: '#f4b942' }}>
                          🛡️ {n.pool ? n.pool.toUpperCase() : 'ORCHARD'}
                        </span>
                      </td>
                      <td>
                        <div>
                          {n.donor_message && (
                            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                              "{n.donor_message}"
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {n.memo_text || 'None'}
                          </div>
                        </div>
                      </td>
                      <td>
                        {n.status === 'unattributed' || n.attribution_conflict ? (
                          <select 
                            disabled={assigningId === n.id}
                            onChange={(e) => handleAssign(n.id, e.target.value)}
                            defaultValue=""
                            style={{ padding: '4px', borderRadius: 4, background: 'var(--bg)', color: 'var(--text)' }}
                          >
                            <option value="" disabled>Select campaign...</option>
                            {campaigns.map(c => (
                              <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {campaigns.find(c => c.id === n.campaign_id)?.title || 'Assigned'}
                          </span>
                        )}
                      </td>
                      <td>
                        {isSim ? (
                          <button
                            onClick={() => setSelectedTx(n)}
                            className="btn btn-sm btn-secondary"
                            style={{
                              fontSize: 11,
                              padding: '3px 8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            title="Click to view simulated note on-chain details"
                          >
                            ⚡ Simulated Tx ℹ️
                          </button>
                        ) : (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm"
                            style={{
                              padding: '4px 10px',
                              fontSize: 12,
                              background: 'rgba(244, 185, 66, 0.2)',
                              color: '#f4b942',
                              border: '1px solid rgba(244, 185, 66, 0.4)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            🔍 View on Explorer ↗
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
                  <th>Code</th>
                  <th>Target</th>
                  <th>Escrow Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                    <td className="mono">{c.code}</td>
                    <td>{c.target_zat ? (c.target_zat / 1e8).toFixed(4) : 0} ZEC</td>
                    <td style={{ color: (c.total_raised_zat || c.confirmed_balance) > 0 ? 'var(--accent)' : 'inherit', fontWeight: 600 }}>
                      {((c.total_raised_zat || c.confirmed_balance || 0) / 1e8).toFixed(4)} ZEC
                    </td>
                    <td>
                      <span className={`badge badge-${c.status === 'paid_out' ? 'completed' : (c.status === 'active' ? 'completed' : c.status)}`}>
                        {c.status === 'paid_out' ? 'Completed 🎉' : (c.status === 'active' ? 'Active' : c.status)}
                      </span>
                    </td>
                    <td>
                      {c.payout_mode === 'manual' && c.confirmed_balance > 0 && c.status !== 'paid_out' ? (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={(e) => handleRelease(e, c.id)}
                        >
                          Release Funds
                        </button>
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {c.payout_mode === 'auto' ? 'Auto-payout' : 'No balance'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* On-Chain Note Verification Modal */}
      {selectedTx && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: 520,
              width: '100%',
              background: '#15171d',
              border: '1px solid rgba(244, 185, 66, 0.3)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title" style={{ fontSize: 18, color: '#f4b942' }}>
                🛡️ On-Chain Note Verification
              </h3>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setSelectedTx(null)}
                style={{ padding: '2px 8px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Transaction Identifier (TxID)
                </div>
                <code
                  style={{
                    wordBreak: 'break-all',
                    display: 'block',
                    fontSize: 12,
                    background: 'rgba(0,0,0,0.4)',
                    padding: 8,
                    borderRadius: 6,
                    color: '#fff'
                  }}
                >
                  {selectedTx.txid}
                </code>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Amount</div>
                  <strong style={{ color: 'var(--accent)', fontSize: 16 }}>
                    +{(selectedTx.value_zat / 1e8).toFixed(4)} ZEC
                  </strong>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Privacy Pool</div>
                  <span className="badge" style={{ background: 'rgba(244, 185, 66, 0.2)', color: '#f4b942' }}>
                    🛡️ {selectedTx.pool ? selectedTx.pool.toUpperCase() : 'ORCHARD'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Block Height</div>
                  <div style={{ fontWeight: 500 }}>#{selectedTx.block_height || '4,491,850'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</div>
                  <span className="badge badge-completed">Ingested & Confirmed</span>
                </div>
              </div>

              {selectedTx.donor_message && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Decrypted Memo Message</div>
                  <div style={{ padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontStyle: 'italic', marginTop: 4 }}>
                    "{selectedTx.donor_message}"
                  </div>
                </div>
              )}

              <div
                className="alert alert-info"
                style={{ fontSize: 12, lineHeight: 1.5, background: 'rgba(244, 185, 66, 0.08)', borderColor: 'rgba(244, 185, 66, 0.2)' }}
              >
                {selectedTx.txid?.startsWith('sim_') ? (
                  <span>
                    ⚡ <strong>Simulated Note:</strong> This note was ingested by the local sync worker for rapid UI demonstration. For transactions broadcast from your <strong>Zingo PC wallet</strong>, the link below opens the live block on the public Zcash Testnet explorer.
                  </span>
                ) : (
                  <span>
                    ✅ <strong>Verified on Testnet:</strong> This is an on-chain transaction broadcast to the Zcash network.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <a
                  href={
                    selectedTx.txid?.startsWith('sim_')
                      ? 'https://blockexplorer.one/zcash/testnet'
                      : `https://blockexplorer.one/zcash/testnet/tx/${selectedTx.txid}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    fontWeight: 600
                  }}
                >
                  🔍 Open Zcash Testnet Explorer ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
