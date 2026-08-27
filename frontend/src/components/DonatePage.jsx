import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { QRCodeSVG } from 'qrcode.react';

export default function DonatePage({ slug }) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [donorAddr, setDonorAddr] = useState('');
  const [amount, setAmount] = useState('');
  const [txId, setTxId] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.getCampaignBySlug(slug)
      .then(setCampaign)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopy = () => {
    if (campaign?.donation_address) {
      navigator.clipboard.writeText(campaign.donation_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setSubmitting(true);
    try {
      const res = await api.recordDonation(campaign.id, {
        amount: parseFloat(amount),
        donor_address: donorAddr,
        tx_id: txId,
        message: message,
      });
      setResult({ success: true, data: res });
      setAmount('');
      setDonorAddr('');
      setTxId('');
      setMessage('');
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="donate-page loading">
        <div className="spinner" />
        Loading campaign…
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="donate-page error">
        <div className="error-icon">😕</div>
        <h2>Campaign not found</h2>
        <p>{error?.message || 'Invalid or expired link'}</p>
        <a href="/" className="btn btn-primary">← Back to home</a>
      </div>
    );
  }

  const isExpired = campaign.deadline && new Date(campaign.deadline) < new Date();

  return (
    <div className="donate-page">
      <div className="donate-card">
        <div className="donate-header">
          <h1>{campaign.title}</h1>
          {isExpired && <span className="badge badge-expired">Expired</span>}
        </div>

        {campaign.description && (
          <p className="donate-description">{campaign.description}</p>
        )}

        <div className="donate-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '0%' }} />
          </div>
          <p className="progress-text">
            Target: <strong>{campaign.target_amount} ZEC</strong>
          </p>
        </div>

        <div className="donate-address-section">
          <label>Donation Address</label>
          <div className="address-with-qr">
            <div className="address-row">
              <code className="address">{campaign.donation_address}</code>
              <button className="btn btn-sm btn-secondary" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="qr-container">
              <QRCodeSVG value={campaign.donation_address} size={160} level="M" includeMargin={true} />
              <p className="qr-hint">Scan with wallet app</p>
            </div>
          </div>
          <p className="hint">Send ZEC from your wallet to this address</p>
        </div>

        <form onSubmit={handleSubmit} className="donate-form">
          <div className="form-group">
            <label>Amount (ZEC) *</label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              placeholder="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Your Address (optional)</label>
            <input
              type="text"
              placeholder="t1... or ztestsapling1..."
              value={donorAddr}
              onChange={(e) => setDonorAddr(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Transaction ID (optional)</label>
            <input
              type="text"
              placeholder="txid or opid from your wallet"
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Message (optional)</label>
            <textarea
              placeholder="Great cause! 🙌"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? 'Recording…' : 'I\'ve Sent — Record Donation'}
          </button>
        </form>

        {result && (
          <div className={`donate-result ${result.success ? 'success' : 'error'}`}>
            {result.success ? (
              <>
                <span className="result-icon">✅</span>
                <strong>Donation recorded!</strong> Thank you for supporting <strong>{campaign.title}</strong>.
              </>
            ) : (
              <>
                <span className="result-icon">❌</span>
                <strong>Failed:</strong> {result.error}
              </>
            )}
          </div>
        )}

        <div className="donate-footer">
          <p>💡 <strong>Shielded donations</strong> (z-addr) are private — not visible on-chain. Recording here helps the campaign owner track them.</p>
          <a href="/" className="link">← View all campaigns</a>
        </div>
      </div>
    </div>
  );
}