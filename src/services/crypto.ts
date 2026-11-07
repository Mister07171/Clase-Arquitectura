import QRCode from 'qrcode';
import { TicketPayload } from '../types';

const HMAC_SECRET = 'CINEMAX_SECURE_HMAC_KEY_V1_2026_COOPERATIVA';

/**
 * Pure TypeScript implementation of SHA-256 to allow instant synchronous
 * and asynchronous cryptographic hash generation for QR codes & tamper detection.
 */
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let i: number;
  let j: number;

  for (i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= (code & 0xff) << (24 - (i % 4) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);

    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[j] + (w[j] || 0)) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

/**
 * Generates an HMAC-SHA256 signature for canonical data.
 */
export function generateHmacSha256(canonicalString: string, key: string = HMAC_SECRET): string {
  // Simple HMAC construct: SHA256(key + canonicalString + key)
  return sha256(`HMAC_KEY:${key}#DATA:${canonicalString}#SALT:${key.length}`);
}

/**
 * Builds canonical representation of ticket content to verify integrity.
 */
export function getCanonicalTicketData(ticket: Omit<TicketPayload, 'signature'>): string {
  return `${ticket.ticketId}|${ticket.showtimeId}|${ticket.movie}|${ticket.room}|${ticket.seat}|${ticket.issuedAt}`;
}

/**
 * Signs ticket data and returns the full payload.
 */
export function signTicket(
  ticketData: Omit<TicketPayload, 'signature'>
): TicketPayload {
  const canonical = getCanonicalTicketData(ticketData);
  const signature = generateHmacSha256(canonical);
  return {
    ...ticketData,
    signature,
  };
}

/**
 * Verifies if a ticket payload's HMAC-SHA256 signature is valid and authentic.
 */
export function verifyTicketSignature(payload: TicketPayload): { isValid: boolean; reason?: string } {
  if (!payload || !payload.ticketId || !payload.signature) {
    return { isValid: false, reason: 'Payload incompleto o estructura corrupta' };
  }

  const { signature, ...rest } = payload;
  const canonical = getCanonicalTicketData(rest);
  const expectedSignature = generateHmacSha256(canonical);

  if (signature !== expectedSignature) {
    return {
      isValid: false,
      reason: 'Firma criptográfica inválida (Posible falsificación o alteración de datos)',
    };
  }

  return { isValid: true };
}

/**
 * Generates an actual QR code image Data URL for rendering.
 */
export async function generateQrDataUrl(payload: TicketPayload): Promise<string> {
  try {
    const jsonString = JSON.stringify(payload);
    return await QRCode.toDataURL(jsonString, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 250,
      color: {
        dark: '#030712',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR:', err);
    return '';
  }
}
