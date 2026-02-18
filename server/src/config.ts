export const config = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgres://coffee:coffee@localhost:5433/coffee_loyalty',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6380',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret',
  hmacSecret: process.env.HMAC_SECRET || 'dev-hmac-secret',
  botToken: process.env.BOT_TOKEN || '',
  botSecret: process.env.BOT_SECRET || 'dev-bot-secret',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:3000',
};
