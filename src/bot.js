import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { saveSession, removeSession, getSession, getUserLang, updateSessionLang } from './sessions.js';
import { fetchPermessoStatus, sanitizeForTelegram } from './permesso-checker.js';
import { t, LANGUAGES, getApiLang, DEFAULT_LANG } from './i18n.js';

console.log('🚀 Starting bot...');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const REDIS_URL = process.env.REDIS_URL;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

if (!REDIS_URL) {
  console.error('❌ REDIS_URL is required');
  process.exit(1);
}

console.log('✅ Environment variables OK');

let bot;
try {
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
  console.log('✅ Telegram bot initialized');
} catch (error) {
  console.error('❌ Failed to initialize Telegram bot:', error.message);
  process.exit(1);
}

// Bot command definitions
const COMMAND_KEYS = ['start', 'add', 'status', 'info', 'remove', 'lang', 'donate'];
const CMD_TRANSLATION_KEYS = {
  start: 'cmdStart',
  add: 'cmdAdd',
  status: 'cmdStatus',
  info: 'cmdInfo',
  remove: 'cmdRemove',
  lang: 'cmdLang',
  donate: 'cmdDonate',
};

// Set commands for a specific chat in a given language
async function setCommandsForChat(chatId, lang) {
  const commands = COMMAND_KEYS.map((cmd) => ({
    command: cmd,
    description: t(lang, CMD_TRANSLATION_KEYS[cmd]),
  }));
  await bot.setMyCommands(commands, {
    scope: { type: 'chat', chat_id: chatId },
  });
}

// Set default commands (English) on startup
bot.setMyCommands(
  COMMAND_KEYS.map((cmd) => ({ command: cmd, description: t('en', CMD_TRANSLATION_KEYS[cmd]) }))
).then(() => {
  console.log('✅ Default bot commands menu set');
}).catch((err) => {
  console.error('⚠️ Failed to set bot commands:', err.message);
});

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const session = await getSession(chatId);
  
  // Auto-detect language from Telegram on first start
  let lang;
  if (!session) {
    const tgLang = msg.from?.language_code?.split('-')[0]; // e.g. "en", "it", "uk"
    lang = LANGUAGES[tgLang] ? tgLang : DEFAULT_LANG;
    await updateSessionLang(chatId, lang);
  } else {
    lang = session.lang || DEFAULT_LANG;
  }
  
  await setCommandsForChat(chatId, lang);
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
  
  if (data.startsWith('donate:')) {
    const amount = parseInt(data.split(':')[1]);
    const lang = await getUserLang(chatId);
    
    await bot.answerCallbackQuery(query.id);
    await bot.sendInvoice(chatId, t(lang, 'donateTitle'), t(lang, 'donateDescription'), `donate_${chatId}_${Date.now()}`, '', 'XTR', [
      { label: 'Donation', amount },
    ]);
    return;
  }
  
  if (data.startsWith('lang:')) {
    const newLang = data.split(':')[1];
    
    if (LANGUAGES[newLang]) {
      await updateSessionLang(chatId, newLang);
      await setCommandsForChat(chatId, newLang);
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

// /donate command
bot.onText(/\/donate/, async (msg) => {
  const chatId = msg.chat.id;
  const lang = await getUserLang(chatId);
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: `⭐ ${t(lang, 'donateBtn1')}`, callback_data: 'donate:1' },
        { text: `⭐ ${t(lang, 'donateBtn5')}`, callback_data: 'donate:5' },
        { text: `⭐ ${t(lang, 'donateBtn10')}`, callback_data: 'donate:10' },
      ],
    ],
  };
  
  await bot.sendMessage(chatId, t(lang, 'donateMessage'), {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// Handle pre-checkout query (must be answered quickly)
bot.on('pre_checkout_query', async (query) => {
  await bot.answerPreCheckoutQuery(query.id, true);
});

// Handle successful payment
bot.on('message', async (msg) => {
  if (msg.successful_payment) {
    const chatId = msg.chat.id;
    const lang = await getUserLang(chatId);
    await bot.sendMessage(chatId, t(lang, 'donateSuccess'), { parse_mode: 'HTML' });
  }
});

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error.message);
});

console.log('🤖 Bot started! Listening for commands...');
