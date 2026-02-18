import crypto from 'node:crypto';
import Redis from 'ioredis';

export async function checkStampInterval(redis: Redis, cardId: string, intervalSec: number): Promise<boolean> {
  const key = `stamp:last:${cardId}`;
  const exists = await redis.set(key, '1', 'EX', intervalSec, 'NX');
  return exists === 'OK'; // true = allowed, false = too soon
}

export async function checkReplayProtection(redis: Redis, qrPayload: string): Promise<boolean> {
  const hash = crypto.createHash('sha256').update(qrPayload).digest('hex');
  const key = `qr:nonce:${hash}`;
  const exists = await redis.set(key, '1', 'EX', 120, 'NX');
  return exists === 'OK'; // true = first use, false = replay
}
