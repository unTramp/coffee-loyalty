import { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { customers, loyaltyCards, shops } from '../../db/schema.js';
import { signQr } from '../../lib/qr.js';

export default async function customerRoutes(fastify: FastifyInstance) {
  // ─── Web registration (simplified — name only) ──────────────────
  fastify.post('/customers/join', async (request, reply) => {
    const { firstName } = request.body as { firstName: string };

    if (!firstName || !firstName.trim()) {
      return reply.status(400).send({ error: 'firstName is required' });
    }

    const [customer] = await fastify.db.insert(customers).values({
      firstName: firstName.trim(),
    }).returning();

    // Create loyalty card (use first shop)
    const [shop] = await fastify.db.select().from(shops).limit(1);
    if (shop) {
      await fastify.db.insert(loyaltyCards).values({
        customerId: customer.id,
        shopId: shop.id,
      });
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
