const crypto = require('node:crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(base32Str) {
  const clean = String(base32Str || '')
    .toUpperCase()
    .replace(/=+$/, '')
    .replace(/[^A-Z2-7]/g, '');

  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function generateBase32Secret(byteLength = 20) {
  return base32Encode(crypto.randomBytes(byteLength));
}

function generateTotpAtCounter(secretBase32, counter, digits = 6) {
  const key = base32Decode(secretBase32);
  const counterBuf = Buffer.alloc(8);
  let tmp = BigInt(counter);
  for (let i = 7; i >= 0; i--) {
    counterBuf[i] = Number(tmp & 0xffn);
    tmp >>= 8n;
  }

  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return String(otp).padStart(digits, '0');
}

function verifyTotp(token, secretBase32, window = 1, stepSeconds = 30) {
  if (!token || !secretBase32) return false;
  const cleanToken = String(token).replace(/\s+/g, '').trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const currentCounter = Math.floor(Date.now() / 1000 / stepSeconds);
  const tokenBuf = Buffer.from(cleanToken, 'utf8');

  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const candidate = generateTotpAtCounter(secretBase32, currentCounter + errorWindow, 6);
    const candidateBuf = Buffer.from(candidate, 'utf8');
    if (tokenBuf.length === candidateBuf.length && crypto.timingSafeEqual(tokenBuf, candidateBuf)) {
      return true;
    }
  }

  return false;
}

function buildOtpAuthUri({ secret, accountName, issuer = 'Inventario TI' }) {
  const safeIssuer = encodeURIComponent(issuer);
  const safeAccount = encodeURIComponent(accountName || 'usuario@empresa.local');
  return `otpauth://totp/${safeIssuer}:${safeAccount}?secret=${secret}&issuer=${safeIssuer}&algorithm=SHA1&digits=6&period=30`;
}

function hashBackupCode(rawCode) {
  const normalized = String(rawCode || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function generateBackupCodes(count = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const plainCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    const bytes = crypto.randomBytes(8);
    let part1 = '';
    let part2 = '';
    for (let j = 0; j < 4; j++) {
      part1 += alphabet[bytes[j] % alphabet.length];
      part2 += alphabet[bytes[j + 4] % alphabet.length];
    }
    const code = `${part1}-${part2}`;
    plainCodes.push(code);
    hashedCodes.push(hashBackupCode(code));
  }

  return { plainCodes, hashedCodes };
}

module.exports = {
  generateBase32Secret,
  verifyTotp,
  buildOtpAuthUri,
  generateBackupCodes,
  hashBackupCode,
};
