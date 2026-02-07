import 'dotenv/config';
import { getAllSessions, closeRedis } from './sessions.js';
import { t, DEFAULT_LANG } from './i18n.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

async function sendTelegramMessage(chatId, message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });

  return response.ok;
}

async function main() {
  const sessions = await getAllSessions();
  const chatIds = Object.keys(sessions);

  if (chatIds.length === 0) {
    console.log('No active users to remind');
    await closeRedis();
    return;
  }

  let sent = 0;
  let failed = 0;

  for (const chatId of chatIds) {
    const { lang = DEFAULT_LANG } = sessions[chatId];

    try {
      const ok = await sendTelegramMessage(chatId, t(lang, 'donateReminder'));
      ok ? sent++ : failed++;
    } catch {
      failed++;
    }
  }

  console.log(`Donate reminders — Sent: ${sent}, Failed: ${failed}`);
  await closeRedis();
}

main();
