import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { QRCodeSVG } from 'qrcode.react';

export default function CampaignDetail({ id, onBack }) {
  const [campaign, setCampaign] = useState(null);
  const [chainData, setChainData] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Donate modal state
  const [showDonate, setShowDonate] = useState(false);
  const [donorAddr, setDonorAddr] = useState('');
  const [amount, setAmount] = useState('');
  const [txId, setTxId] = useState('');
  const [donateMsg, setDonateMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [donateResult, setDonateResult] = useState(null);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Extend deadline state
  const [isExtending, setIsExtending] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');
  const [extendSubmitting, setExtendSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getCampaign(id),
      api.getCampaignBlockchain(id).catch(() => null),
      api.getCampaignDonations(id).catch(() => []),
    ])
      .then(([c, chain, d]) => {
        setCampaign(c);
        setChainData(chain);
        setDonations(d);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyAddress = () => {
    if (campaign?.donation_address) {
      navigator.clipboard.writeText(campaign.donation_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitDonation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setDonateResult(null);
    try {
      const result = await api.recordDonation(id, {
        amount: parseFloat(amount),
        donor_address: donorAddr,
        tx_id: txId,
        message: donateMsg,
      });
      setDonateResult(result);
      setAmount('');
      setDonorAddr('');
      setTxId('');
      setDonateMsg('');
      setShowDonate(false);
      const updated = await api.getCampaignDonations(id).catch(() => []);
      setDonations(updated);
    } catch (err) {
      setDonateResult({ error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExtendDeadline = async () => {
    if (!newDeadline) return;
    setExtendSubmitting(true);
    try {
      await api.updateCampaignDeadline(id, newDeadline);
      const updatedCampaign = await api.getCampaign(id);
      setCampaign(updatedCampaign);
      setIsExtending(false);
    } catch (err) {
      alert(err.message || 'Failed to extend deadline');
    } finally {
      setExtendSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading campaign…
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button className="back-btn" onClick={onBack}>← Back to Campaigns</button>
        <div className="alert alert-error">{error.message}</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div>
        <button className="back-btn" onClick={onBack}>← Back to Campaigns</button>
        <div className="alert alert-error">Campaign not found</div>
      </div>
    );
  }

  const isExpired = campaign.deadline && new Date(campaign.deadline) < new Date();
  const shareUrl = `${window.location.origin}/donate/${campaign.slug}`;

  const syncedTotal = chainData?.total_received != null
    ? parseFloat(chainData.txs.reduce((sum, t) => sum + Math.abs(t.amount), 0))
    : null;

  const manualTotal = donations.reduce((s, d) => s + (d.status === 'completed' ? d.amount : 0), 0);
  const displayRaised = syncedTotal != null ? syncedTotal : manualTotal;
  const progress = campaign.target_amount > 0
    ? Math.min(100, (displayRaised / campaign.target_amount) * 100)
    : 0;

  return (
    <div>
      <button className="back-btn" onClick={onBack}>← Back to Campaigns</button>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <h2 className="card-title" style={{ fontSize: 24 }}>{campaign.title}</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {campaign.status === 'active' ? 'Active' : campaign.status}
              {isExpired ? ' (Expired)' : ''}
            </span>
          </div>
        </div>

        {campaign.description && (
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            {campaign.description}
          </p>
        )}

        <div className="detail-grid" style={{ marginBottom: 20 }}>
          <div className="detail-item">
            <div className="detail-label">Target</div>
            <div className="detail-value"><strong>{campaign.target_amount}</strong> ZEC</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Raised</div>
            <div className="detail-value" style={{ color: 'var(--accent)' }}>
              <strong>{displayRaised.toFixed(4)}</strong> ZEC
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Remaining</div>
            <div className="detail-value">
              <strong>{(campaign.target_amount - displayRaised).toFixed(4)}</strong> ZEC
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Deadline</div>
            <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isExtending ? (
                <>
                  <input 
                    type="date" 
                    className="form-input" 
                    style={{ padding: '4px 8px', width: 'auto' }}
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                  />
                  <button className="btn btn-sm btn-primary" onClick={handleExtendDeadline} disabled={extendSubmitting}>Save</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setIsExtending(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <span>
                    {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString() : 'No deadline'}
                  </span>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                    onClick={() => {
                      setNewDeadline(campaign.deadline || '');
                      setIsExtending(true);
                    }}
                  >
                    Extend
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>{progress.toFixed(1)}% funded</span>
            <span>{displayRaised.toFixed(4)} / {campaign.target_amount} ZEC</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="campaign-address-row">
          <div>
            <div className="form-label">Donation Address</div>
            <div className="mono" style={{ fontSize: 14 }}>{campaign.donation_address}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-sm btn-secondary" onClick={handleCopyAddress}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <div className="qr-inline">
              <QRCodeSVG value={campaign.donation_address} size={120} level="M" includeMargin={true} />
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => setShowDonate(true)}>
              Donate
            </button>
          </div>
        </div>

        {showDonate && (
          <div className="donate-modal">
            <div className="donate-modal-header">
              <h3>Donate to {campaign.title}</h3>
              <button className="btn-icon" onClick={() => setShowDonate(false)}>✕</button>
            </div>

            {donateResult && !donateResult.error && (
              <div className="alert alert-success">
                Donation recorded! Thank you.
              </div>
            )}
            {donateResult?.error && (
              <div className="alert alert-error">{donateResult.error}</div>
            )}

            <div className="alert alert-info" style={{ fontSize: 12, marginBottom: 16 }}>
              💡 Send ZEC from your wallet to the campaign address above, then submit
              the transaction ID here to track your donation. Shielded (private)
              transactions are not discoverable on-chain — this record is optional.
            </div>

            <form onSubmit={handleSubmitDonation}>
              <div className="form-group">
                <label className="form-label">Amount (ZEC)</label>
                <input className="form-input" type="number" step="0.0001" min="0.0001"
                  placeholder="0.1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Your Address (optional)</label>
                <input className="form-input mono" type="text"
                  placeholder="tm… or ztestsapling…"
                  value={donorAddr} onChange={(e) => setDonorAddr(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Transaction ID (optional)</label>
                <input className="form-input mono" type="text"
                  placeholder="opid… or txid"
                  value={txId} onChange={(e) => setTxId(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Message (optional)</label>
                <input className="form-input" type="text"
                  placeholder="Great cause!"
                  value={donateMsg} onChange={(e) => setDonateMsg(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Confirm Donation'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Shareable link */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h2 className="card-title">Shareable Link</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
          Share this link so others can donate to your campaign:
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input mono" readOnly value={shareUrl} />
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => { navigator.clipboard.writeText(shareUrl); }}
          >
            Copy
          </button>
        </div>
      </div>

      {/* On-chain donors */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Donors</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {chainData?.txs?.length || 0} on-chain &middot; {donations.length} recorded
          </span>
        </div>

        <div className="alert alert-info" style={{ fontSize: 11, marginBottom: 12 }}>
          🛡️ This list shows on-chain transparent transactions to the campaign address
          and manually recorded donations. Shielded (private) transactions are
          <strong> not</strong> discoverable — the displayed amounts may not reflect
          the true total.
        </div>

        {chainData?.txs?.length === 0 && donations.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>No donations received yet.</p>
          </div>
        )}

        {(chainData?.txs?.length > 0 || donations.length > 0) && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>From / Donor</th>
                  <th>Tx ID</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {chainData?.txs?.map((tx, i) => (
                  <tr key={`chain-${i}`}>
                    <td><span className="badge badge-completed">On-chain</span></td>
                    <td><strong>{Math.abs(tx.amount).toFixed(4)}</strong> ZEC</td>
                    <td className="mono">
                      <span
                        title="This may not reflect the true amount — shielded donations are private and not visible on-chain"
                        style={{ cursor: 'help', borderBottom: '1px dashed var(--text-muted)' }}
                      >
                        {tx.address || 'Unknown'}
                      </span>
                    </td>
                    <td className="mono">{tx.txid?.substring(0, 16)}…</td>
                    <td>{tx.time ? new Date(tx.time * 1000).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
                {donations.map((d) => (
                  <tr key={d.id}>
                    <td><span className="badge badge-pending">Recorded</span></td>
                    <td><strong>{d.amount}</strong> ZEC</td>
                    <td className="mono">{d.donor_address || 'Anonymous'}</td>
                    <td className="mono">{d.tx_id ? d.tx_id.substring(0, 16) + '…' : '—'}</td>
                    <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
