import { FastifyInstance } from 'fastify';
import { eq, desc, sql, ilike, or } from 'drizzle-orm';
import { customers, loyaltyCards, stampTransactions, staff, shops } from '../../db/schema.js';

export default async function adminRoutes(fastify: FastifyInstance) {
  // Dashboard stats
  fastify.get('/admin/stats', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request) => {
    const { shopId } = request.staffAuth;

    const [customerCount] = await fastify.db
      .select({ count: sql<number>`count(*)::int` })
      .from(loyaltyCards)
      .where(eq(loyaltyCards.shopId, shopId));

    const [stampCount] = await fastify.db
      .select({ count: sql<number>`count(*)::int` })
      .from(stampTransactions)
      .innerJoin(loyaltyCards, eq(stampTransactions.cardId, loyaltyCards.id))
      .where(eq(loyaltyCards.shopId, shopId));

    const [redeemCount] = await fastify.db
      .select({ total: sql<number>`coalesce(sum(${loyaltyCards.totalRedeemed}), 0)::int` })
      .from(loyaltyCards)
      .where(eq(loyaltyCards.shopId, shopId));

    const [staffCount] = await fastify.db
      .select({ count: sql<number>`count(*)::int` })
      .from(staff)
      .where(eq(staff.shopId, shopId));

    return {
      customers: customerCount.count,
      totalStamps: stampCount.count,
      totalRedeemed: redeemCount.total,
      staffCount: staffCount.count,
    };
  });

  // List customers with pagination and search
  fastify.get('/admin/customers', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request) => {
    const { shopId } = request.staffAuth;
    const { page = '1', limit = '20', search = '' } = request.query as {
      page?: string; limit?: string; search?: string;
    };

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = fastify.db
      .select({
        id: customers.id,
        telegramId: customers.telegramId,
        firstName: customers.firstName,
        lastName: customers.lastName,
        username: customers.username,
        stampCount: loyaltyCards.stampCount,
        totalRedeemed: loyaltyCards.totalRedeemed,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .innerJoin(loyaltyCards, eq(loyaltyCards.customerId, customers.id))
      .where(eq(loyaltyCards.shopId, shopId))
      .orderBy(desc(customers.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    if (search) {
      query = fastify.db
        .select({
          id: customers.id,
          telegramId: customers.telegramId,
          firstName: customers.firstName,
          lastName: customers.lastName,
          username: customers.username,
          stampCount: loyaltyCards.stampCount,
          totalRedeemed: loyaltyCards.totalRedeemed,
          createdAt: customers.createdAt,
        })
        .from(customers)
        .innerJoin(loyaltyCards, eq(loyaltyCards.customerId, customers.id))
        .where(
          sql`${loyaltyCards.shopId} = ${shopId} AND (
            ${customers.firstName} ILIKE ${'%' + search + '%'} OR
            ${customers.username} ILIKE ${'%' + search + '%'} OR
            ${customers.telegramId} ILIKE ${'%' + search + '%'}
          )`
        )
        .orderBy(desc(customers.createdAt))
        .limit(parseInt(limit))
        .offset(offset);
    }

    const rows = await query;
    return { data: rows, page: parseInt(page), limit: parseInt(limit) };
  });

  // Transaction logs
  fastify.get('/admin/transactions', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request) => {
    const { shopId } = request.staffAuth;
    const { page = '1', limit = '50' } = request.query as { page?: string; limit?: string };
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const rows = await fastify.db
      .select({
        id: stampTransactions.id,
        type: stampTransactions.type,
        stampsBefore: stampTransactions.stampsBefore,
        stampsAfter: stampTransactions.stampsAfter,
        createdAt: stampTransactions.createdAt,
        customerName: customers.firstName,
        staffName: staff.name,
      })
      .from(stampTransactions)
      .innerJoin(loyaltyCards, eq(stampTransactions.cardId, loyaltyCards.id))
      .innerJoin(customers, eq(loyaltyCards.customerId, customers.id))
      .leftJoin(staff, eq(stampTransactions.staffId, staff.id))
      .where(eq(loyaltyCards.shopId, shopId))
      .orderBy(desc(stampTransactions.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    return { data: rows, page: parseInt(page), limit: parseInt(limit) };
  });
}
