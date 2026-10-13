const test = require('node:test');
const assert = require('node:assert');
const { generateCode, validateCode } = require('../src/domain/campaign');

test('Campaign Code Generator', async (t) => {
  await t.test('generates valid 9-char code', () => {
    const code = generateCode();
    assert.strictEqual(code.length, 9);
    assert.ok(/^[0-9A-HJKMNP-TV-Z]+$/.test(code)); // Crockford chars
    assert.ok(validateCode(code));
  });

  await t.test('invalidates bad codes', () => {
    const code = generateCode();
    // Tamper with code
    const badCode = code.substring(0, 8) + (code[8] === 'A' ? 'B' : 'A');
    assert.ok(!validateCode(badCode));
    
    assert.ok(!validateCode('123'));
    assert.ok(!validateCode(null));
  });
});
