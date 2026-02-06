import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { saveSession, removeSession, getSession } from './sessions.js';
import { fetchPermessoStatus } from './permesso-checker.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, `👋 Welcome to Permesso Tracker Bot!

I can track your Italian residence permit status and notify you daily at 9:00 AM Rome time.

<b>Commands:</b>
/add <code>PRATICA_NUMBER</code> - Add your pratica to track
/remove - Stop tracking
/status - Check current status
/info - Show your tracked pratica

<b>Example:</b>
/add 26RO00001`, { parse_mode: 'HTML' });
});

// /add command
bot.onText(/\/add(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const pratica = match[1]?.trim();
  
  if (!pratica) {
    await bot.sendMessage(chatId, `❌ Please provide your pratica number.

<b>Example:</b> /add 26RO00001`, { parse_mode: 'HTML' });
    return;
  }
  
  // Validate by trying to fetch
  await bot.sendMessage(chatId, '🔍 Validating pratica number...');
  
  try {
    const status = await fetchPermessoStatus(pratica);
    
    if (!status) {
      await bot.sendMessage(chatId, '❌ Could not validate pratica. Please check the number.');
      return;
    }
    
    // Save session
    await saveSession(chatId, pratica);
    
    await bot.sendMessage(chatId, `✅ Pratica <code>${pratica}</code> added!

You will receive daily updates at 9:00 AM Rome time.

Current status:
${status.description}`, { parse_mode: 'HTML' });
    
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
});

// /remove command
bot.onText(/\/remove/, async (msg) => {
  const chatId = msg.chat.id;
  
  const session = await getSession(chatId);
  
  if (!session) {
    await bot.sendMessage(chatId, '❌ You have no pratica being tracked.');
    return;
  }
  
  await removeSession(chatId);
  await bot.sendMessage(chatId, '✅ Tracking removed. Use /add to track a new pratica.');
});

// /status command
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  
  const session = await getSession(chatId);
  
  if (!session) {
    await bot.sendMessage(chatId, '❌ No pratica tracked. Use /add <pratica> first.');
    return;
  }
  
  await bot.sendMessage(chatId, '🔍 Checking status...');
  
  try {
    const status = await fetchPermessoStatus(session.pratica);
    
    if (!status) {
      await bot.sendMessage(chatId, '❌ Could not fetch status.');
      return;
    }
    
    await bot.sendMessage(chatId, `📋 <b>Permesso di Soggiorno</b>

📝 Pratica: <code>${status.praticaNumber}</code>
📅 ${status.pubDate}

${status.description}`, { parse_mode: 'HTML' });
    
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
});

// /info command
bot.onText(/\/info/, async (msg) => {
  const chatId = msg.chat.id;
  
  const session = await getSession(chatId);
  
  if (!session) {
    await bot.sendMessage(chatId, '❌ No pratica tracked. Use /add <pratica> first.');
    return;
  }
  
  await bot.sendMessage(chatId, `📋 <b>Your Tracker</b>

📝 Pratica: <code>${session.pratica}</code>
📅 Added: ${new Date(session.createdAt).toLocaleDateString()}`, { parse_mode: 'HTML' });
});

console.log('🤖 Bot started! Listening for commands...');
