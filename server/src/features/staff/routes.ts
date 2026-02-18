import { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { staff } from '../../db/schema.js';

export default async function staffRoutes(fastify: FastifyInstance) {
  // List staff
  fastify.get('/admin/staff', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request) => {
    return fastify.db.select({
      id: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      active: staff.active,
      createdAt: staff.createdAt,
    }).from(staff).where(eq(staff.shopId, request.staffAuth.shopId));
  });

  // Create staff
  fastify.post('/admin/staff', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    const { email, name, role } = request.body as {
      email: string; name: string; role: string;
    };

    if (!['admin', 'barista'].includes(role)) {
      return reply.status(400).send({ error: 'Invalid role' });
    }

    const [created] = await fastify.db.insert(staff).values({
      shopId: request.staffAuth.shopId,
      email,
      name,
      role,
    }).returning();

    return { id: created.id, email: created.email, name: created.name, role: created.role };
  });

  // Update staff
  fastify.patch('/admin/staff/:id', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; role?: string; active?: boolean };

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.role !== undefined) {
      if (!['admin', 'barista'].includes(body.role)) {
        return reply.status(400).send({ error: 'Invalid role' });
      }
      updates.role = body.role;
    }
    if (body.active !== undefined) updates.active = body.active;

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: 'No fields to update' });
    }

    await fastify.db.update(staff).set(updates).where(eq(staff.id, id));
    return { success: true };
  });

  // Delete (deactivate) staff
  fastify.delete('/admin/staff/:id', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    if (id === request.staffAuth.staffId) {
      return reply.status(400).send({ error: 'Cannot delete yourself' });
    }

    await fastify.db.update(staff).set({ active: false }).where(eq(staff.id, id));
    return { success: true };
  });
}
