import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  Zap, 
  QrCode, 
  EyeOff, 
  ChevronDown, 
  Check, 
  X, 
  Layers,
  HeartHandshake
} from 'lucide-react';

const BG_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_230229_7c9bc431-46cf-489a-948d-e8144d8eb5d4.mp4';
const CTA_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260703_053131_1ec3dd1c-d627-44fb-ab20-6e1fce41b0d5.mp4';

export default function LandingPage({ onNavigate, onSelectCampaign }) {
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
  const [faqOpen, setFaqOpen] = useState(null);

  useEffect(() => {
    api.getCampaigns()
      .then((data) => {
        setFeaturedCampaigns(data.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const toggleFaq = (index) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const FAQS = [
    {
      q: 'Why does crowdfunding need financial privacy?',
      a: 'Transparent blockchains and traditional platforms leave public digital footprints, exposing donors to targeted phishing, doxxing, harassment, and political or financial censorship. ZECDonation uses Zcash shielded pools to ensure your generosity remains strictly confidential between you and the cause you support.',
    },
    {
      q: 'How does ZECDonation identify my donation without knowing who I am?',
      a: 'We leverage Zcash’s built-in 512-byte encrypted memo field. When you scan our ZIP-321 QR code, your wallet pre-fills an attribution tag (e.g., zd:CAMPAIGN_CODE). Only the platform holding the view key can decrypt this memo to credit the fundraiser, while your address and balance remain 100% hidden.',
    },
    {
      q: 'Which Zcash wallets can I use to donate?',
      a: 'Any wallet supporting shielded transfers and ZIP-321 payment URIs works seamlessly! We recommend Zashi (official Electric Coin Company mobile wallet) or Ywallet for instant one-tap scanning and encrypted memo support.',
    },
    {
      q: 'How do payouts work for campaign creators?',
      a: 'When creating a campaign, creators provide their shielded Unified Address (UA). The platform escrow autonomously monitors the node, tallies verified contributions, and sweeps the funds directly to the creator once goals are achieved or deadlines conclude.',
    },
  ];

  return (
    <div className="landing-page">
      {/* ── Hero Section with Ambient Looping Background Video ── */}
      <section className="hero-video-container">
        <video
          className="hero-bg-video"
          autoPlay
          muted
          loop
          playsInline
          src={BG_VIDEO}
        />
        <div className="hero-video-overlay" />

        <div className="hero-inner-content">
          <div className="hero-content">
            <div className="hero-pill liquid-glass">
              <span className="pill-dot"></span>
              <span>Zero-Knowledge Crowdfunding on Zcash</span>
            </div>

            <h1 className="hero-title">
              Fund the Future with <br />
              <span className="hero-gradient">Absolute Privacy</span>
            </h1>

            <p className="hero-subtitle">
              The world's premier privacy-first donation platform powered by Zcash shielded pools (Sapling & Orchard). Raise funds, support causes, and protect donor anonymity with zero tracking.
            </p>

            <div className="hero-actions">
              <button
                className="btn btn-primary hero-btn-main"
                onClick={() => onNavigate('campaigns')}
              >
                <span>Explore Campaigns</span>
                <ArrowRight size={18} className="btn-arrow" />
              </button>
              <button
                className="liquid-glass-btn hero-btn-sub"
                onClick={() => onNavigate('create')}
              >
                <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                <span>Start a Campaign +</span>
              </button>
            </div>

            <div className="hero-badges">
              <div className="hero-badge-item liquid-glass" style={{ padding: '6px 12px', borderRadius: '20px' }}>
                <Check size={14} className="badge-check" />
                <span>100% Shielded Pools</span>
              </div>
              <div className="hero-badge-item liquid-glass" style={{ padding: '6px 12px', borderRadius: '20px' }}>
                <Check size={14} className="badge-check" />
                <span>ZIP-321 One-Tap QR</span>
              </div>
              <div className="hero-badge-item liquid-glass" style={{ padding: '6px 12px', borderRadius: '20px' }}>
                <Check size={14} className="badge-check" />
                <span>Zero Donor Tracking</span>
              </div>
            </div>
          </div>

          {/* ── Interactive Hero Showcase Card in Liquid Glass ── */}
          <div className="hero-showcase">
            <div className="showcase-card liquid-glass-gold">
              <div className="showcase-header">
                <div className="showcase-tag">
                  <span className="pulse-icon">●</span> Active Campaign
                </div>
                <span className="badge badge-completed">Shielded ZEC</span>
              </div>

              <div className="showcase-body">
                <div className="showcase-icon-wrap">
                  <img src="/zecdonation_logo.png" alt="Logo" className="showcase-logo" />
                </div>
                <h3 className="showcase-title">Privacy Tools & Developer Fund</h3>
                <p className="showcase-desc">
                  Support next-generation open source privacy and zero-knowledge encryption infrastructure.
                </p>

                <div className="showcase-progress-wrap">
                  <div className="showcase-progress-labels">
                    <span className="raised-text"><strong>18.5</strong> ZEC Raised</span>
                    <span className="target-text">Goal: 25.0 ZEC</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: '74%' }}></div>
                  </div>
                </div>

                <div className="showcase-shield-box liquid-glass">
                  <div className="shield-icon">
                    <ShieldCheck size={22} style={{ color: 'var(--teal)' }} />
                  </div>
                  <div className="shield-info">
                    <span className="shield-title">Shielded Pool Escrow</span>
                    <span className="shield-meta">Sender Address: Confidential &bull; Memo: Encrypted</span>
                  </div>
                </div>

                <button
                  className="btn btn-primary showcase-action-btn"
                  onClick={() => onNavigate('campaigns')}
                >
                  Scan & Donate Privately
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pillars / Why ZECDonation in Liquid Glass ── */}
      <section className="landing-section">
        <div className="section-header text-center">
          <span className="section-eyebrow">BUILT ON ZERO-KNOWLEDGE</span>
          <h2 className="section-title">Why Traditional Crowdfunding Fails Privacy</h2>
          <p className="section-desc">
            Public ledgers like Bitcoin and Ethereum leak every transaction amount and donor address. Traditional platforms freeze accounts and collect sensitive KYC data.
          </p>
        </div>

        <div className="comparison-grid">
          <div className="comparison-card liquid-glass">
            <div className="card-top-icon">🏛️</div>
            <h3>Traditional Platforms</h3>
            <p className="card-sub">GoFundMe / Kickstarter</p>
            <ul className="comparison-list">
              <li className="bad"><X size={15} color="#e74c3c" /> Invasive ID & KYC required</li>
              <li className="bad"><X size={15} color="#e74c3c" /> Bank freezes & political deplatforming</li>
              <li className="bad"><X size={15} color="#e74c3c" /> 5% - 10% platform cuts & processing fees</li>
              <li className="bad"><X size={15} color="#e74c3c" /> Full donor names exposed or sold to marketing</li>
            </ul>
          </div>

          <div className="comparison-card liquid-glass">
            <div className="card-top-icon">⛓️</div>
            <h3>Transparent Crypto</h3>
            <p className="card-sub">Bitcoin / Ethereum</p>
            <ul className="comparison-list">
              <li className="bad"><X size={15} color="#e74c3c" /> Public ledger links entire wallet balances</li>
              <li className="bad"><X size={15} color="#e74c3c" /> Donors vulnerable to targeted scams & doxxing</li>
              <li className="bad"><X size={15} color="#e74c3c" /> Blockchain forensic tracking</li>
              <li className="bad"><X size={15} color="#e74c3c" /> Volatile network gas spikes</li>
            </ul>
          </div>

          <div className="comparison-card liquid-glass-gold highlighted">
            <div className="card-top-badge">RECOMMENDED</div>
            <div className="card-top-icon">
              <ShieldCheck size={32} style={{ color: 'var(--accent)' }} />
            </div>
            <h3>ZECDonation</h3>
            <p className="card-sub">Zcash Orchard & Sapling</p>
            <ul className="comparison-list">
              <li className="good"><Check size={16} color="var(--teal)" /> 100% Cryptographically Shielded Transfers</li>
              <li className="good"><Check size={16} color="var(--teal)" /> Encrypted Memo Attribution (No doxxing)</li>
              <li className="good"><Check size={16} color="var(--teal)" /> Instant One-Tap ZIP-321 Mobile QR Codes</li>
              <li className="good"><Check size={16} color="var(--teal)" /> Sub-Penny Fees (~0.0001 ZEC)</li>
              <li className="good"><Check size={16} color="var(--teal)" /> Autonomous Escrow & Milestone Payouts</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── How It Works in 4 Steps ── */}
      <section className="landing-section steps-section">
        <div className="section-header text-center">
          <span className="section-eyebrow">SEAMLESS FLOW</span>
          <h2 className="section-title">How ZECDonation Works</h2>
          <p className="section-desc">
            Four simple steps from campaign launch to confidential shielded payout.
          </p>
        </div>

        <div className="stepper-pipeline">
          <div className="step-item">
            <div className="step-node-wrap">
              <div className="step-node">
                <Sparkles size={26} style={{ color: 'var(--accent)' }} />
              </div>
              <span className="step-badge-number">1</span>
            </div>
            <div className="step-content">
              <span className="step-tag">Creator Setup</span>
              <h3 className="step-title">Launch Campaign</h3>
              <p className="step-desc">
                Set target, deadline, and story. Provide your shielded Zcash Unified Address (UA) to receive escrow disbursements.
              </p>
            </div>
          </div>

          <div className="step-item">
            <div className="step-node-wrap">
              <div className="step-node">
                <QrCode size={26} style={{ color: 'var(--teal)' }} />
              </div>
              <span className="step-badge-number">2</span>
            </div>
            <div className="step-content">
              <span className="step-tag">ZIP-321 Protocol</span>
              <h3 className="step-title">Generate QR URI</h3>
              <p className="step-desc">
                The engine builds standard ZIP-321 payment URIs pre-populated with recipient, amount, and encrypted attribution memo.
              </p>
            </div>
          </div>

          <div className="step-item">
            <div className="step-node-wrap">
              <div className="step-node">
                <Lock size={26} style={{ color: 'var(--accent)' }} />
              </div>
              <span className="step-badge-number">3</span>
            </div>
            <div className="step-content">
              <span className="step-tag">Shielded Transfer</span>
              <h3 className="step-title">Private Donation</h3>
              <p className="step-desc">
                Donors scan using Zashi or Ywallet. Orchard zero-knowledge proofs protect the sender's balance and identity.
              </p>
            </div>
          </div>

          <div className="step-item">
            <div className="step-node-wrap">
              <div className="step-node">
                <Zap size={26} style={{ color: 'var(--teal)' }} />
              </div>
              <span className="step-badge-number">4</span>
            </div>
            <div className="step-content">
              <span className="step-tag">Direct Settlement</span>
              <h3 className="step-title">Automated Payout</h3>
              <p className="step-desc">
                The sync engine verifies incoming shielded notes via node RPC and automatically sweeps funds to the creator.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Campaigns Preview (if any) ── */}
      {featuredCampaigns.length > 0 && (
        <section className="landing-section">
          <div className="section-header-inline">
            <div>
              <span className="section-eyebrow">DISCOVER</span>
              <h2 className="section-title">Active Campaigns</h2>
            </div>
            <button
              className="liquid-glass-btn"
              onClick={() => onNavigate('campaigns')}
              style={{ padding: '8px 18px', borderRadius: '20px', fontSize: 13 }}
            >
              View All ({featuredCampaigns.length}+) →
            </button>
          </div>

          <div className="campaign-grid">
            {featuredCampaigns.map((c) => (
              <div
                key={c.id}
                className="campaign-card liquid-glass"
                onClick={() => onSelectCampaign(c.id)}
              >
                <div className="campaign-card-header">
                  <h3 className="campaign-card-title">{c.title}</h3>
                  <span className={`badge badge-${c.status === 'active' ? 'completed' : c.status}`}>
                    {c.status}
                  </span>
                </div>
                <p className="campaign-card-desc">
                  {c.description || 'Confidential community fundraiser.'}
                </p>
                <div className="campaign-card-meta">
                  <span>🎯 {c.target_amount} ZEC Target</span>
                  {c.deadline && (
                    <span>📅 {new Date(c.deadline).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="campaign-card-address mono">
                  📍 {c.donation_address}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FAQ Section in Liquid Glass ── */}
      <section className="landing-section faq-section">
        <div className="section-header text-center">
          <span className="section-eyebrow">QUESTIONS & ANSWERS</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>

        <div className="faq-list">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className={`faq-item liquid-glass ${faqOpen === idx ? 'open' : ''}`}
              onClick={() => toggleFaq(idx)}
            >
              <div className="faq-question">
                <span>{faq.q}</span>
                <span className="faq-toggle">
                  <ChevronDown 
                    size={18} 
                    style={{ 
                      transform: faqOpen === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: 'var(--accent)'
                    }} 
                  />
                </span>
              </div>
              {faqOpen === idx && <div className="faq-answer">{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom Call To Action with Looping Video & High-Contrast Design ── */}
      <section className="cta-video-container liquid-glass">
        <video
          className="cta-bg-video"
          autoPlay
          muted
          loop
          playsInline
          src={CTA_VIDEO}
        />
        <div className="cta-video-overlay" />

        <div className="cta-inner-content">
          <img src="/zecdonation_logo.png" alt="ZECDonation" className="cta-logo-img" />

          <h2 className="cta-headline">
            Ready to Launch <br />
            Your Confidential <span className="cta-headline-dim">Fundraiser?</span>
          </h2>

          <p className="cta-desc">
            Join the new era of private, censorship-resistant patronage powered by Zcash zero-knowledge cryptography.
          </p>

          <div className="cta-banner-actions">
            <button
              className="cta-btn-white"
              onClick={() => onNavigate('create')}
            >
              <Sparkles size={16} />
              <span>Start a Campaign Now</span>
            </button>
            <button
              className="liquid-glass-btn cta-btn-glass"
              onClick={() => onNavigate('campaigns')}
            >
              <span>Explore Causes</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
