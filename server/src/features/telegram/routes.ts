import { FastifyInstance } from 'fastify';

export default async function telegramRoutes(fastify: FastifyInstance) {
  // Telegram webhook endpoint — handled by the bot service
  // This is a pass-through if bot runs separately
  fastify.post('/telegram/webhook', async (request, reply) => {
    // In production, the bot handles webhooks directly
    // This endpoint exists for routing purposes
    return { ok: true };
  });
}
