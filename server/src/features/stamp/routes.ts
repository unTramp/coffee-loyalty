import { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { loyaltyCards, shops, stampTransactions } from '../../db/schema.js';
import { verifyQr } from '../../lib/qr.js';
import { checkStampInterval, checkReplayProtection } from '../../lib/antifraud.js';

export default async function stampRoutes(fastify: FastifyInstance) {
  // Stamp a card — the key business endpoint
  fastify.post('/stamps', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { qrPayload } = request.body as { qrPayload: string };
    const { staffId, shopId } = request.staffAuth;

    // 1. Get shop
    const [shop] = await fastify.db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (!shop) {
      return reply.status(400).send({ error: 'Shop not found' });
    }

    // 2. Verify QR signature and freshness
    const qrData = verifyQr(qrPayload, shop.hmacSecret);
    if (!qrData) {
      return reply.status(400).send({ error: 'Invalid or expired QR code' });
    }

    // 3. Replay protection
    const isFirstUse = await checkReplayProtection(fastify.redis, qrPayload);
    if (!isFirstUse) {
      return reply.status(400).send({ error: 'QR code already used' });
    }

    // 4. Get loyalty card
    const [card] = await fastify.db.select().from(loyaltyCards)
      .where(and(eq(loyaltyCards.customerId, qrData.customerId), eq(loyaltyCards.shopId, shopId)))
      .limit(1);

    if (!card) {
      return reply.status(404).send({ error: 'Loyalty card not found' });
    }

    // 5. Check minimum interval
    const intervalOk = await checkStampInterval(fastify.redis, card.id, shop.minIntervalSeconds);
    if (!intervalOk) {
      return reply.status(429).send({ error: 'Too soon — please wait before next stamp' });
    }

    // 6. Increment stamp
    const stampsBefore = card.stampCount;
    let stampsAfter = stampsBefore + 1;
    let redeemed = false;

    if (stampsAfter >= shop.stampGoal) {
      // Auto-redeem: reset stamps, increment total_redeemed
      stampsAfter = 0;
      redeemed = true;

      await fastify.db.update(loyaltyCards)
        .set({
          stampCount: 0,
          totalRedeemed: card.totalRedeemed + 1,
          updatedAt: new Date(),
        })
        .where(eq(loyaltyCards.id, card.id));

      // Log redeem transaction
      await fastify.db.insert(stampTransactions).values({
        cardId: card.id,
        staffId,
        type: 'redeem',
        stampsBefore: shop.stampGoal,
        stampsAfter: 0,
        qrPayload,
        ipAddress: request.ip,
      });
    } else {
      await fastify.db.update(loyaltyCards)
        .set({
          stampCount: stampsAfter,
          updatedAt: new Date(),
        })
        .where(eq(loyaltyCards.id, card.id));
    }

    // Log stamp transaction
    await fastify.db.insert(stampTransactions).values({
      cardId: card.id,
      staffId,
      type: 'stamp',
      stampsBefore,
      stampsAfter,
      qrPayload,
      ipAddress: request.ip,
    });

    return {
      stampsBefore,
      stampsAfter,
      redeemed,
      totalRedeemed: redeemed ? card.totalRedeemed + 1 : card.totalRedeemed,
      stampGoal: shop.stampGoal,
    };
  });
}
