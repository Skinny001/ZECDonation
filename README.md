# ZecDonation — Zcash Testnet Donation Platform

A full-stack donation platform built on Zcash testnet. Create campaigns, receive transparent/shielded donations, and track on-chain payments via LightwalletD gRPC.

## Features

- **Campaigns** — Create fundraisers with custom titles, targets, deadlines, and your own receiving address (t-addr or z-addr)
- **Shareable Links** — Each campaign gets a unique slug (`/campaign/<slug>`) for easy sharing
- **On-Chain Verification** — Queries LightwalletD to show transparent transactions received at the campaign address
- **Manual Tracking** — Record donations with optional transaction IDs for shielded/private payments
- **Wallet Integration** — Check balance of your configured receive address via LightwalletD
- **Statistics** — Aggregate donation stats across all campaigns

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, SQLite |
| Blockchain | LightwalletD gRPC (`@grpc/grpc-js`, `@grpc/proto-loader`) |
| Frontend | React 18, Vite |
| Network | Zcash Testnet (via `testnet.zec.rocks:443`) |

## RPC / Blockchain Access

This project uses **LightwalletD gRPC** (not JSON-RPC) to communicate with the Zcash testnet.

- **Endpoint**: `testnet.zec.rocks:443` (public LightwalletD server)
- **Protocol**: gRPC over TLS using the `CompactTxStreamer` service from the Zcash wallet SDK protobuf definitions
- **Proto file**: `src/protos/lightwalletd.proto` (defines `GetLightdInfo`, `GetTaddressBalance`, `GetBlockRange`, etc.)
- **Client**: `src/lightwalletd-client.js` — wraps gRPC calls for balance, blockchain info, and address management
- **Legacy JSON-RPC**: `src/zcash-rpc.js` exists but is **not used** in the current implementation; kept for reference

> **Why LightwalletD?** It provides compact transaction streaming and address-based balance queries without running a full `zcashd` node. Ideal for light clients and web apps.

### ✅ Challenge Requirement: 3+ RPC Methods Used

| # | gRPC Method | Proto Service | Called In | API Endpoint | Frontend Display |
|---|-------------|---------------|-----------|--------------|------------------|
| 1 | `GetLightdInfo` | `CompactTxStreamer` | `lightwalletd-client.js:133` → `getBlockchainInfo()` | `GET /api/blockchain/info` | **Blockchain** tab: chain, height, best block hash |
| 2 | `GetTaddressBalance` | `CompactTxStreamer` | `lightwalletd-client.js:177` → `getWalletBalance()` | `GET /api/wallet/balance` | **Wallet** tab: live ZEC balance of receive address |
| 3 | `GetBlockRange` | `CompactTxStreamer` | `lightwalletd-client.js:157` → `getBlockRange()` | `GET /api/campaigns/:id/blockchain` | **Campaign Detail** → "Donors" table: on-chain txs + total received |

**Source files:**
- Client implementation: `src/lightwalletd-client.js` (lines 133-191)
- Campaign blockchain scan: `src/campaign-service.js` (lines 121-163)
- Route wiring: `src/server.js` (lines 215, 240, 104)

All three methods connect to `testnet.zec.rocks:443` via TLS gRPC and return live testnet data.

## Quick Start

### Prerequisites

- Node.js 18+
- A Zcash testnet wallet address (transparent `t...` or shielded `ztestsapling...`)
  - Get one from [YWallet](https://ywallet.app/) or [Zingo!](https://zingolabs.com/) — switch to **Testnet** in settings

### Backend

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set your receiving address:
# ZCASH_RECEIVE_ADDRESS=t1YourTestnetAddressHere

# 3. Start development server (auto-reload)
npm run dev
# Or production:
npm start
```

Server runs at `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` (proxies `/api` to backend)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ZCASH_LIGHTWALLETD_URL` | `testnet.zec.rocks:443` | LightwalletD gRPC endpoint |
| `ZCASH_LIGHTWALLETD_INSECURE` | `false` | Set `true` for plaintext (dev only) |
| `ZCASH_RECEIVE_ADDRESS` | *required* | Your wallet receive address (t- or z-addr) |
| `ZCASH_WALLET_FILE` | `./.wallet/lightwalletd-wallet.json` | Local wallet profile storage |
| `PORT` | `3000` | Backend HTTP port |
| `DB_PATH` | `./donations.db` | SQLite database file |

## API Reference

### Health & Info
```
GET  /api/health                 # Health check
GET  /api/blockchain/info        # Chain name, height, best block hash
GET  /api/statistics             # Total donations, amounts, counts by status
```

### Campaigns
```
POST   /api/campaigns                    # Create campaign
GET    /api/campaigns                    # List all campaigns
GET    /api/campaigns/:id                # Get campaign by ID
GET    /api/campaigns/slug/:slug         # Get campaign by shareable slug
PATCH  /api/campaigns/:id/deadline       # Update deadline
GET    /api/campaigns/:id/blockchain     # On-chain received amount + tx list
GET    /api/campaigns/:id/donations      # Manual donations for campaign
POST   /api/campaigns/:id/donations      # Record manual donation
```

**Create Campaign Body:**
```json
{
  "title": "Open Source Fundraiser",
  "description": "Support the project",
  "target_amount": 10,
  "deadline": "2026-12-31",
  "donation_address": "tmPWLjYyHtYjZgYzqZJLV3HhVo1YziFu3X7"
}
```

### Wallet
```
GET  /api/wallet/balance         # Balance of configured receive address
POST /api/wallet/address         # Set or return local receive address
```

### Donations (Legacy / Standalone)
```
POST   /api/donations            # Create donation (no campaign)
GET    /api/donations            # List all
GET    /api/donations/:id        # Get by ID
GET    /api/donations/status/:status  # Filter by status
PATCH  /api/donations/:id        # Update status + tx_id
```

## Database Schema

### `campaigns`
```sql
id              TEXT PRIMARY KEY
title           TEXT NOT NULL
description     TEXT
target_amount   REAL NOT NULL
donation_address TEXT NOT NULL
deadline        DATETIME
status          TEXT DEFAULT 'active'
slug            TEXT UNIQUE NOT NULL
created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
```

### `donations`
```sql
id              TEXT PRIMARY KEY
campaign_id     TEXT REFERENCES campaigns(id)
donor_address   TEXT
amount          REAL NOT NULL
message         TEXT
status          TEXT DEFAULT 'pending'  -- pending/completed/failed
tx_id           TEXT
created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
```

### `donation_history`
```sql
id              TEXT PRIMARY KEY
donation_id     TEXT REFERENCES donations(id)
status          TEXT NOT NULL
timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP
details         TEXT
```

## Project Structure

```
ZECDonation/
├── src/
│   ├── server.js                 # Express app, routes
│   ├── database.js               # SQLite init + migrations
│   ├── campaign-service.js       # Campaign CRUD + blockchain queries
│   ├── donation-service.js       # Donation CRUD + stats
│   ├── lightwalletd-client.js    # gRPC client (CompactTxStreamer)
│   ├── zcash-rpc.js              # JSON-RPC client (unused)
│   └── protos/
│       └── lightwalletd.proto    # Protobuf definitions
├── frontend/
│   ├── src/
│   │   ├── api.js                # Fetch wrapper
│   │   ├── App.jsx               # Main app with tabs
│   │   └── components/           # React components
│   └── package.json
├── .env.example
├── package.json
└── donations.db                  # SQLite database (auto-created)
```

## Important Notes

- **Testnet only** — Uses `testnet.zec.rocks`; no mainnet funds at risk
- **Shielded privacy** — z-address transactions are **not visible** on-chain. The "Donors" table shows only transparent (t-addr) transactions + manually recorded entries
- **No custody** — Donations go directly to your wallet address. This app only tracks metadata
- **Public LightwalletD** — Rate limits may apply. For production, run your own LightwalletD instance

## License

MIT