# Permesso Tracker Telegram Bot

A Telegram bot that tracks Italian residence permit (permesso di soggiorno) status for multiple users and sends daily updates.

## Features

- 👥 Multi-user support - each user can track their own pratica
- 🔄 Daily notifications at 9:00 AM Rome time via GitHub Actions
- 🤖 Telegram bot commands for self-registration
- 💾 Redis storage for sessions
- 🌐 Multi-language support (🇬🇧 English, 🇮🇹 Italiano, 🇺🇦 Українська)

## Bot Commands

- `/start` - Welcome message
- `/add 26FR000001` - Add your pratica to track
- `/remove` - Stop tracking
- `/status` - Check current status
- `/info` - Show your tracked pratica
- `/lang` - Change language

## Setup

### 1. Create a Telegram Bot

1. Message `@BotFather` on Telegram
2. Send `/newbot` and follow instructions
3. Copy the bot token


Copy your Redis URL (e.g., `redis://default:password@host:port`)

### 2. Add GitHub Secrets

Repository → **Settings** → **Secrets and variables** → **Actions**

Add:
- `TELEGRAM_BOT_TOKEN` - Your bot token
- `REDIS_URL` - Your Redis connection URL

### 3. Run the Bot

```bash
yarn install
```

Create `.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token
REDIS_URL=redis://localhost:6379
```

Start the bot:
```bash
yarn bot
```

Users can now message your bot and register with `/add PRATICA_NUMBER`.

## Scripts

- `yarnbot` - Start the Telegram bot
- `yarn notify` - Send notifications to all registered users
- `yarn check` - Check a single pratica (uses PRATICA_NUMBER env var)

## Architecture

```
User → Telegram Bot → Redis (stores sessions)
                         ↑
GitHub Actions (cron) → notify.js → sends updates
```
