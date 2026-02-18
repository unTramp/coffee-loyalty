import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface JwtPayload {
  staffId: string;
  shopId: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    staffAuth: JwtPayload;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorateRequest('staffAuth', null as unknown as JwtPayload);

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing token' });
    }
    try {
      const payload = jwt.verify(header.slice(7), config.jwtSecret) as JwtPayload;
      request.staffAuth = payload;
    } catch {
      return reply.status(401).send({ error: 'Invalid token' });
    }
  });

  fastify.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.staffAuth?.role !== 'admin') {
      return reply.status(403).send({ error: 'Admin access required' });
    }
  });

  fastify.decorate('verifyBotSecret', async (request: FastifyRequest, reply: FastifyReply) => {
    const secret = request.headers['x-bot-secret'];
    if (secret !== config.botSecret) {
      return reply.status(401).send({ error: 'Invalid bot secret' });
    }
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    verifyBotSecret: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
