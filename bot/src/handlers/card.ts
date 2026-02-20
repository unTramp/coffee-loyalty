import { CommandContext, Context } from 'grammy';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

export async function cardHandler(ctx: CommandContext<Context>) {
  const user = ctx.from;
  if (!user) return;

  try {
    const res = await fetch(`${API_URL}/customers/telegram/${user.id}`);

    if (res.status === 404) {
      await ctx.reply('Вы ещё не зарегистрированы. Нажмите /start');
      return;
    }

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json() as {
      customer: { id: string };
      card: { stampCount: number; totalRedeemed: number };
      stampGoal: number;
    };

    const stamps = '☕'.repeat(data.card.stampCount) + '○'.repeat(data.stampGoal - data.card.stampCount);

    const cardUrl = `${CLIENT_URL}/customer/${data.customer.id}`;

    await ctx.reply(
      `📋 Ваша карта лояльности\n\n` +
      `${stamps}\n` +
      `Штампы: ${data.card.stampCount}/${data.stampGoal}\n` +
      `Бесплатных кофе получено: ${data.card.totalRedeemed}\n\n` +
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
    console.error('Card handler error:', err);
    await ctx.reply('Ошибка при получении данных. Попробуйте позже.');
  }
}
