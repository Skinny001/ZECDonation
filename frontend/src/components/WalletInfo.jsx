import React from 'react';

export default function WalletInfo() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: 20, borderTop: '4px solid var(--accent)' }}>
        <div className="card-header">
          <h2 className="card-title">How to get a Zcash Address</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          To create a campaign and receive donations on the Zcash Testnet, you need your own Zcash wallet. Follow these simple steps to get set up:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="stat-card" style={{ textAlign: 'left', padding: 20, background: 'var(--bg2)', borderLeft: '3px solid var(--accent)' }}>
            <h3 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '24px' }}>1.</span> Download a Zcash Wallet
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Download a mobile wallet like <strong style={{ color: 'var(--text)' }}>Ywallet</strong> or <strong style={{ color: 'var(--text)' }}>Zingo!</strong> from your app store. Be sure to switch the app to the <strong style={{ color: 'var(--teal)' }}>Testnet</strong> network in the settings.
            </p>
          </div>

          <div className="stat-card" style={{ textAlign: 'left', padding: 20, background: 'var(--bg2)', borderLeft: '3px solid var(--accent)' }}>
            <h3 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '24px' }}>2.</span> Copy your Address
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Open your wallet app to view your receiving addresses. Find your transparent address (it starts with a <code style={{ color: 'var(--accent)', background: 'var(--bg)', padding: '2px 6px', borderRadius: '4px' }}>'t'</code>) and copy it to your clipboard.
            </p>
          </div>

          <div className="stat-card" style={{ textAlign: 'left', padding: 20, background: 'var(--bg2)', borderLeft: '3px solid var(--accent)' }}>
            <h3 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '24px' }}>3.</span> Start Your Campaign
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Navigate to the <strong style={{ color: 'var(--text)' }}>Start a Campaign</strong> tab on this website, fill out your campaign details, and paste your Zcash address in the Donation Address field!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
