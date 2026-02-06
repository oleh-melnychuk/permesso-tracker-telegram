import 'dotenv/config';
import { getAllSessions, closeRedis } from './sessions.js';
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
    await closeRedis();
    return;
  }
  
  let sent = 0;
  let failed = 0;
  
  for (const chatId of chatIds) {
    const { pratica, lang = DEFAULT_LANG } = sessions[chatId];
    
    try {
      const apiLang = getApiLang(lang);
      const status = await fetchPermessoStatus(pratica, apiLang);
      
      if (!status) {
        await sendTelegramMessage(chatId, t(lang, 'notifyError', sanitizeForTelegram(pratica)));
        failed++;
        continue;
      }
      
      const message = `${t(lang, 'notifyTitle')}

📝 ${t(lang, 'praticaLabel')}: <code>${status.praticaNumber}</code>
📅 ${status.pubDate}

${status.description}`;

      const ok = await sendTelegramMessage(chatId, message);
      ok ? sent++ : failed++;
    } catch {
      failed++;
    }
  }
  
  console.log(`Notified: ${sent}, Failed: ${failed}`);
  await closeRedis();
}

main();
