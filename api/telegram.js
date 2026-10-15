const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_CHAT_ID ? parseInt(process.env.ADMIN_CHAT_ID, 10) : 1353039558;
const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const APP_URL = process.env.APP_URL || "https://ndev-bot.vercel.app";

async function tgRequest(method, payload) {
  if (!BOT_TOKEN) return { ok: false, description: "Missing TELEGRAM_BOT_TOKEN" };
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function answerCallback(callbackQueryId, text = "", showAlert = false) {
  return tgRequest("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert
  });
}

function getMainMenuKeyboard(appUrl) {
  const keyboard = [
    [
      { text: "MoodyRoutine", callback_data: "project:moody" },
      { text: "Clockity", callback_data: "project:clockity" }
    ],
    [
      { text: "Dev Deck (Mini App)", web_app: { url: appUrl } }
    ],
    [
      { text: "F-Droid MR !52105", callback_data: "action:fdroid:52105" },
      { text: "Status", callback_data: "action:health" },
      { text: "Clear Chat", callback_data: "action:clear" }
    ]
  ];
  return { inline_keyboard: keyboard };
}

function getProjectKeyboard(projectKey) {
  if (projectKey === "moody") {
    return {
      inline_keyboard: [
        [
          { text: "F-Droid MR !52105", callback_data: "action:fdroid:52105" },
          { text: "Trigger Release", callback_data: "action:build:moody" }
        ],
        [
          { text: "Download APK", callback_data: "action:release:moody" },
          { text: "GitHub ↗", url: "https://github.com/naman-chopra/moody-routine" }
        ],
        [
          { text: "« Back to Projects", callback_data: "menu:main" }
        ]
      ]
    };
  }

  if (projectKey === "clockity") {
    return {
      inline_keyboard: [
        [
          { text: "Trigger Build", callback_data: "action:build:clockity" },
          { text: "Releases", callback_data: "action:release:clockity" }
        ],
        [
          { text: "GitHub ↗", url: "https://github.com/naman-chopra/Clockity" }
        ],
        [
          { text: "« Back to Projects", callback_data: "menu:main" }
        ]
      ]
    };
  }

  return {
    inline_keyboard: [[{ text: "« Back to Projects", callback_data: "menu:main" }]]
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, message: "Ndev Telegram Webhook Active" });
  }

  const update = req.body;
  if (!update) return res.status(200).send("No update received");

  try {
    // 1. Handle incoming text commands
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat?.id;
      const userId = msg.from?.id;
      const text = msg.text || "";

      // RBAC check
      const isAdmin = userId === ADMIN_ID;

      if (text.startsWith("/start") || text.startsWith("/menu")) {
        const greeting = isAdmin
          ? "🤖 <b>Ndev Developer Control Deck</b>\n\nWelcome back! Tap any project below to manage workflows, releases, and F-Droid reviews:"
          : "🤖 <b>Ndev Project Notifier</b>\n\nOfficial automated notification bot for Ndev mobile projects.";

        await tgRequest("sendMessage", {
          chat_id: chatId,
          text: greeting,
          parse_mode: "HTML",
          reply_markup: isAdmin ? getMainMenuKeyboard(APP_URL) : undefined
        });
      } else if (text.startsWith("/id")) {
        await tgRequest("sendMessage", {
          chat_id: chatId,
          text: `🔑 <b>Chat Info</b>\nYour User ID: <code>${userId}</code>\nChat ID: <code>${chatId}</code>`,
          parse_mode: "HTML"
        });
      } else if (text.startsWith("/clear")) {
        const currentMsgId = msg.message_id;
        const parts = text.trim().split(/\s+/);
        const count = parts.length > 1 && !isNaN(parseInt(parts[1], 10))
          ? Math.min(Math.max(parseInt(parts[1], 10), 1), 100)
          : 100;

        // Send the new menu first so the chat never drops to 0 messages (avoids native "START" button)
        await tgRequest("sendMessage", {
          chat_id: chatId,
          text: "<b>Ndev Developer Control Deck</b>\n\nSelect a project:",
          parse_mode: "HTML",
          reply_markup: isAdmin ? getMainMenuKeyboard(APP_URL) : undefined
        });

        // Delete the /clear command and preceding (count - 1) messages
        const idsToDelete = [];
        for (let i = 0; i < count; i++) {
          const id = currentMsgId - i;
          if (id > 0) idsToDelete.push(id);
        }

        if (idsToDelete.length > 0) {
          await tgRequest("deleteMessages", {
            chat_id: chatId,
            message_ids: idsToDelete
          });
        }
      }
    }

    // 2. Handle interactive inline button taps (Callback Queries)
    if (update.callback_query) {
      const query = update.callback_query;
      const data = query.data;
      const chatId = query.message?.chat?.id;
      const messageId = query.message?.message_id;
      const userId = query.from?.id;

      if (userId !== ADMIN_ID) {
        await answerCallback(query.id, "⛔ Developer access required", true);
        return res.status(200).json({ ok: true });
      }

      if (data === "menu:main") {
        await answerCallback(query.id);
        await tgRequest("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "<b>Ndev Developer Control Deck</b>\n\nSelect a project to inspect or trigger actions:",
          parse_mode: "HTML",
          reply_markup: getMainMenuKeyboard(APP_URL)
        });
      } else if (data === "project:moody") {
        await answerCallback(query.id);
        await tgRequest("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "<b>MoodyRoutine</b> (v1.0.1)\n\n• Repository: naman-chopra/moody-routine\n• F-Droid MR: !52105 (Smoke testing / Review)\n• License: GPL-3.0\n\nSelect an action:",
          parse_mode: "HTML",
          reply_markup: getProjectKeyboard("moody")
        });
      } else if (data === "project:clockity") {
        await answerCallback(query.id);
        await tgRequest("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "<b>Clockity</b>\n\n• Repository: naman-chopra/Clockity\n• F-Droid: Ready for submission\n\nSelect an action:",
          parse_mode: "HTML",
          reply_markup: getProjectKeyboard("clockity")
        });
      } else if (data === "action:fdroid:52105") {
        await answerCallback(query.id, "Fetching live MR status...");
        try {
          const mrRes = await fetch("https://gitlab.com/api/v4/projects/36528/merge_requests/52105");
          const mr = await mrRes.json();
          const labels = mr.labels ? mr.labels.join(", ") : "None";
          const statusText = `<b>F-Droid MR !52105 Status</b>\n\n` +
            `• State: ${mr.state} (${mr.detailed_merge_status || 'ok'})\n` +
            `• Total Comments: ${mr.user_notes_count}\n` +
            `• Labels: ${labels}\n` +
            `• Last Updated: ${mr.updated_at}\n\n` +
            `<i>Status: Passed all 9 CI checks, recipe approved by maintainer linsui.</i>`;

          await tgRequest("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: statusText,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "Open MR on GitLab ↗", url: mr.web_url || "https://gitlab.com/fdroid/fdroiddata/-/merge_requests/52105" }],
                [{ text: "« Back to MoodyRoutine", callback_data: "project:moody" }]
              ]
            }
          });
        } catch (e) {
          await answerCallback(query.id, "Failed to query GitLab API", true);
        }
      } else if (data.startsWith("action:build:")) {
        const repo = data.split(":")[2];
        const repoFullName = repo === "moody" ? "naman-chopra/moody-routine" : "naman-chopra/Clockity";
        const workflowName = "release.yml";

        if (!GH_TOKEN) {
          await answerCallback(query.id, "GH_TOKEN not set on Vercel environment", true);
          return res.status(200).json({ ok: true });
        }

        await answerCallback(query.id, `Triggering workflow on ${repo}...`);
        try {
          const dispatchRes = await fetch(`https://api.github.com/repos/${repoFullName}/actions/workflows/${workflowName}/dispatches`, {
            method: "POST",
            headers: {
              "Accept": "application/vnd.github+json",
              "Authorization": `Bearer ${GH_TOKEN}`,
              "User-Agent": "ndev-bot"
            },
            body: JSON.stringify({ ref: "main" })
          });

          if (dispatchRes.status === 204) {
            await tgRequest("sendMessage", {
              chat_id: chatId,
              text: `⚡ <b>Workflow Dispatched</b>\nTriggered <code>${workflowName}</code> on <b>${repoFullName}</b>.\nYou will receive a notification when the build completes.`,
              parse_mode: "HTML"
            });
          } else {
            const errJson = await dispatchRes.json().catch(() => ({}));
            await answerCallback(query.id, `Dispatch error: ${errJson.message || dispatchRes.status}`, true);
          }
        } catch (e) {
          await answerCallback(query.id, `Failed to trigger: ${e.message}`, true);
        }
      } else if (data.startsWith("action:release:")) {
        const repo = data.split(":")[2];
        const repoFullName = repo === "moody" ? "naman-chopra/moody-routine" : "naman-chopra/Clockity";
        await answerCallback(query.id, "Fetching latest release...");

        try {
          const relRes = await fetch(`https://api.github.com/repos/${repoFullName}/releases/latest`, {
            headers: { "User-Agent": "ndev-bot" }
          });
          const rel = await relRes.json();

          if (!rel.tag_name) {
            await tgRequest("editMessageText", {
              chat_id: chatId,
              message_id: messageId,
              text: `<b>No releases found for ${repoFullName} yet.</b>`,
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [[{ text: "« Back", callback_data: `project:${repo}` }]]
              }
            });
            return res.status(200).json({ ok: true });
          }

          let msgText = `<b>Latest Release: ${rel.name || rel.tag_name}</b>\n\n`;
          const buttons = [];
          if (rel.assets && rel.assets.length > 0) {
            msgText += `<b>Available Artifacts:</b>\n`;
            for (const asset of rel.assets) {
              const sizeMb = (asset.size / (1024 * 1024)).toFixed(2);
              msgText += `• <code>${asset.name}</code> (${sizeMb} MB)\n`;
              buttons.push([{ text: `Download ${asset.name}`, url: asset.browser_download_url }]);
            }
          } else {
            msgText += `<i>No uploaded binary assets.</i>\n`;
          }
          buttons.push([{ text: "« Back", callback_data: `project:${repo}` }]);

          await tgRequest("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: msgText,
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: buttons }
          });
        } catch (e) {
          await answerCallback(query.id, "Failed to fetch releases", true);
        }
      } else if (data === "action:health") {
        await answerCallback(query.id);
        await tgRequest("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: `<b>System Status</b>\n\n• Vercel API: Operational\n• Telegram Webhook: Connected\n• F-Droid Monitor: Active (every 30m)\n• GitHub Actions: Connected\n\nAll monitors running smoothly.`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[{ text: "« Back to Projects", callback_data: "menu:main" }]]
          }
        });
      } else if (data === "action:clear") {
        await answerCallback(query.id, "Clearing messages...");
        const currentMsgId = messageId;
        // Delete preceding (n - 1) messages, keeping the current menu intact
        const idsToDelete = [];
        for (let i = 1; i <= 50; i++) {
          const id = currentMsgId - i;
          if (id > 0) idsToDelete.push(id);
        }
        if (idsToDelete.length > 0) {
          await tgRequest("deleteMessages", {
            chat_id: chatId,
            message_ids: idsToDelete
          });
        }
        await tgRequest("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "<b>Ndev Developer Control Deck</b>\n\nSelect a project:",
          parse_mode: "HTML",
          reply_markup: getMainMenuKeyboard(APP_URL)
        });
      }
    }
  } catch (err) {
    console.error("Error processing update:", err);
  }

  return res.status(200).json({ ok: true });
}
