const test = require('node:test');
const assert = require('node:assert');
const { buildPaymentUri } = require('../src/domain/zip321');

test('buildPaymentUri', async (t) => {
  await t.test('builds basic URI without params', () => {
    const uri = buildPaymentUri('tmXYZ', null, null);
    assert.strictEqual(uri, 'zcash:tmXYZ');
  });

  await t.test('builds URI with amount (zatoshis to ZEC)', () => {
    const uri = buildPaymentUri('tmXYZ', 150000000n, null);
    assert.strictEqual(uri, 'zcash:tmXYZ?amount=1.5');
  });

  await t.test('builds URI with memo (base64url)', () => {
    const uri = buildPaymentUri('tmXYZ', null, 'Hello');
    assert.ok(uri.startsWith('zcash:tmXYZ?memo='));
    const memoMatch = uri.match(/memo=([^&]+)/);
    assert.ok(memoMatch);
    assert.ok(!memoMatch[1].includes('=')); // no padding
  });
});
