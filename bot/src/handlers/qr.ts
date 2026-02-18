import { CommandContext, Context, InputFile } from 'grammy';
import QRCode from 'qrcode';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

export async function qrHandler(ctx: CommandContext<Context>) {
  const joinUrl = `${CLIENT_URL}/join`;

  const buffer = await QRCode.toBuffer(joinUrl, {
    width: 512,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  await ctx.replyWithPhoto(new InputFile(buffer, 'join-qr.png'), {
    caption:
      `📱 QR-код для регистрации клиентов\n\n` +
      `Покажите этот QR клиенту — он отсканирует и зарегистрируется через веб.\n\n` +
      `Ссылка: ${joinUrl}`,
  });
}
