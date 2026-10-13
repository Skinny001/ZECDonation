const crypto = require('crypto');

const CROCKFORD_CHARS = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function generateCode() {
  let code = '';
  for (let i = 0; i < 8; i++) {
    const rand = crypto.randomInt(0, 32);
    code += CROCKFORD_CHARS[rand];
  }
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += CROCKFORD_CHARS.indexOf(code[i]);
  }
  code += CROCKFORD_CHARS[sum % 32];
  return code;
}

function validateCode(code) {
  if (!code || code.length !== 9) return false;
  const c = code.toUpperCase();
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const idx = CROCKFORD_CHARS.indexOf(c[i]);
    if (idx === -1) return false;
    sum += idx;
  }
  return c[8] === CROCKFORD_CHARS[sum % 32];
}

module.exports = { generateCode, validateCode };
