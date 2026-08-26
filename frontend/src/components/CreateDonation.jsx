import React, { useState } from 'react';
import { api } from '../api';

export default function CreateDonation() {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [privacy, setPrivacy] = useState('transparent');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!address.trim()) {
      setError('Recipient address is required');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      const donation = await api.createDonation({
        address: address.trim(),
        amount: parseFloat(amount),
        message: message.trim(),
      });
      setResult(donation);
      setAddress('');
      setAmount('');
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isValidZcashAddress = (addr) => {
    return /^tm[a-zA-Z0-9]{33}$/.test(addr) || /^ztestsapling[a-zA-Z0-9]{76}$/.test(addr);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Create Donation</h2>
      </div>

      {result && (
        <div className="alert alert-success">
          Donation created! ID: <span className="mono">{result.id}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Privacy Mode</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${privacy === 'transparent' ? 'active' : ''}`}
              onClick={() => setPrivacy('transparent')}
            >
              <span className="toggle-icon">👁️</span>
              Transparent
            </button>
            <button
              type="button"
              className={`toggle-btn ${privacy === 'shielded' ? 'active' : ''}`}
              onClick={() => setPrivacy('shielded')}
            >
              <span className="toggle-icon">🛡️</span>
              Shielded
            </button>
          </div>
          <p className="form-hint">
            {privacy === 'transparent'
              ? 'Transactions are visible on the public ledger (t-address).'
              : 'Transactions are encrypted and only visible to sender & recipient (z-address).'}
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Recipient Address</label>
          <input
            className="form-input mono"
            type="text"
            placeholder={
              privacy === 'transparent'
                ? 'tmPWLjYyHtYjZgYzqZJLV3HhVo1YziFu3X7'
                : 'ztestsapling1…'
            }
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          {address && (
            <p className="form-hint">
              {isValidZcashAddress(address)
                ? '✓ Valid Zcash address'
                : '⚠️ Address format may not be valid'}
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Amount (ZEC)</label>
          <input
            className="form-input"
            type="number"
            step="0.0001"
            min="0.0001"
            placeholder="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Message (optional)</label>
          <textarea
            className="form-textarea"
            placeholder="Thank you for your work!"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Submitting…' : 'Create Donation'}
        </button>
      </form>
    </div>
  );
}
