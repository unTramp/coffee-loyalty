import { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { Resend } from 'resend';
import { customers, loyaltyCards, shops } from '../../db/schema.js';
import { signQr } from '../../lib/qr.js';

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

function generateOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default async function customerRoutes(fastify: FastifyInstance) {
  // ─── Web registration / login ─────────────────────────────────
  fastify.post('/customers/join', async (request, reply) => {
    const { email, firstName } = request.body as { email: string; firstName?: string };

    if (!email || !email.includes('@')) {
      return reply.status(400).send({ error: 'Invalid email' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let [customer] = await fastify.db.select().from(customers)
      .where(eq(customers.email, normalizedEmail)).limit(1);

    if (!customer) {
      if (!firstName || !firstName.trim()) {
        return { needsName: true };
      }
      [customer] = await fastify.db.insert(customers).values({
        email: normalizedEmail,
        firstName: firstName.trim(),
      }).returning();
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await fastify.db.update(customers)
      .set({ otpCode: code, otpExpiresAt: expiresAt })
      .where(eq(customers.id, customer.id));

    if (resend) {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: normalizedEmail,
        subject: 'Код входа — Coffee Loyalty',
        html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;text-align:center;padding:40px 20px">
          <h2 style="color:#333">☕ Coffee Loyalty</h2>
          <p style="color:#666;font-size:16px">Ваш код для входа:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#7c3aed;margin:24px 0">${code}</div>
          <p style="color:#999;font-size:14px">Код действителен 5 минут</p>
        </div>`,
      });
      console.log(`[OTP] Customer code sent to ${normalizedEmail}`);
    } else {
      console.log(`[OTP] Customer code for ${normalizedEmail}: ${code} (no RESEND_API_KEY)`);
    }

    return { ok: true };
  });

  fastify.post('/customers/verify', async (request, reply) => {
    const { email, code } = request.body as { email: string; code: string };

    if (!email || !code) {
      return reply.status(400).send({ error: 'Email and code required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [customer] = await fastify.db.select().from(customers)
      .where(eq(customers.email, normalizedEmail)).limit(1);

    if (!customer || !customer.otpCode || !customer.otpExpiresAt || customer.otpCode !== code) {
      return reply.status(401).send({ error: 'Invalid code' });
    }

    if (new Date() > customer.otpExpiresAt) {
      return reply.status(401).send({ error: 'Code expired' });
    }

    // Clear OTP
    await fastify.db.update(customers)
      .set({ otpCode: null, otpExpiresAt: null })
      .where(eq(customers.id, customer.id));

    // Ensure loyalty card exists (use first shop)
    const [shop] = await fastify.db.select().from(shops).limit(1);
    if (shop) {
      const [existingCard] = await fastify.db.select().from(loyaltyCards)
        .where(and(eq(loyaltyCards.customerId, customer.id), eq(loyaltyCards.shopId, shop.id)))
        .limit(1);
      if (!existingCard) {
        await fastify.db.insert(loyaltyCards).values({
          customerId: customer.id,
          shopId: shop.id,
        });
      }
    }

    return { customerId: customer.id };
  });

  // ─── Bot registration ─────────────────────────────────────────
  // Register customer (called from bot)
  fastify.post('/customers', { preHandler: [fastify.verifyBotSecret] }, async (request, reply) => {
    const { telegramId, firstName, lastName, username, shopId } = request.body as {
      telegramId: string;
      firstName: string;
      lastName?: string;
      username?: string;
      shopId: string;
    };

    // Upsert customer
    let [customer] = await fastify.db.select().from(customers).where(eq(customers.telegramId, telegramId)).limit(1);

    if (!customer) {
      [customer] = await fastify.db.insert(customers).values({
        telegramId,
        firstName,
        lastName: lastName || null,
        username: username || null,
      }).returning();
    }

    // Create loyalty card if not exists
    let [card] = await fastify.db.select().from(loyaltyCards)
      .where(and(eq(loyaltyCards.customerId, customer.id), eq(loyaltyCards.shopId, shopId)))
      .limit(1);

    if (!card) {
      [card] = await fastify.db.insert(loyaltyCards).values({
        customerId: customer.id,
        shopId,
      }).returning();
    }

    return { customer, card };
  });

  // Generate QR code for customer
  fastify.get('/customers/:id/qr', async (request, reply) => {
    const { id } = request.params as { id: string };

    const [customer] = await fastify.db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (!customer) {
      return reply.status(404).send({ error: 'Customer not found' });
    }

    // Get shop's HMAC secret (use first shop for now)
    const [shop] = await fastify.db.select().from(shops).limit(1);
    if (!shop) {
      return reply.status(500).send({ error: 'No shop configured' });
    }

    const qrPayload = signQr(customer.id, shop.hmacSecret);
    return { qrPayload };
  });

  // Get customer card info
  fastify.get('/customers/:id/card', async (request, reply) => {
    const { id } = request.params as { id: string };

    const [customer] = await fastify.db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (!customer) {
      return reply.status(404).send({ error: 'Customer not found' });
    }

    const [card] = await fastify.db.select().from(loyaltyCards)
      .where(eq(loyaltyCards.customerId, customer.id))
      .limit(1);

    const [shop] = await fastify.db.select().from(shops).limit(1);

    return {
      customer,
      card: card || null,
      stampGoal: shop?.stampGoal || 6,
    };
  });

  // Get customer by telegram ID
  fastify.get('/customers/telegram/:telegramId', async (request, reply) => {
    const { telegramId } = request.params as { telegramId: string };

    const [customer] = await fastify.db.select().from(customers).where(eq(customers.telegramId, telegramId)).limit(1);
    if (!customer) {
      return reply.status(404).send({ error: 'Customer not found' });
    }

    const [card] = await fastify.db.select().from(loyaltyCards)
      .where(eq(loyaltyCards.customerId, customer.id))
      .limit(1);

    const [shop] = await fastify.db.select().from(shops).limit(1);

    return { customer, card, stampGoal: shop?.stampGoal || 6 };
  });
}
