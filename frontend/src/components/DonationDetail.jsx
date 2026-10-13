import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function DonationDetail({ id, onBack }) {
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getDonation(id)
      .then(setDonation)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading donation…
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button className="back-btn" onClick={onBack}>← Back to Donations</button>
        <div className="alert alert-error">{error.message}</div>
      </div>
    );
  }

  if (!donation) {
    return (
      <div>
        <button className="back-btn" onClick={onBack}>← Back to Donations</button>
        <div className="alert alert-error">Donation not found</div>
      </div>
    );
  }

  return (
    <div>
      <button className="back-btn" onClick={onBack}>← Back to Donations</button>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Donation Details</h2>
          <span className={`badge badge-${donation.status}`}>
            {donation.status}
          </span>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">ID</div>
            <div className="detail-value mono">{donation.id}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Amount</div>
            <div className="detail-value"><strong>{donation.amount}</strong> ZEC</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Recipient Address</div>
            <div className="detail-value mono">{donation.address}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Transaction ID</div>
            <div className="detail-value mono">{donation.tx_id || '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Created</div>
            <div className="detail-value">
              {new Date(donation.created_at).toLocaleString()}
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Updated</div>
            <div className="detail-value">
              {new Date(donation.updated_at).toLocaleString()}
            </div>
          </div>
          {donation.message && (
            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
              <div className="detail-label">Message</div>
              <div className="detail-value">{donation.message}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
