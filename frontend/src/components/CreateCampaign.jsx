import React, { useState } from 'react';
import { api } from '../api';

export default function CreateCampaign({ onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [donationAddress, setDonationAddress] = useState('');
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
    if (!donationAddress.trim())
      return setError('Receiving wallet address is required');
    // Basic client-side format check to avoid obvious placeholders
    const addr = donationAddress.trim();
    if (addr.toLowerCase().includes('your_local') || addr.indexOf(' ') !== -1 || addr.indexOf('_') !== -1)
      return setError('Please enter a real receiving wallet address (remove placeholders)');
    if (!/^(t|z)[A-Za-z0-9]{10,}$/.test(addr))
      return setError('Address format looks invalid — expected a t- or z- address');

    setSubmitting(true);
    try {
      const campaign = await api.createCampaign({
        title: title.trim(),
        description: description.trim(),
        target_amount: parseFloat(targetAmount),
        deadline: deadline || null,
        donation_address: donationAddress.trim(),
      });
      setResult(campaign);
      setTitle('');
      setDescription('');
      setTargetAmount('');
      setDeadline('');
      setDonationAddress('');
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
        <div className="alert alert-success">
          Campaign created!{result.donation_address
            ? ` Address: ${result.donation_address}`
            : ''}
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
          <label className="form-label">Receiving Wallet Address</label>
          <input
            className="form-input mono"
            type="text"
            placeholder="t... or z... (no placeholders)"
            value={donationAddress}
            onChange={(e) => setDonationAddress(e.target.value)}
            required
          />
          <p className="form-hint">
            Enter the wallet address where donations should be received.
            This is the address supporters will see on the campaign page.
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
