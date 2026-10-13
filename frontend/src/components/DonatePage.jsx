import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { QRCodeSVG } from 'qrcode.react';

export default function DonatePage({ slug: id }) {
  const [campaign, setCampaign] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    Promise.all([
      api.getCampaign(id),
      api.getCampaignPayment(id).catch((e) => {
        if (e.message.includes('410')) return null;
        throw e;
      })
    ])
    .then(([c, p]) => {
      setCampaign(c);
      setPaymentInfo(p);
    })
    .catch(setError)
    .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = () => {
    if (paymentInfo?.receive_ua) {
      navigator.clipboard.writeText(paymentInfo.receive_ua);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        <button onClick={() => window.location.reload()} className="btn btn-primary">← Back to home</button>
      </div>
    );
  }

  const isExpired = !paymentInfo;

  return (
    <div className="donate-page" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="donate-card card" style={{ padding: '30px', textAlign: 'center' }}>
        <div className="donate-header">
          <h1 style={{ fontSize: 28, marginBottom: 10 }}>{campaign.title}</h1>
          {isExpired && <span className="badge badge-expired" style={{ background: '#ff4444', color: 'white', padding: '4px 8px', borderRadius: 4 }}>Ended</span>}
        </div>

        {campaign.description && (
          <p className="donate-description" style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            {campaign.description}
          </p>
        )}

        <div className="donate-progress" style={{ marginBottom: 30 }}>
          <p className="progress-text">
            Target: <strong>{campaign.target_zat ? campaign.target_zat / 1e8 : 0} ZEC</strong>
          </p>
        </div>

        {paymentInfo ? (
          <div className="donate-address-section" style={{ background: 'var(--bg-lighter)', padding: 25, borderRadius: 12 }}>
            <h3 style={{ marginBottom: 20 }}>Scan to Donate</h3>
            <div className="qr-container" style={{ background: 'white', display: 'inline-block', padding: 15, borderRadius: 12, marginBottom: 20 }}>
              <QRCodeSVG value={paymentInfo.zip321_uri} size={220} level="M" />
            </div>
            
            <div className="address-with-qr" style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 5 }}>Escrow Address</label>
              <div className="address-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <code className="address" style={{ wordBreak: 'break-all', display: 'block' }}>
                  {paymentInfo.receive_ua}
                </code>
                <button className="btn btn-sm btn-secondary" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>
              </div>
            </div>

            <div
              style={{
                textAlign: 'left',
                fontSize: 13,
                lineHeight: 1.5,
                background: 'rgba(244, 185, 66, 0.08)',
                border: '1px solid rgba(244, 185, 66, 0.4)',
                borderRadius: 10,
                padding: '14px 16px',
                marginTop: 15
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#f4b942', marginBottom: 6 }}>
                <span>💡</span>
                <span>Important Required Transfer Memo</span>
              </div>
              <p style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                If you are entering the address manually instead of scanning the QR code, you <strong>must</strong> include this code in your transaction memo so we know the funds are for this campaign:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.35)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(244, 185, 66, 0.25)' }}>
                <span
                  style={{
                    background: '#f4b942',
                    color: '#000',
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontWeight: 800,
                    fontSize: 14,
                    letterSpacing: '0.04em',
                    fontFamily: 'monospace'
                  }}
                >
                  zd:{campaign.code}
                </span>
                <button
                  className="btn btn-sm btn-secondary"
                  style={{ marginLeft: 'auto', fontSize: 11, padding: '4px 10px' }}
                  onClick={() => {
                    navigator.clipboard.writeText(`zd:${campaign.code}`);
                  }}
                >
                  📋 Copy Code
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-warning" style={{ padding: 30, fontSize: 16 }}>
            <h3>This campaign has ended.</h3>
            <p style={{ marginTop: 10 }}>Donations are no longer being accepted and the payment details have been hidden.</p>
          </div>
        )}

        <div className="donate-footer" style={{ marginTop: 30 }}>
          <button onClick={() => window.location.reload()} className="btn" style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            ← Back to campaigns
          </button>
        </div>
      </div>
    </div>
  );
}