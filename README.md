# Ndev Dev Deck & Telegram Bot

A serverless Telegram Bot & Mini App (TMA) designed as a personal mobile command deck for Ndev projects (`MoodyRoutine`, `Clockity`, and future apps).

## Features
- **100% Tap-Driven Inline Menus:** Inspect repository health, F-Droid MR review progress, and trigger GitHub Actions without typing commands.
- **Telegram Mini App (TMA):** Touch-friendly mobile dashboard embedded right inside Telegram.
- **Role-Based Access Control (RBAC):** Privileged developer controls restricted exclusively to your Telegram ID.
- **Vercel Serverless:** Auto-deploys on every git push with zero maintenance.

## Environment Variables on Vercel
- `TELEGRAM_BOT_TOKEN`: Your Telegram Bot API token
- `ADMIN_CHAT_ID`: `1353039558`
- `GH_TOKEN`: GitHub Personal Access Token (with `repo` and `workflow` scopes)
- `APP_URL`: The production Vercel URL (e.g., `https://ndev-bot.vercel.app`)

## Webhook Setup
To register your Vercel deployment with Telegram:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<YOUR_VERCEL_DOMAIN>/api/telegram"
```
