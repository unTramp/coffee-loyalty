import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';

// Plugins
import dbPlugin from './plugins/db.js';
import redisPlugin from './plugins/redis.js';
import authPlugin from './plugins/auth.js';

// Routes
import authRoutes from './features/auth/routes.js';
import customerRoutes from './features/customer/routes.js';
import stampRoutes from './features/stamp/routes.js';
import staffRoutes from './features/staff/routes.js';
import adminRoutes from './features/admin/routes.js';
import telegramRoutes from './features/telegram/routes.js';

const app = Fastify({ logger: true });

// CORS
await app.register(cors, { origin: true, credentials: true });

// Rate limiting
await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Plugins
await app.register(dbPlugin);
await app.register(redisPlugin);
await app.register(authPlugin);

// Global error handler
app.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
  app.log.error(error);
  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send({
    error: statusCode >= 500 ? 'Internal server error' : error.message,
  });
});

// Health check
app.get('/health', async () => ({ status: 'ok' }));

// Routes
await app.register(authRoutes);
await app.register(customerRoutes);
await app.register(stampRoutes);
await app.register(staffRoutes);
await app.register(adminRoutes);
await app.register(telegramRoutes);

// Start
try {
  await app.listen({ port: config.port, host: config.host });
  console.log(`Server running on http://${config.host}:${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
