import Redis from 'ioredis';
import { DEFAULT_LANG } from './i18n.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SESSIONS_KEY = 'permesso:sessions';

let redis = null;

function getRedis() {
  if (!redis) {
    redis = new Redis(REDIS_URL);
  }
  return redis;
}

export async function saveSession(chatId, pratica, lang = DEFAULT_LANG) {
  const existing = await getSession(chatId);
  const session = {
    pratica,
    lang: lang || existing?.lang || DEFAULT_LANG,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await getRedis().hset(SESSIONS_KEY, chatId.toString(), JSON.stringify(session));
}

export async function updateSessionLang(chatId, lang) {
  const existing = await getSession(chatId);
  if (existing) {
    existing.lang = lang;
    existing.updatedAt = new Date().toISOString();
    await getRedis().hset(SESSIONS_KEY, chatId.toString(), JSON.stringify(existing));
  } else {
    const session = {
      pratica: null,
      lang,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await getRedis().hset(SESSIONS_KEY, chatId.toString(), JSON.stringify(session));
  }
}

export async function updateUserInfo(chatId, from) {
  const existing = await getSession(chatId);
  const userInfo = {
    firstName: from?.first_name || null,
    lastName: from?.last_name || null,
    username: from?.username || null,
    languageCode: from?.language_code || null,
  };
  if (existing) {
    existing.user = userInfo;
    existing.updatedAt = new Date().toISOString();
    await getRedis().hset(SESSIONS_KEY, chatId.toString(), JSON.stringify(existing));
  } else {
    const session = {
      pratica: null,
      lang: DEFAULT_LANG,
      user: userInfo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await getRedis().hset(SESSIONS_KEY, chatId.toString(), JSON.stringify(session));
  }
}

export async function removeSession(chatId) {
  await getRedis().hdel(SESSIONS_KEY, chatId.toString());
}

export async function getSession(chatId) {
  const data = await getRedis().hget(SESSIONS_KEY, chatId.toString());
  return data ? JSON.parse(data) : null;
}

export async function getUserLang(chatId) {
  const session = await getSession(chatId);
  return session?.lang || DEFAULT_LANG;
}

export async function getAllSessions() {
  const data = await getRedis().hgetall(SESSIONS_KEY);
  const sessions = {};
  for (const [chatId, value] of Object.entries(data)) {
    const session = JSON.parse(value);
    // Only include sessions with pratica
    if (session.pratica) {
      sessions[chatId] = session;
    }
  }
  return sessions;
}

const LAST_STATUS_KEY = 'permesso:last_status';

export async function getLastStatus(chatId) {
  const data = await getRedis().hget(LAST_STATUS_KEY, chatId.toString());
  return data || null;
}

export async function saveLastStatus(chatId, statusDescription) {
  await getRedis().hset(LAST_STATUS_KEY, chatId.toString(), statusDescription);
}

export async function removeLastStatus(chatId) {
  await getRedis().hdel(LAST_STATUS_KEY, chatId.toString());
}

export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
