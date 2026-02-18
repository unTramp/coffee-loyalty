import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { JwtPayload } from '../plugins/auth.js';

export function generateTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
  } catch {
    return null;
  }
}
