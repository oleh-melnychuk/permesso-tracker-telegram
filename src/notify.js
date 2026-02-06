import 'dotenv/config';
import { getAllSessions, closeRedis } from './sessions.js';
import { fetchPermessoStatus, sanitizeForTelegram } from './permesso-checker.js';
import { t, getApiLang, DEFAULT_LANG } from './i18n.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required');
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
  
  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to send to ${chatId}: ${error}`);
    return false;
  }
  return true;
}

async function main() {
  const sessions = await getAllSessions();
  const chatIds = Object.keys(sessions);
  
  if (chatIds.length === 0) {
    console.log('No sessions to notify');
    await closeRedis();
    return;
  }
  
  console.log(`📤 Notifying ${chatIds.length} user(s)...`);
  
  for (const chatId of chatIds) {
    const { pratica, lang = DEFAULT_LANG } = sessions[chatId];
    console.log(`\n🔍 Checking ${pratica} for chat ${chatId} (${lang})`);
    
    try {
      const apiLang = getApiLang(lang);
      const status = await fetchPermessoStatus(pratica, apiLang);
      
      if (!status) {
        await sendTelegramMessage(chatId, t(lang, 'notifyError', sanitizeForTelegram(pratica)));
        continue;
      }
      
      const message = `${t(lang, 'notifyTitle')}

📝 ${t(lang, 'praticaLabel')}: <code>${status.praticaNumber}</code>
📅 ${status.pubDate}

${status.description}`;

      const sent = await sendTelegramMessage(chatId, message);
      if (sent) {
        console.log(`✅ Notified chat ${chatId}`);
      }
    } catch (error) {
      console.error(`❌ Error for ${chatId}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Done');
  await closeRedis();
}

main();
