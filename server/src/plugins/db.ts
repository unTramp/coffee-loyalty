import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { db, Database } from '../db/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('db', db);
});
