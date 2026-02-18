import { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { staff } from '../../db/schema.js';
import { generateTokens, verifyRefreshToken } from '../../lib/jwt.js';

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

function generateOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const masked = local[0] + '***';
  return `${masked}@${domain}`;
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Public endpoint: list active staff (masked emails)
  fastify.get('/auth/staff', async () => {
    const rows = await fastify.db
      .select({ id: staff.id, name: staff.name, role: staff.role, email: staff.email })
      .from(staff)
      .where(eq(staff.active, true));

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      emailMasked: maskEmail(r.email),
    }));
  });

  fastify.post('/auth/request-code', async (request, reply) => {
    const { staffId } = request.body as { staffId: string };

    const [user] = await fastify.db.select().from(staff).where(eq(staff.id, staffId)).limit(1);
    if (!user || !user.active) {
      return { ok: true };
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await fastify.db.update(staff).set({ otpCode: code, otpExpiresAt: expiresAt }).where(eq(staff.id, user.id));

    if (resend) {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: 'Код входа — Coffee Loyalty',
        html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;text-align:center;padding:40px 20px">
          <h2 style="color:#333">☕ Coffee Loyalty</h2>
          <p style="color:#666;font-size:16px">Ваш код для входа:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#7c3aed;margin:24px 0">${code}</div>
          <p style="color:#999;font-size:14px">Код действителен 5 минут</p>
        </div>`,
      });
      console.log(`[OTP] Code sent to ${user.email}`);
    } else {
      console.log(`[OTP] Code for ${user.email}: ${code} (no RESEND_API_KEY, email not sent)`);
    }

    return { ok: true };
  });

  fastify.post('/auth/verify-code', async (request, reply) => {
    const { staffId, code } = request.body as { staffId: string; code: string };

    const [user] = await fastify.db.select().from(staff).where(eq(staff.id, staffId)).limit(1);
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
