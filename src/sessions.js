import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SESSIONS_KEY = 'permesso:sessions';

let redis = null;

function getRedis() {
  if (!redis) {
    redis = new Redis(REDIS_URL);
  }
  return redis;
}

export async function saveSession(chatId, pratica) {
  const session = {
    pratica,
    createdAt: new Date().toISOString(),
  };
  await getRedis().hset(SESSIONS_KEY, chatId.toString(), JSON.stringify(session));
}

export async function removeSession(chatId) {
  await getRedis().hdel(SESSIONS_KEY, chatId.toString());
}

export async function getSession(chatId) {
  const data = await getRedis().hget(SESSIONS_KEY, chatId.toString());
  return data ? JSON.parse(data) : null;
}

export async function getAllSessions() {
  const data = await getRedis().hgetall(SESSIONS_KEY);
  const sessions = {};
  for (const [chatId, value] of Object.entries(data)) {
    sessions[chatId] = JSON.parse(value);
  }
  return sessions;
}

export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
