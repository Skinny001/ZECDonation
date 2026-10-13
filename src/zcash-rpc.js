const axios = require('axios');
const https = require('https');

const HTTPS_AGENT = new https.Agent({ rejectUnauthorized: false });

class ZcashRPC {
  constructor(url, username, password) {
    this.url = url;
    this.username = username;
    this.password = password;
    this.id = 0;
  }

  async call(method, params = []) {
    try {
      this.id++;
      const response = await axios.post(this.url, {
        jsonrpc: '2.0',
        id: this.id,
        method: method,
        params: params
      }, {
        auth: {
          username: this.username,
          password: this.password
        },
        timeout: 15000,
        httpsAgent: HTTPS_AGENT,
      });

      if (response.data.error) {
        throw new Error(`RPC Error: ${response.data.error.message}`);
      }

      return response.data.result;
    } catch (error) {
      console.error(`RPC call failed for ${method}:`, error.message);
      throw error;
    }
  }

  // Get blockchain info
  async getBlockchainInfo() {
    return this.call('getblockchaininfo');
  }

  // Get wallet info
  async getWalletInfo() {
    return this.call('getwalletinfo');
  }

  // Get list of transactions
  async listTransactions(account = '*', count = 100) {
    return this.call('listtransactions', [account, count]);
  }

  // Get transaction info
  async getTransaction(txid) {
    return this.call('gettransaction', [txid]);
  }

  // Create a new address for receiving donations
  async getNewAddress() {
    return this.call('getnewaddress');
  }

  // Get balance
  async getBalance() {
    return this.call('getbalance');
  }

  // Send transaction
  async sendToAddress(address, amount, comment = '') {
    return this.call('sendtoaddress', [address, amount, comment]);
  }

  // Get amounts received by address (useful for campaign tracking)
  async listReceivedByAddress(minConfirmations = 1, includeEmpty = false, includeWatchOnly = false) {
    return this.call('listreceivedbyaddress', [minConfirmations, includeEmpty, includeWatchOnly]);
  }

  // Validate a Zcash address
  async validateAddress(address) {
    return this.call('validateaddress', [address]);
  }

  // List unspent notes (for shielded transactions)
  async zListUnspent(minConfirmations = 1, maxConfirmations = 9999999, includeWatchOnly = false) {
    return this.call('z_listunspent', [minConfirmations, maxConfirmations, includeWatchOnly]);
  }

  // Get total balance, including shielded
  async getZBalance(address = '*') {
    return this.call('z_getbalance', [address]);
  }

  // Get total balance for all addresses (for campaign overview)
  async getBalances() {
    try {
      // Sapling balance first
      const saplingBalance = await this.getZBalance('*');
      return {
        transparent: await this.getBalance(),
        sapling: saplingBalance,
        total: (parseFloat(await this.getBalance()) + parseFloat(saplingBalance)).toString(),
      };
    } catch {
      return { transparent: await this.getBalance() };
    }
  }
}

module.exports = ZcashRPC;
