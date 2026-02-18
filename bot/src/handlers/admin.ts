import { CommandContext, Context } from 'grammy';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

export async function adminHandler(ctx: CommandContext<Context>) {
  const adminUrl = `${CLIENT_URL}/login`;
  const isLocal = CLIENT_URL.includes('localhost') || CLIENT_URL.includes('127.0.0.1');

  const text = `🔐 Админ-панель Coffee Loyalty\n\nУправление персоналом, клиентами и статистика.`;

  if (isLocal) {
    await ctx.reply(`${text}\n\n📱 Перейти:\n${adminUrl}`);
  } else {
    await ctx.reply(text, {
      reply_markup: {
        inline_keyboard: [[
          { text: '📱 Открыть панель', url: adminUrl }
        ]],
      },
    });
  }
}
