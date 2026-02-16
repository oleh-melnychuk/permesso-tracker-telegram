import 'dotenv/config';
import { getAllSessions, getLastStatus, saveLastStatus, closeRedis } from './sessions.js';
import { fetchPermessoStatus, sanitizeForTelegram } from './permesso-checker.js';
import { t, getApiLang, DEFAULT_LANG } from './i18n.js';

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
    console.log('No active sessions');
    await closeRedis();
    return;
  }

  let changed = 0;
  let unchanged = 0;
  let failed = 0;

  for (const chatId of chatIds) {
    const { pratica, lang = DEFAULT_LANG } = sessions[chatId];

    try {
      const apiLang = getApiLang(lang);
      const status = await fetchPermessoStatus(pratica, apiLang);

      if (!status) {
        failed++;
        continue;
      }

      const lastStatus = await getLastStatus(chatId);

      // Save current status for next comparison
      if(lastStatus !== status.description) {
        await saveLastStatus(chatId, status.description);
      }

      // First run (no previous status) — don't send a change notification
      if (!lastStatus) {
        unchanged++;
        continue;
      }

      if (lastStatus === status.description) {
        unchanged++;
        continue;
      }

      // Status changed — notify user
      const message = `${t(lang, 'notifyChanged')}

${t(lang, 'notifyTitle')}

📝 ${t(lang, 'praticaLabel')}: <code>${status.praticaNumber}</code>
📅 ${status.pubDate}

${status.description}`;

      const ok = await sendTelegramMessage(chatId, message);
      ok ? changed++ : failed++;
    } catch {
      failed++;
    }
  }

  console.log(`Hourly check — Changed: ${changed} | Unchanged: ${unchanged} | Failed: ${failed}`);
  await closeRedis();
}

main();
