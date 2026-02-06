import 'dotenv/config';
import { getAllSessions, closeRedis } from './sessions.js';
import { fetchPermessoStatus } from './permesso-checker.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Sanitize HTML for Telegram - strips all HTML tags from external content
 * since it may contain malformed or unsupported tags
 */
function sanitizeForTelegram(text) {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> to newlines
    .replace(/<[^>]+>/g, '');        // Strip all HTML tags
}

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
    return;
  }
  
  console.log(`📤 Notifying ${chatIds.length} user(s)...`);
  
  for (const chatId of chatIds) {
    const { pratica } = sessions[chatId];
    console.log(`\n🔍 Checking ${pratica} for chat ${chatId}`);
    
    try {
      const status = await fetchPermessoStatus(pratica);
      
      if (!status) {
        await sendTelegramMessage(chatId, `❌ Could not fetch status for ${pratica}`);
        continue;
      }
      
      const message = `📋 <b>Permesso di Soggiorno</b>

📝 Pratica: <code>${status.praticaNumber}</code>
📅 ${status.pubDate}

${sanitizeForTelegram(status.description)}`;

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
