import crypto from 'node:crypto';

export function signQr(customerId: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${customerId}.${timestamp}`;
  const hmac = crypto.createHmac('sha256', secret).update(data).digest('hex').slice(0, 16);
  return `${data}.${hmac}`;
}

export function verifyQr(payload: string, secret: string, maxAgeSec = 60): { customerId: string; timestamp: number } | null {
  const parts = payload.split('.');
  if (parts.length !== 3) return null;

  const [customerId, tsStr, hmac] = parts;
  const timestamp = parseInt(tsStr, 10);
  if (isNaN(timestamp)) return null;

  // Check freshness
  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > maxAgeSec) return null;

  // Verify HMAC
  const data = `${customerId}.${tsStr}`;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('hex').slice(0, 16);
  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) return null;

  return { customerId, timestamp };
}
