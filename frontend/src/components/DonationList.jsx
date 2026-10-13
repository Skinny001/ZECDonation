import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function DonationList({ onSelect }) {
  const [donations, setDonations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetch = filter === 'all'
      ? api.getDonations(200)
      : api.getDonationsByStatus(filter);

    fetch
      .then(setDonations)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [filter]);

  const filters = ['all', 'pending', 'completed', 'failed'];

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Donations</h2>
        <div className="toggle-group">
          {filters.map((f) => (
            <button
              key={f}
              className={`toggle-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner" />
          Loading donations…
        </div>
      )}

      {error && (
        <div className="alert alert-error">{error.message}</div>
      )}

      {!loading && !error && donations.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>No {filter === 'all' ? '' : filter} donations found.</p>
        </div>
      )}

      {!loading && !error && donations.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Address</th>
                <th>Status</th>
                <th>Tx ID</th>
                <th>Message</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} onClick={() => onSelect(d.id)}>
                  <td><strong>{d.amount}</strong> ZEC</td>
                  <td className="mono">{d.address}</td>
                  <td>
                    <span className={`badge badge-${d.status}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="mono">
                    {d.tx_id ? d.tx_id.substring(0, 16) + '…' : '—'}
                  </td>
                  <td className="mono">{d.message || '—'}</td>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
