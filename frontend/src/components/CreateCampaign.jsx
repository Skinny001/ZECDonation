import React, { useState } from 'react';
import { api } from '../api';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

export default function CreateCampaign({ onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [payoutUA, setPayoutUA] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!title.trim()) return setError('Title is required');
    if (!targetAmount || parseFloat(targetAmount) <= 0)
      return setError('Target amount must be greater than 0');
    if (!payoutUA.trim())
      return setError('Creator payout address is required');
    const addr = payoutUA.trim();
    if (addr.toLowerCase().includes('your_local') || addr.indexOf(' ') !== -1 || addr.indexOf('_') !== -1)
      return setError('Please enter a real wallet address (remove placeholders)');

    setSubmitting(true);
    try {
      const campaign = await api.createCampaign({
        creator_id: 'anonymous', // For now
        title: title.trim(),
        description: description.trim(),
        target_zat: Math.floor(parseFloat(targetAmount) * 1e8),
        deadline_at: deadline ? Math.floor(new Date(deadline).getTime() / 1000) : Math.floor(Date.now()/1000) + 30*24*60*60, // Default 30 days
        payout_ua: payoutUA.trim(),
        payout_mode: 'auto'
      });
      setResult(campaign);
      toast.success('Campaign created successfully!');
      setTitle('');
      setDescription('');
      setTargetAmount('');
      setDeadline('');
      setPayoutUA('');
      if (onCreate) onCreate(campaign.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Start a Campaign</h2>
      </div>

      {result && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#f4b942' }}>
            🎉 Campaign Created Successfully!
          </div>
          <div style={{ marginBottom: 12, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: '1px solid rgba(244, 185, 66, 0.3)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              Required Transfer Memo Code:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  background: '#f4b942',
                  color: '#000',
                  padding: '4px 12px',
                  borderRadius: 4,
                  fontWeight: 800,
                  fontSize: 15,
                  letterSpacing: '0.04em',
                  fontFamily: 'monospace'
                }}
              >
                zd:{result.code}
              </span>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(`zd:${result.code}`);
                  toast.success('Memo code copied!');
                }}
              >
                📋 Copy Memo Code
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.4 }}>
              Donors sending manually <strong>must</strong> include this code in their wallet's transaction memo so funds credit to this campaign.
            </p>
          </div>
          <div className="create-result-qr">
            <div className="create-result-address">
              <p>Escrow Address Generated:</p>
              <code style={{ wordBreak: 'break-all' }}>{result.receive_ua}</code>
              <button className="btn btn-sm btn-secondary" onClick={() => {
                navigator.clipboard.writeText(result.receive_ua);
                toast.success('Address copied to clipboard!');
              }}>
                Copy Address
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Campaign Title</label>
          <input
            className="form-input"
            type="text"
            placeholder="Help us build the future of private donations"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description (optional)</label>
          <textarea
            className="form-textarea"
            placeholder="Describe what this campaign is about and why people should donate…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Target Amount (ZEC)</label>
          <input
            className="form-input"
            type="number"
            step="0.0001"
            min="0.0001"
            placeholder="10"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Creator Payout Address (Unified or Sapling)</label>
          <input
            className="form-input mono"
            type="text"
            placeholder="u1... or z..."
            value={payoutUA}
            onChange={(e) => setPayoutUA(e.target.value)}
            required
          />
          <p className="form-hint">
            The wallet address where the platform will send the collected ZEC when the campaign ends.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Deadline (optional)</label>
          <input
            className="form-input"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Campaign'}
        </button>
      </form>
    </div>
  );
}
