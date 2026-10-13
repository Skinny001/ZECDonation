function decodeMemo(hex) {
  if (!hex) return null;
  // Handle case where hex is actually just plain text (mock might do this)
  let buf;
  try {
    buf = Buffer.from(hex, 'hex');
    if (buf.length === 0) return null;
    
    // Check if it's a valid hex string that was actually parsed correctly
    // If someone passes "Hello world" as hex, Buffer.from will silently drop invalid chars
    // So we assume valid hex only
  } catch (e) {
    return null;
  }

  const firstByte = buf[0];
  if (firstByte <= 0xF4) {
    let end = buf.length;
    while (end > 1 && buf[end - 1] === 0x00) {
      end--;
    }
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(buf.subarray(0, end));
      return text;
    } catch(e) {
      return null;
    }
  } else if (firstByte === 0xF6) {
    return null;
  } else {
    return null;
  }
}

function parseDonationMessage(text) {
  if (!text) return { token: null, message: null };
  const tokenRegex = /\bzd:[0-9A-HJKMNP-TV-Z]{8}[0-9A-HJKMNP-TV-Z]\b/i;
  const match = text.match(tokenRegex);
  const token = match ? match[0].toUpperCase() : null;
  
  let message = text;
  if (token) {
    message = message.replace(match[0], '');
  }
  
  message = message.replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (message.length > 512) message = message.substring(0, 512);
  
  return { token, message: message || null };
}

module.exports = { decodeMemo, parseDonationMessage };
