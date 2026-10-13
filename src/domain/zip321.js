function buildPaymentUri(address, amountZat, memoText) {
  const params = new URLSearchParams();
  if (amountZat) {
    params.set('amount', (Number(amountZat) / 1e8).toString());
  }
  if (memoText) {
    const buf = Buffer.alloc(512);
    // ZIP-302 says first byte <= 0xF4 for text. Actually for URI memo param it's just the text.
    // The wallet encodes it into ZIP-302 when constructing the transaction.
    // We just pass the base64url encoded raw bytes.
    const written = buf.write(memoText, 0, 512, 'utf8');
    const b64url = buf.subarray(0, written).toString('base64url');
    params.set('memo', b64url);
  }
  const qs = params.toString();
  return `zcash:${address}${qs ? '?' + qs : ''}`;
}

module.exports = { buildPaymentUri };
