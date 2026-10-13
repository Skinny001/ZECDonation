/**
 * @typedef {Object} ReceivedNote
 * @property {string} txid
 * @property {string} pool                // 'sapling'|'orchard'|'ironwood'|...
 * @property {number} outputIndex
 * @property {bigint} valueZat
 * @property {string|null} memoHex
 * @property {string|null} receivedAtAddress
 * @property {number|null} diversifierIndex
 * @property {boolean} isChange
 * @property {number|null} blockHeight
 * @property {number} confirmations
 */

class WalletBackend {
  async health() { throw new Error('Not implemented'); }
  async getAddressAtIndex(accountId, diversifierIndex) { throw new Error('Not implemented'); }
  async listReceivedNotes({ sinceHeight } = {}) { throw new Error('Not implemented'); }
  async getSpendableBalance(accountId) { throw new Error('Not implemented'); }
  async proposePayout({ toUA, amountZat, sweepAll, noteIds } = {}) { throw new Error('Not implemented'); }
  async executePayout(proposalId) { throw new Error('Not implemented'); }
  async getOperation(operationId) { throw new Error('Not implemented'); }
  async validateAddress(ua) { throw new Error('Not implemented'); }
}

module.exports = WalletBackend;
