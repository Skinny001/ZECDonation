const test = require('node:test');
const assert = require('node:assert');
const { decodeMemo, parseDonationMessage } = require('../src/domain/memo');

test('decodeMemo', async (t) => {
  await t.test('returns null for empty or invalid hex', () => {
    assert.strictEqual(decodeMemo(''), null);
    assert.strictEqual(decodeMemo(null), null);
    assert.strictEqual(decodeMemo('xyz'), null); // invalid hex
  });

  await t.test('decodes valid UTF-8 memo (starts with <= 0xF4)', () => {
    const buf = Buffer.alloc(512);
    const text = 'Hello world';
    Buffer.from(text).copy(buf, 0);
    // Fill the rest with 0x00
    for(let i = text.length; i < 512; i++) buf[i] = 0x00;
    
    assert.strictEqual(decodeMemo(buf.toString('hex')), text);
  });

  await t.test('returns null for no memo (starts with 0xF6)', () => {
    const buf = Buffer.alloc(512);
    buf[0] = 0xF6;
    assert.strictEqual(decodeMemo(buf.toString('hex')), null);
  });
});

test('parseDonationMessage', async (t) => {
  await t.test('extracts token and message', () => {
    const res = parseDonationMessage('Good luck team! zd:7H3K9QXA2');
    assert.strictEqual(res.token, 'ZD:7H3K9QXA2');
    assert.strictEqual(res.message, 'Good luck team!');
  });

  await t.test('handles no token', () => {
    const res = parseDonationMessage('Just a message');
    assert.strictEqual(res.token, null);
    assert.strictEqual(res.message, 'Just a message');
  });

  await t.test('caps length and strips control chars', () => {
    const res = parseDonationMessage('Hello\x00World' + 'A'.repeat(600));
    assert.strictEqual(res.token, null);
    assert.strictEqual(res.message.length, 512);
    assert.ok(!res.message.includes('\x00'));
  });
});
