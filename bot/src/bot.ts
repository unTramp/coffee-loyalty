import { Bot, webhookCallback } from 'grammy';
import { startHandler } from './handlers/start.js';
import { cardHandler } from './handlers/card.js';
import { helpHandler } from './handlers/help.js';
import { adminHandler } from './handlers/admin.js';
import { qrHandler } from './handlers/qr.js';

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('BOT_TOKEN is required');
  process.exit(1);
}

const bot = new Bot(token);

// Handlers
bot.command('start', startHandler);
bot.command('card', cardHandler);
bot.command('help', helpHandler);
bot.command('admin', adminHandler);
bot.command('qr', qrHandler);

// Log all updates
bot.use(async (ctx, next) => {
  console.log(`[BOT] Update: ${ctx.update.update_id}, type: ${ctx.message?.text || 'unknown'}`);
  await next();
});

// Error handler
bot.catch((err) => {
  console.error('[BOT] Error:', err);
});

// Register commands menu in Telegram
bot.api.setMyCommands([
  { command: 'start', description: 'Регистрация в программе лояльности' },
  { command: 'card', description: 'Моя карта и штампы' },
  { command: 'qr', description: 'QR-код для регистрации клиентов' },
  { command: 'admin', description: 'Админ-панель' },
  { command: 'help', description: 'Справка' },
]);

// Run mode: polling (dev) or webhook (prod)
const mode = process.env.BOT_MODE || 'polling';

if (mode === 'webhook') {
  const { createServer } = await import('node:http');
  const handleUpdate = webhookCallback(bot, 'http');

  const server = createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/telegram/webhook') {
      await handleUpdate(req, res);
    } else if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  const port = parseInt(process.env.BOT_PORT || '3001');
  server.listen(port, () => {
    console.log(`Bot webhook server running on port ${port}`);
  });
} else {
  console.log('Starting bot in polling mode...');
  bot.start();
}

export { bot };
