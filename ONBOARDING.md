# Onboarding a Repository to Ndev Bot & Dev Deck

This guide explains how to connect any new or existing repository to **@Ndev_git_notifier_bot** and the **Ndev Dev Deck** mobile dashboard.

---

## 1. Automatic Discovery (How the Bot Finds Your Repo)

The bot dynamically queries your GitHub account. A repository is automatically onboarded if it meets **either** of these criteria:

* **Language:** Its primary language is **Kotlin** or **Java** (standard Android apps).
* **Topic Tag:** Or the repository has one of these GitHub topics attached:
  * `ndev`
  * `android`
  * `app`

> **To add a topic via CLI:**
> ```bash
> gh repo edit <owner>/<repo> --add-topic ndev --add-topic android
> ```

---

## 2. Configure GitHub Secrets

For your repository's GitHub Actions workflows to send alerts to your Telegram chat, add the credentials as repository secrets:

```bash
# Inside your repository directory:
gh secret set TELEGRAM_BOT_TOKEN -b"<YOUR_BOT_TOKEN>"
gh secret set TELEGRAM_CHAT_ID -b"<YOUR_CHAT_ID>"
```

---

## 3. Add Notifications to Your Workflows

Use the reusable composite action to send formatted notifications with zero dependencies:

### Example: Release Publication Notification
```yaml
- name: Send Telegram Notification
  if: success() && secrets.TELEGRAM_BOT_TOKEN != ''
  uses: naman-chopra/moody-routine/.github/actions/telegram-notify@main
  with:
    bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
    project: 'Clockity'
    status: 'release' # options: success | failure | warning | release | mr | info
    title: 'Release Published'
    message: 'New APK compiled, signed, and published to GitHub.'
    url: 'https://github.com/${{ github.repository }}/releases/latest'
    url-text: 'Download APK ↗'
```

### Example: CI Failure Alert
```yaml
- name: Notify on Failure
  if: failure() && secrets.TELEGRAM_BOT_TOKEN != ''
  uses: naman-chopra/moody-routine/.github/actions/telegram-notify@main
  with:
    bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
    project: 'Clockity'
    status: 'failure'
    title: 'Build Failed'
    message: 'CI workflow encountered an error on branch ${{ github.ref_name }}.'
```

---

## 4. Enable Remote Build Triggers from Telegram

To allow the bot to trigger builds when you tap **Trigger Build** in Telegram:

Ensure your workflow file (e.g. `.github/workflows/release.yml`) includes `workflow_dispatch`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch: # <-- Enables remote triggering from Telegram Bot

jobs:
  build:
    ...
```

---

## 5. Automatic F-Droid Merge Request Tracking

When you submit your application to F-Droid (`fdroid/fdroiddata`):

1. Submit the MR from your GitLab account (`@naman-chopra`).
2. Include the application or repository name in the title:
   - Example: `New app: Clockity` or `New app: MoodyRoutine`
3. The bot automatically discovers the MR, binds it to your repository card, and tracks review comments and merge status in real time.

---

## 6. Verification

1. Open [@Ndev_git_notifier_bot](https://t.me/Ndev_git_notifier_bot) in Telegram.
2. Tap `/start` or the **Dev Deck** button in the bottom-left corner.
3. Your new repository and its live release status will appear automatically.
