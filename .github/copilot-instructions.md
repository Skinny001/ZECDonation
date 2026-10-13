# Zcash Testnet Donation App - Backend Setup

This is a Node.js backend for a Zcash testnet donation application.

## Project Overview
- Backend API for managing Zcash donations on testnet
- Express.js server with REST endpoints
- Zcash RPC integration (testnet.zec.rocks)
- SQLite database for donation tracking
- No frontend (API-only)

## Setup Status
- [x] Project scaffolding
- [x] Install dependencies (480 packages installed)
- [x] Configure LightwalletD + local wallet profile (environment template created)
- [x] Verify compilation (all files validated)
- [ ] Create and run dev server

## How to Run

1. **Configure credentials:**
   ```bash
   # Edit .env with your LightwalletD endpoint and local wallet address
   ZCASH_LIGHTWALLETD_URL=testnet.zec.rocks:443
   ZCASH_RECEIVE_ADDRESS=your_local_receiving_address
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Server will start on:** `http://localhost:3000`

## Project Structure

```
src/
├── server.js            # Main Express server with all API endpoints
├── database.js          # SQLite database initialization
├── lightwalletd-client.js # LightwalletD gRPC client and local wallet profile
└── donation-service.js  # Donation business logic

Files:
├── package.json         # Dependencies configuration
├── .env                 # Environment variables (edit with your credentials)
├── .env.example         # Example environment file
├── README.md            # Full API documentation
└── test-api.sh          # API testing script
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/blockchain/info` - Blockchain information
- `GET /api/statistics` - Donation statistics
- `POST /api/donations` - Create donation
- `GET /api/donations` - List donations
- `GET /api/donations/:id` - Get donation details
- `PATCH /api/donations/:id` - Update donation status
- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/address` - Store or return the local receiving address
