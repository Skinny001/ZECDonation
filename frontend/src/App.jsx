import React, { useState, useEffect } from 'react';
import { api } from './api';
import CampaignList from './components/CampaignList';
import CampaignDetail from './components/CampaignDetail';
import CreateCampaign from './components/CreateCampaign';
import Dashboard from './components/Dashboard';
import WalletInfo from './components/WalletInfo';
import BlockchainInfo from './components/BlockchainInfo';
import './App.css';

const TABS = [
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'create', label: 'Start a Campaign' },
  { key: 'dashboard', label: 'Stats' },
  { key: 'wallet', label: 'Getting Started' },
  { key: 'blockchain', label: 'Network' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('campaigns');
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
      case 'campaigns':
        return <CampaignList onSelect={openCampaign} />;
      case 'campaign-detail':
        return (
          <CampaignDetail
            id={selectedCampaignId}
            onBack={() => setActiveTab('campaigns')}
          />
        );
      case 'create':
        return <CreateCampaign onCreate={openCampaign} />;
      case 'dashboard':
        return <Dashboard onSelect={openCampaign} />;
      case 'wallet':
        return <WalletInfo />;
      case 'blockchain':
        return <BlockchainInfo />;
      default:
        return <CampaignList onSelect={openCampaign} />;
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">⛓️</span>
            <h1>ZecDonation</h1>
          </div>
          {health && (
            <span className="health-badge">
              <span className="health-dot" />
              {health.status}
            </span>
          )}
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
      <main className="main">{renderTab()}</main>
      <footer className="footer">
        <span>ZecDonation — Zcash Testnet Donation DApp</span>
        <span className="footer-privacy">Transparent &bull; Shielded</span>
      </footer>
    </div>
  );
}
