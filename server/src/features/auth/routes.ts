import { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { staff } from '../../db/schema.js';
import { generateTokens, verifyRefreshToken } from '../../lib/jwt.js';

function generateOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/request-code', async (request, reply) => {
    const { email } = request.body as { email: string };

    const [user] = await fastify.db.select().from(staff).where(eq(staff.email, email)).limit(1);
    if (!user || !user.active) {
      // Don't reveal whether email exists
      return { ok: true };
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await fastify.db.update(staff).set({ otpCode: code, otpExpiresAt: expiresAt }).where(eq(staff.id, user.id));

    console.log(`[OTP] Code for ${email}: ${code}`);

    return { ok: true };
  });

  fastify.post('/auth/verify-code', async (request, reply) => {
    const { email, code } = request.body as { email: string; code: string };

    const [user] = await fastify.db.select().from(staff).where(eq(staff.email, email)).limit(1);
    if (!user || !user.active) {
      return reply.status(401).send({ error: 'Invalid code' });
    }

    if (!user.otpCode || !user.otpExpiresAt || user.otpCode !== code) {
      return reply.status(401).send({ error: 'Invalid code' });
    }

    if (new Date() > user.otpExpiresAt) {
      return reply.status(401).send({ error: 'Code expired' });
    }

    // Clear OTP
    await fastify.db.update(staff).set({ otpCode: null, otpExpiresAt: null }).where(eq(staff.id, user.id));

    const tokens = generateTokens({ staffId: user.id, shopId: user.shopId, role: user.role });
    return { ...tokens, staff: { id: user.id, name: user.name, role: user.role } };
  });

  fastify.post('/auth/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }

    const tokens = generateTokens({ staffId: payload.staffId, shopId: payload.shopId, role: payload.role });
    return tokens;
  });
}
