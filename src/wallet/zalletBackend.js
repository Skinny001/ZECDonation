const WalletBackend = require('./WalletBackend');

class ZalletBackend extends WalletBackend {
  constructor(config) {
    super();
    this.url = config.zalletRpcUrl;
    // Basic auth encoding
    const user = config.zalletRpcUser || '';
    const pass = config.zalletRpcPass || '';
    this.auth = Buffer.from(`${user}:${pass}`).toString('base64');
  }

  async _request(method, params = []) {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${this.auth}`
      },
      body: JSON.stringify({
        jsonrpc: '1.0',
        id: Date.now().toString(),
        method,
        params
      })
    });
    
    if (!res.ok) {
      throw new Error(`RPC Error: ${res.statusText}`);
    }
    const data = await res.json();
    if (data.error) {
      throw new Error(`Zallet RPC Error: ${data.error.message}`);
    }
    return data.result;
  }

  async health() {
    // TODO(verify): These are standard zcashd RPCs. Zallet might slightly differ in NU7.
    const info = await this._request('getinfo');
    const binfo = await this._request('getblockchaininfo');
    return {
      synced: info.synced !== undefined ? info.synced : (binfo.verificationprogress > 0.999),
      chainHeight: binfo.blocks,
      walletHeight: binfo.blocks,
      targetBlockSeconds: 25, // NU7 target
      activeUpgrade: binfo.upgrades ? Object.keys(binfo.upgrades).find(k => binfo.upgrades[k].status === 'active') : 'unknown',
      network: binfo.chain || 'testnet'
    };
  }

  async getAddressAtIndex(accountId, diversifierIndex) {
    // TODO(verify): Exact syntax for generating address by diversifier index in Zallet.
    // Typically `z_getaddressforaccount accountId ["orchard"] diversifierIndex`
    const res = await this._request('z_getaddressforaccount', [accountId, ["orchard"], diversifierIndex]);
    return res.address;
  }

  async listReceivedNotes({ sinceHeight } = {}) {
    // TODO(verify): Zallet NU7 might use z_listunspent or a new method to view all incoming notes.
    const unspent = await this._request('z_listunspent', [sinceHeight ? 1 : 0, 9999999, true]);
    return unspent.map(note => ({
      txid: note.txid,
      pool: note.pool || 'unknown',
      outputIndex: note.outindex,
      valueZat: BigInt(Math.floor(note.amount * 1e8)),
      memoHex: note.memo,
      receivedAtAddress: note.address,
      diversifierIndex: null, // Usually not returned directly by z_listunspent
      isChange: note.change || false,
      blockHeight: null, // Can derive from current height - confirmations
      confirmations: note.confirmations
    }));
  }

  async getSpendableBalance(accountId) {
    const res = await this._request('z_getbalanceforaccount', [accountId]);
    // TODO(verify): Ensure total is returned in ZEC or Zatoshis
    return BigInt(Math.floor((res.total || 0) * 1e8));
  }

  async proposePayout({ toUA, amountZat, sweepAll, noteIds } = {}) {
    // TODO(verify): Check how Zallet exposes ZIP-317 fee proposals.
    return { feeZat: 10000n, txCount: 1, proposalId: `zallet-prop-${Date.now()}` };
  }

  async executePayout(proposalId) {
    // TODO(verify): execute the proposed payout
    return { operationIds: ['dummy-opid'] };
  }

  async getOperation(operationId) {
    // Standard async operation check
    const res = await this._request('z_getoperationresult', [[operationId]]);
    if (res && res.length > 0) {
      const op = res[0];
      return { 
        status: op.status === 'success' ? 'confirmed' : (op.status === 'failed' ? 'failed' : 'pending'),
        txid: op.result ? op.result.txid : null,
        error: op.error ? op.error.message : null
      };
    }
    return { status: 'pending' };
  }

  async validateAddress(ua) {
    const res = await this._request('z_validateaddress', [ua]);
    return { valid: res.isvalid, network: 'testnet' }; // Zallet might return network differently
  }
}

module.exports = ZalletBackend;
