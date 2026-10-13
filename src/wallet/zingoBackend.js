const { execSync } = require('child_process');
const WalletBackend = require('./WalletBackend');

class ZingoBackend extends WalletBackend {
  constructor(cliPath, server) {
    super();
    this.cliPath = cliPath || '/Users/mac/Desktop/zcash-tools/zingolib/target/release/zingo-cli';
    this.server = server || 'https://testnet.zec.rocks:443';
    this.walletDir = process.env.ZINGO_WALLET_DIR || './.wallet/zingo';
    // Ensure dir exists
    execSync(`mkdir -p ${this.walletDir}`);
  }

  _run(command, args = []) {
    const argsStr = args.join(' ');
    const cmd = `${this.cliPath} --chain testnet --server ${this.server} --data-dir ${this.walletDir} ${command} ${argsStr}`;
    try {
      const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
      return JSON.parse(output);
    } catch (e) {
      console.error(`Zingo error:`, e.stderr || e.message);
      throw new Error(`Zingo CLI failed: ${e.message}`);
    }
  }

  async health() {
    try {
      const info = this._run('info');
      return { status: 'ok', backend: 'zingo', version: info.version };
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  }

  async getAddressAtIndex(accountId, diversifierIndex) {
    const addresses = this._run('addresses');
    return addresses[0].receivers.unified;
  }

  async listReceivedNotes({ sinceHeight } = {}) {
    this._run('sync'); // Sync before listing
    const notes = this._run('notes');
    
    const unspent = notes.unspent_orchard_notes || [];
    return unspent.map((n, i) => ({
      txid: n.created_in_txid,
      pool: 'orchard',
      outputIndex: i,
      valueZat: BigInt(n.value),
      memoHex: n.memo,
      receivedAtAddress: n.address,
      diversifierIndex: 0,
      isChange: false,
      blockHeight: n.created_in_block,
      confirmations: 1
    }));
  }

  async getSpendableBalance(accountId) {
    this._run('sync');
    const bal = this._run('balance');
    return BigInt(bal.orchard_balance || 0);
  }

  async proposePayout({ toUA, amountZat, sweepAll, noteIds } = {}) {
    // Zingo doesn't have a 2-step propose/execute via CLI easily without creating unsigned txs
    // We will just store the intent in memory and execute it during executePayout
    const proposalId = 'zingo_prop_' + Date.now();
    this.pendingProposals = this.pendingProposals || {};
    this.pendingProposals[proposalId] = { toUA, amountZat };

    return {
      proposalId,
      toUA,
      amountZat,
      feeZat: BigInt(10000),
      netZat: amountZat - BigInt(10000)
    };
  }

  async executePayout(proposalId) {
    const prop = this.pendingProposals && this.pendingProposals[proposalId];
    if (!prop) throw new Error('Proposal not found or already executed');

    // Convert amount to decimal string for JSON
    const amountInt = parseInt(prop.amountZat.toString(), 10);
    
    // Zingo send command expects JSON array of recipients
    const sendArgs = `'[{"address": "${prop.toUA}", "amount": ${amountInt}}]'`;
    
    const result = this._run('send', [sendArgs]);
    delete this.pendingProposals[proposalId];
    
    return {
      txid: result[0], // Zingo returns array of txids
      operationId: 'op_' + proposalId
    };
  }

  async getOperation(operationId) {
    return { status: 'success' };
  }

  async validateAddress(ua) {
    return { isValid: true, pools: ['orchard', 'sapling', 'transparent'] };
  }
}

module.exports = ZingoBackend;
