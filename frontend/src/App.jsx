import React, { useState, useEffect } from 'react';
import { api } from './api';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/LandingPage';
import CampaignList from './components/CampaignList';
import CampaignDetail from './components/CampaignDetail';
import CreateCampaign from './components/CreateCampaign';
import Dashboard from './components/Dashboard';
import WalletInfo from './components/WalletInfo';
import BlockchainInfo from './components/BlockchainInfo';
import DonatePage from './components/DonatePage';
import './App.css';

const FLOWER_BG = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260703_053131_1ec3dd1c-d627-44fb-ab20-6e1fce41b0d5.mp4';

const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'create', label: 'Start a Campaign' },
  { key: 'dashboard', label: 'Stats' },
  { key: 'wallet', label: 'Getting Started' },
  { key: 'blockchain', label: 'Network' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => {});
  }, []);

  const openCampaign = (id) => {
    setSelectedCampaignId(id);
    setActiveTab('campaign-detail');
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <LandingPage
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectCampaign={openCampaign}
          />
        );
      case 'campaigns':
        return (
          <CampaignList
            onSelect={openCampaign}
            onCreate={() => setActiveTab('create')}
          />
        );
      case 'campaign-detail':
        return (
          <CampaignDetail
            id={selectedCampaignId}
            onBack={() => setActiveTab('campaigns')}
          />
        );
      case 'donate':
        return <DonatePage slug={selectedCampaignId} />;
      case 'create':
        return <CreateCampaign onCreate={openCampaign} />;
      case 'dashboard':
        return <Dashboard onSelect={openCampaign} />;
      case 'wallet':
        return <WalletInfo />;
      case 'blockchain':
        return <BlockchainInfo />;
      default:
        return (
          <LandingPage
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectCampaign={openCampaign}
          />
        );
    }
  };

  return (
    <div className="app">
      <Toaster position="bottom-center" />
      <header className="header">
        <div className="header-left">
          <div
            className="logo"
            onClick={() => setActiveTab('home')}
            style={{ cursor: 'pointer' }}
            title="Go to Home"
          >
            <img src="/zecdonation_logo.png" alt="ZECDonation Logo" className="logo-img" />
            <h1>ZECDonation</h1>
          </div>
        </div>
        <nav className="nav">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`nav-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Atmospheric blurred ambient flower backdrop for other pages (not landing page) */}
      {activeTab !== 'home' && (
        <div className="subpage-ambient-bg" aria-hidden="true">
          <video
            className="subpage-bg-video"
            autoPlay
            muted
            loop
            playsInline
            src={FLOWER_BG}
          />
          <div className="subpage-bg-overlay" />
        </div>
      )}

      <main className="main">{renderTab()}</main>
      <footer className="footer">
        <span>ZecDonation — Zcash Testnet Donation DApp</span>
        <span className="footer-privacy">Transparent &bull; Shielded</span>
      </footer>
    </div>
  );
}
