const fs = require('fs/promises');
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { randomUUID } = require('crypto');

const PROTO_PATH = path.join(__dirname, 'protos', 'lightwalletd.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: false,
  oneofs: true,
});

const rpc = grpc.loadPackageDefinition(packageDefinition).cash.z.wallet.sdk.rpc;

function toNumber(value) {
  if (typeof value === 'string') {
    return Number.parseInt(value, 10);
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  return Number(value || 0);
}

class LightwalletDClient {
  constructor(options = {}) {
    this.endpoint = options.endpoint || process.env.ZCASH_LIGHTWALLETD_URL || 'testnet.zec.rocks:443';
    this.walletFile = path.resolve(
      options.walletFile || process.env.ZCASH_WALLET_FILE || '.wallet/lightwalletd-wallet.json'
    );
    this.receivingAddress = options.receivingAddress || process.env.ZCASH_RECEIVE_ADDRESS || '';
    this.useTls = options.useTls !== undefined
      ? options.useTls
      : process.env.ZCASH_LIGHTWALLETD_INSECURE !== 'true';
    this._wallet = null;
    this._client = null;
  }

  get client() {
    if (!this._client) {
      const credentials = this.useTls
        ? grpc.credentials.createSsl()
        : grpc.credentials.createInsecure();

      this._client = new rpc.CompactTxStreamer(this.endpoint, credentials);
    }

    return this._client;
  }

  async close() {
    if (this._client) {
      this._client.close();
      this._client = null;
    }
  }

  async ensureWallet() {
    if (this._wallet) {
      return this._wallet;
    }

    try {
      const raw = await fs.readFile(this.walletFile, 'utf8');
      this._wallet = JSON.parse(raw);
      return this._wallet;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }

      this._wallet = {
        walletId: randomUUID(),
        createdAt: new Date().toISOString(),
        receiveAddress: this.receivingAddress,
      };

      await this.persistWallet();
      return this._wallet;
    }
  }

  async persistWallet() {
    if (!this._wallet) {
      return;
    }

    await fs.mkdir(path.dirname(this.walletFile), { recursive: true });
    await fs.writeFile(this.walletFile, `${JSON.stringify(this._wallet, null, 2)}\n`, 'utf8');
  }

  async getReceiveAddress() {
    const wallet = await this.ensureWallet();
    if (!wallet.receiveAddress) {
      throw new Error(
        'No local receiving address is configured. Set ZCASH_RECEIVE_ADDRESS or store one in the wallet file.'
      );
    }

    return wallet.receiveAddress;
  }

  async setReceiveAddress(address) {
    if (!address || typeof address !== 'string') {
      throw new Error('A valid receiving address is required');
    }

    const wallet = await this.ensureWallet();
    wallet.receiveAddress = address.trim();
    await this.persistWallet();
    return wallet.receiveAddress;
  }

  unary(method, request = {}) {
    return new Promise((resolve, reject) => {
      this.client[method](request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      });
    });
  }

  async getLightdInfo() {
    return this.unary('GetLightdInfo', {});
  }

  async getBlockchainInfo() {
    const info = await this.getLightdInfo();
    return {
      chain: info.chainName,
      blocks: toNumber(info.blockHeight),
      estimatedHeight: toNumber(info.estimatedHeight),
      bestBlockHash: info.bestBlockHash || null,
      donationAddress: info.donationAddress || (await this.safeReceiveAddress()),
      raw: info,
    };
  }

  async getLatestBlock() {
    return this.unary('GetLatestBlock', {});
  }

  async getBlock(id) {
    return this.unary('GetBlock', id);
  }

  async getBlockRange(startHeight, endHeight, poolTypes = ['POOL_TYPE_TRANSPARENT']) {
    const request = {
      start: { height: Number(startHeight) },
      end: { height: Number(endHeight) },
      poolTypes,
    };

    return new Promise((resolve, reject) => {
      const blocks = [];
      const stream = this.client.GetBlockRange(request);

      stream.on('data', (block) => {
        blocks.push(block);
      });

      stream.on('error', reject);
      stream.on('end', () => resolve(blocks));
    });
  }

  async getTaddressBalance(addresses = []) {
    const normalized = Array.isArray(addresses) ? addresses : [addresses];
    return this.unary('GetTaddressBalance', { addresses: normalized });
  }

  async getWalletBalance() {
    const address = await this.getReceiveAddress();
    const balance = await this.getTaddressBalance([address]);

    return {
      address,
      valueZat: toNumber(balance.valueZat),
      valueZec: (toNumber(balance.valueZat) / 1e8).toFixed(8),
    };
  }

  async getNewAddress() {
    return this.getReceiveAddress();
  }

  async safeReceiveAddress() {
    try {
      return await this.getReceiveAddress();
    } catch {
      return null;
    }
  }
}

const sharedClient = new LightwalletDClient();

module.exports = LightwalletDClient;
module.exports.sharedClient = sharedClient;