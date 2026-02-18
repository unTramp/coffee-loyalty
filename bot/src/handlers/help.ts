import { CommandContext, Context } from 'grammy';

export async function helpHandler(ctx: CommandContext<Context>) {
  await ctx.reply(
    `☕ Coffee Loyalty — помощь\n\n` +
    `/start — Регистрация в программе лояльности\n` +
    `/card — Посмотреть текущие штампы\n` +
    `/admin — Админ-панель\n` +
    `/help — Эта справка\n\n` +
    `Как это работает:\n` +
    `1. Покажите QR-код баристе при покупке кофе\n` +
    `2. Бариста сканирует код — вы получаете штамп\n` +
    `3. Накопите 6 штампов — 7-й кофе бесплатно!`
  );
}
