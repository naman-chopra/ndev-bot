document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.ready();
    tg.expand();

    // Display user first name / handle if available
    const user = tg.initDataUnsafe?.user;
    if (user) {
      const greetingEl = document.getElementById("user-greeting");
      if (greetingEl) {
        greetingEl.textContent = `Welcome, @${user.username || user.first_name}`;
      }
    }
  }
});

function triggerHaptic() {
  const tg = window.Telegram?.WebApp;
  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred("medium");
  }
}

async function checkFdroidMR() {
  triggerHaptic();
  const tg = window.Telegram?.WebApp;

  try {
    const res = await fetch("https://gitlab.com/api/v4/projects/36528/merge_requests/52105");
    const mr = await res.json();

    const info = `F-Droid MR !52105 Status:\n\n• State: ${mr.state} (${mr.detailed_merge_status})\n• Comments: ${mr.user_notes_count}\n• Labels: ${mr.labels?.join(", ")}\n\nMaintainer linsui approved the recipe and queued it for on-device smoke test.`;

    if (tg && tg.showAlert) {
      tg.showAlert(info);
    } else {
      alert(info);
    }
  } catch (err) {
    const errorMsg = "Could not reach GitLab API. Please try again.";
    if (tg && tg.showAlert) {
      tg.showAlert(errorMsg);
    } else {
      alert(errorMsg);
    }
  }
}
