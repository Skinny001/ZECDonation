import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

export default function CampaignDetail({ id, onBack }) {
  const [campaign, setCampaign] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [chainData, setChainData] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Copy state
  const [copied, setCopied] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getCampaign(id),
      api.getCampaignPayment(id).catch((e) => {
        if (e.message.includes('410')) return null; // Expired
        throw e;
      }),
      api.getCampaignBlockchain(id).catch(() => null),
      api.getCampaignDonations(id).catch(() => []),
    ])
      .then(([c, p, chain, d]) => {
        setCampaign(c);
        setPaymentInfo(p);
        setChainData(chain);
        setDonations(d);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  const reloadCampaign = () => {
    Promise.all([
      api.getCampaign(id),
      api.getCampaignPayment(id).catch(() => null),
      api.getCampaignDonations(id).catch(() => []),
    ]).then(([c, p, d]) => {
      setCampaign(c);
      setPaymentInfo(p);
      setDonations(d);
    }).catch(console.error);
  };

  const handleSimulateDonation = async (amountZec = 0.5) => {
    try {
      toast.loading('Broadcasting simulated note…', { id: 'sim' });
      await api.simulateDonation({
        campaign_id: id,
        amount_zec: amountZec,
        message: 'Supporter donation via Zcash Orchard pool'
      });
      toast.success(`Donation of ${amountZec} ZEC received!`, { id: 'sim' });
      reloadCampaign();
    } catch (err) {
      toast.error(err.message, { id: 'sim' });
    }
  };

  const handleCopyAddress = () => {
    if (paymentInfo?.receive_ua) {
      navigator.clipboard.writeText(paymentInfo.receive_ua);
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
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

  const isExpired = campaign.deadline_at && (campaign.deadline_at <= Math.floor(Date.now() / 1000));
  const shareUrl = `${window.location.origin}/donate/${campaign.code}`;

  const syncedTotal = chainData?.total_received != null
    ? parseFloat(chainData.txs.reduce((sum, t) => sum + Math.abs(t.amount), 0))
    : null;

  const displayRaised = campaign.total_raised_zat != null
    ? Number(campaign.total_raised_zat) / 1e8
    : (campaign.confirmed_balance != null
      ? Number(campaign.confirmed_balance) / 1e8
      : (syncedTotal != null ? syncedTotal : 0));
  const targetZec = campaign.target_zat ? (campaign.target_zat / 1e8) : 0;
  const progress = targetZec > 0
    ? Math.min(100, (displayRaised / targetZec) * 100)
    : 0;

  return (
    <div>
      <button className="back-btn" onClick={onBack}>← Back to Campaigns</button>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <h2 className="card-title" style={{ fontSize: 24 }}>{campaign.title}</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <span className={`badge badge-${campaign.status === 'paid_out' ? 'completed' : (campaign.status === 'active' ? 'completed' : campaign.status)}`}>
                {campaign.status === 'paid_out' ? '🎉 Fully Funded & Paid Out' : (campaign.status === 'active' ? '🟢 Active' : campaign.status)}
              </span>
              {isExpired && <span className="badge badge-pending">Expired</span>}
            </div>
          </div>
        </div>

        {campaign.status === 'paid_out' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(244, 185, 66, 0.15) 0%, rgba(34, 197, 94, 0.15) 100%)',
            border: '1px solid rgba(244, 185, 66, 0.35)',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}>
            <div style={{ fontSize: 32 }}>🎉</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#f4b942' }}>Campaign Goal Achieved!</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                This campaign reached its target of <strong>{targetZec} ZEC</strong> and funds have been automatically disbursed to the creator.
              </div>
            </div>
          </div>
        )}

        {campaign.description && (
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            {campaign.description}
          </p>
        )}

        <div className="detail-grid" style={{ marginBottom: 20 }}>
          <div className="detail-item">
            <div className="detail-label">Target</div>
            <div className="detail-value"><strong>{targetZec}</strong> ZEC</div>
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
              <strong>{Math.max(0, targetZec - displayRaised).toFixed(4)}</strong> ZEC
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Deadline</div>
            <div className="detail-value">
              {campaign.deadline_at ? new Date(campaign.deadline_at * 1000).toLocaleDateString() : 'No deadline'}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>{progress.toFixed(1)}% funded</span>
            <span>{displayRaised.toFixed(4)} / {targetZec} ZEC</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {paymentInfo ? (
          <div className="campaign-address-row" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'var(--bg-lighter)', padding: 20, borderRadius: 8 }}>
            <h3 style={{ marginBottom: 15 }}>Donate via Zcash</h3>
            <div style={{ background: 'white', padding: 10, borderRadius: 8, display: 'inline-block', marginBottom: 15 }}>
              <QRCodeSVG value={paymentInfo.zip321_uri} size={200} level="M" />
            </div>
            
            <div style={{ marginBottom: 15 }}>
              <div className="form-label">Escrow Address</div>
              <code style={{ wordBreak: 'break-all', display: 'block', maxWidth: 400, margin: '0 auto 8px' }}>
                {paymentInfo.receive_ua}
              </code>
              <button className="btn btn-sm btn-secondary" onClick={handleCopyAddress}>
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
            </div>

            <div
              style={{
                textAlign: 'left',
                fontSize: 13,
                maxWidth: 440,
                margin: '14px auto 0',
                background: 'rgba(244, 185, 66, 0.08)',
                border: '1px solid rgba(244, 185, 66, 0.4)',
                borderRadius: 10,
                padding: '14px 16px',
                lineHeight: 1.5
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#f4b942', marginBottom: 6 }}>
                <span>⚠️</span>
                <span>Important Required Transfer Memo</span>
              </div>
              <p style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                If your wallet doesn't support QR scanning with memos or you are sending manually, you <strong>must</strong> include this code in your transaction memo so we can credit this campaign:
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
                    toast.success('Memo code copied!');
                  }}
                >
                  📋 Copy Code
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-warning" style={{ textAlign: 'center', padding: 20 }}>
            This campaign has ended. Donations are no longer being accepted.
          </div>
        )}
      </div>

      {/* Recent Donations & On-Chain Verification */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h2 className="card-title">Recent Donations ({donations.length})</h2>
          <span className="badge" style={{ background: 'rgba(244, 185, 66, 0.15)', color: '#f4b942' }}>
            🛡️ Shielded Orchard Pool
          </span>
        </div>

        {donations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            No on-chain donations detected yet. Scan the QR code above with a Zcash wallet to contribute!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {donations.map((d) => {
              const isSim = d.txid && d.txid.startsWith('sim_');
              const explorerUrl = `https://blockexplorer.one/zcash/testnet/tx/${d.txid}`;
              return (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 8,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    flexWrap: 'wrap',
                    gap: 10
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ color: 'var(--accent)', fontSize: 16 }}>
                        +{(d.value_zat / 1e8).toFixed(4)} ZEC
                      </strong>
                      <span className="badge badge-completed" style={{ fontSize: 11 }}>
                        Confirmed
                      </span>
                      {d.block_height && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Block #{d.block_height}
                        </span>
                      )}
                    </div>
                    {d.donor_message && (
                      <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 4, fontStyle: 'italic' }}>
                        "{d.donor_message}"
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }} className="mono">
                      Tx: {d.txid ? `${d.txid.slice(0, 10)}…${d.txid.slice(-8)}` : 'N/A'}
                    </div>
                  </div>

                  <div>
                    {isSim ? (
                      <button
                        onClick={() => setSelectedTx(d)}
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: 11, padding: '3px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title="Click to view note details"
                      >
                        ⚡ Simulated Note ℹ️
                      </button>
                    ) : (
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary"
                        style={{ textDecoration: 'none', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        🔍 View on Explorer ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shareable link */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h2 className="card-title">Shareable Link</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
          Share this link so others can view this campaign:
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input mono" readOnly value={shareUrl} />
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => { 
              navigator.clipboard.writeText(shareUrl); 
              toast.success('Link copied!');
            }}
          >
            Copy
          </button>
        </div>
      </div>
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
