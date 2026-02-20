import { CommandContext, Context } from 'grammy';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const BOT_SECRET = process.env.BOT_SECRET || 'dev-bot-secret';
const SHOP_ID = process.env.SHOP_ID || '';

export async function startHandler(ctx: CommandContext<Context>) {
  const user = ctx.from;
  if (!user) return;

  try {
    // Register customer via API
    const res = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-secret': BOT_SECRET,
      },
      body: JSON.stringify({
        telegramId: String(user.id),
        firstName: user.first_name,
        lastName: user.last_name || '',
        username: user.username || '',
        shopId: SHOP_ID,
      }),
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json() as { customer: { id: string }; card: { stampCount: number } };

    const cardUrl = `${CLIENT_URL}/customer/${data.customer.id}`;

    await ctx.reply(
      `☕ Добро пожаловать в программу лояльности!\n\n` +
      `Накопите 6 штампов — и 7-й кофе бесплатно!\n\n` +
      `Ваши штампы: ${data.card.stampCount}/6\n\n` +
      `Покажите QR-код баристе для начисления штампа.`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '📱 Открыть карту', url: cardUrl }
          ]],
        },
      }
    );
  } catch (err) {
    console.error('Start handler error:', err);
    await ctx.reply('Произошла ошибка при регистрации. Попробуйте позже.');
  }
}
