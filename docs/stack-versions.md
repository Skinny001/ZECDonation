# Zcash Stack Versions

This file records the specific pinned versions of Zcash node, indexer, and wallet components to ensure compatibility for the NU7 testnet upgrades.

## Node
- **Component**: Zebra
- **Version**: 7.0.0-rc.0 (or matching NU7 testnet candidate)
- **Notes**: Upgraded to support NU7 on testnet. Uses state format v29.

## Indexer (Optional/TBD)
- **Component**: Zaino
- **Version**: TBD
- **Notes**: Must be verified for compatibility with Zebra 7.0.0-rc.0.

## Wallet
- **Component**: Zallet
- **Version**: Beta (NU7 PR branch for Zebra backend)
- **Notes**: Connects directly to Zebra state backend. Zaino backend is not yet migrated to NU7.

## Dependencies
- librustzcash NU7 pre-release crate cohort
