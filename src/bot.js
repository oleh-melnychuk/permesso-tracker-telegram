import 'dotenv/config';
import { createServer } from 'http';
import TelegramBot from 'node-telegram-bot-api';
import { saveSession, removeSession, getSession, getUserLang, updateSessionLang } from './sessions.js';
import { fetchPermessoStatus, sanitizeForTelegram } from './permesso-checker.js';
import { t, LANGUAGES, getApiLang, DEFAULT_LANG } from './i18n.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const lang = await getUserLang(chatId);
  
  await bot.sendMessage(chatId, t(lang, 'welcome'), { parse_mode: 'HTML' });
});

// /lang command - show language selection
bot.onText(/\/lang/, async (msg) => {
  const chatId = msg.chat.id;
  const lang = await getUserLang(chatId);
  
  const keyboard = {
    inline_keyboard: Object.entries(LANGUAGES).map(([code, { name, flag }]) => ([
      { text: `${flag} ${name}`, callback_data: `lang:${code}` }
    ]))
  };
  
  await bot.sendMessage(chatId, t(lang, 'langPrompt'), {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// Handle language selection callback
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  if (data.startsWith('lang:')) {
    const newLang = data.split(':')[1];
    
    if (LANGUAGES[newLang]) {
      await updateSessionLang(chatId, newLang);
      await bot.answerCallbackQuery(query.id);
      await bot.sendMessage(chatId, t(newLang, 'langChanged', newLang), { parse_mode: 'HTML' });
      await bot.sendMessage(chatId, t(newLang, 'welcome'), { parse_mode: 'HTML' });
    }
  }
});

// /add command
bot.onText(/\/add(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const lang = await getUserLang(chatId);
  const pratica = match[1]?.trim();
  
  if (!pratica) {
    await bot.sendMessage(chatId, t(lang, 'addMissing'), { parse_mode: 'HTML' });
    return;
  }
  
  await bot.sendMessage(chatId, t(lang, 'addValidating'));
  
  try {
    const apiLang = getApiLang(lang);
    const status = await fetchPermessoStatus(pratica, apiLang);
    
    if (!status) {
      await bot.sendMessage(chatId, t(lang, 'addInvalid'));
      return;
    }
    
    await saveSession(chatId, pratica, lang);
    
    await bot.sendMessage(chatId, `${t(lang, 'addSuccess', sanitizeForTelegram(pratica))}

${t(lang, 'currentStatus')}:
${status.description}`, { parse_mode: 'HTML' });
    
  } catch (error) {
    await bot.sendMessage(chatId, t(lang, 'error', sanitizeForTelegram(error.message)));
  }
});

// /remove command
bot.onText(/\/remove/, async (msg) => {
  const chatId = msg.chat.id;
  const lang = await getUserLang(chatId);
  const session = await getSession(chatId);
  
  if (!session?.pratica) {
    await bot.sendMessage(chatId, t(lang, 'removeNone'));
    return;
  }
  
  await removeSession(chatId);
  await bot.sendMessage(chatId, t(lang, 'removeSuccess'));
});

// /status command
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  const lang = await getUserLang(chatId);
  const session = await getSession(chatId);
  
  if (!session?.pratica) {
    await bot.sendMessage(chatId, t(lang, 'statusNone'));
    return;
  }
  
  await bot.sendMessage(chatId, t(lang, 'statusChecking'));
  
  try {
    const apiLang = getApiLang(lang);
    const status = await fetchPermessoStatus(session.pratica, apiLang);
    
    if (!status) {
      await bot.sendMessage(chatId, t(lang, 'statusError'));
      return;
    }
    
    await bot.sendMessage(chatId, `${t(lang, 'notifyTitle')}

📝 ${t(lang, 'praticaLabel')}: <code>${status.praticaNumber}</code>
📅 ${status.pubDate}

${status.description}`, { parse_mode: 'HTML' });
    
  } catch (error) {
    await bot.sendMessage(chatId, t(lang, 'error', sanitizeForTelegram(error.message)));
  }
});

// /info command
bot.onText(/\/info/, async (msg) => {
  const chatId = msg.chat.id;
  const lang = await getUserLang(chatId);
  const session = await getSession(chatId);
  
  if (!session?.pratica) {
    await bot.sendMessage(chatId, t(lang, 'infoNone'));
    return;
  }
  
  const langInfo = LANGUAGES[session.lang] || LANGUAGES[DEFAULT_LANG];
  
  await bot.sendMessage(chatId, `${t(lang, 'infoTitle')}

📝 ${t(lang, 'praticaLabel')}: <code>${sanitizeForTelegram(session.pratica)}</code>
🌐 ${langInfo.flag} ${langInfo.name}
📅 ${t(lang, 'addedLabel')}: ${new Date(session.createdAt).toLocaleDateString()}`, { parse_mode: 'HTML' });
});

// Health check server for Render/hosting platforms
const PORT = process.env.PORT || 3000;
createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
}).listen(PORT);

console.log(`🤖 Bot started on port ${PORT}`);
