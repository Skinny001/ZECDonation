const WalletBackend = require('./WalletBackend');

class MockBackend extends WalletBackend {
  constructor() {
    super();
    this.notes = [];
    this.currentHeight = 4465000;
  }

  async health() {
    return {
      synced: true,
      chainHeight: this.currentHeight,
      walletHeight: this.currentHeight,
      targetBlockSeconds: 25,
      activeUpgrade: 'NU7',
      network: 'testnet'
    };
  }

  async getAddressAtIndex(accountId, diversifierIndex) {
    return `utest1mock${diversifierIndex}address`;
  }

  async listReceivedNotes({ sinceHeight } = {}) {
    return this.notes;
  }

  async getSpendableBalance(accountId) {
    let balance = 0n;
    for (const note of this.notes) {
      balance += BigInt(note.valueZat);
    }
    return balance;
  }

  async proposePayout({ toUA, amountZat, sweepAll, noteIds } = {}) {
    return { feeZat: 10000n, txCount: 1, proposalId: 'mock-prop-1' };
  }

  async executePayout(proposalId) {
    return { operationIds: ['mock-op-1'] };
  }

  async getOperation(operationId) {
    return { status: 'confirmed', txid: 'mock-tx-id' };
  }

  async validateAddress(ua) {
    return { valid: ua.startsWith('utest1') || ua.startsWith('tm'), network: 'testnet' };
  }
}

module.exports = MockBackend;
