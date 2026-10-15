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

  loadProjects();
});

function triggerHaptic(type = "medium") {
  const tg = window.Telegram?.WebApp;
  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred(type);
  }
}

async function loadProjects() {
  const container = document.getElementById("projects-container");
  if (!container) return;

  try {
    const res = await fetch("/api/repos");
    const data = await res.json();

    if (!data.ok || !data.repos || data.repos.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; color: var(--hint-color); padding: 24px;">
          No supported Android projects found.
        </div>`;
      return;
    }

    container.innerHTML = data.repos.map(repo => {
      const hasFdroid = !!repo.fdroidMr;
      const fdroidMeta = hasFdroid ? `
        <div class="meta-row">
          <span class="meta-label">F-Droid MR:</span>
          <a href="${repo.fdroidMr.webUrl || '#'}" target="_blank" class="meta-link">!${repo.fdroidMr.iid} (${repo.fdroidMr.state})</a>
        </div>
        <div class="meta-row">
          <span class="meta-label">Comments:</span>
          <span class="meta-value text-blue">${repo.fdroidMr.notesCount || 0} discussion notes</span>
        </div>
      ` : `
        <div class="meta-row">
          <span class="meta-label">F-Droid:</span>
          <span class="meta-value text-muted">Ready for recipe</span>
        </div>
      `;

      const fdroidButton = hasFdroid ? `
        <button class="btn btn-secondary" onclick="checkFdroidMR(${repo.fdroidMr.iid})">
          <span>Check MR !${repo.fdroidMr.iid}</span>
        </button>
      ` : '';

      return `
        <div class="card project-card">
          <div class="card-header">
            <div class="project-title">
              <div>
                <h3>${repo.name}</h3>
                <span class="version-tag">${repo.language} • ${repo.defaultBranch}</span>
              </div>
            </div>
            <span class="badge ${hasFdroid ? 'badge-success' : 'badge-neutral'}">${hasFdroid ? 'F-Droid Tracked' : 'Ready'}</span>
          </div>

          <div class="project-meta">
            <div class="meta-row">
              <span class="meta-label">Repository:</span>
              <span class="meta-value">${repo.fullName}</span>
            </div>
            ${repo.description ? `
            <div class="meta-row">
              <span class="meta-label">About:</span>
              <span class="meta-value" style="font-size: 12px; max-width: 65%; text-align: right;">${escapeHtml(repo.description)}</span>
            </div>` : ''}
            ${fdroidMeta}
          </div>

          <div class="button-group">
            ${fdroidButton}
            <a href="${repo.htmlUrl}/releases/latest" target="_blank" class="btn btn-primary" onclick="triggerHaptic('light')">
              <span>Download APK</span>
            </a>
            <a href="${repo.htmlUrl}" target="_blank" class="btn btn-secondary" onclick="triggerHaptic('light')">
              <span>Repository ↗</span>
            </a>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error("Error loading projects:", err);
    container.innerHTML = `
      <div class="card" style="text-align: center; color: var(--hint-color); padding: 24px;">
        Failed to load projects. Tap to retry.
      </div>`;
    container.onclick = loadProjects;
  }
}

async function checkFdroidMR(mrIid) {
  triggerHaptic("medium");
  const tg = window.Telegram?.WebApp;

  try {
    const res = await fetch(`https://gitlab.com/api/v4/projects/36528/merge_requests/${mrIid}`);
    const mr = await res.json();

    const info = `F-Droid MR !${mr.iid} Status:\n\n• Title: ${mr.title}\n• State: ${mr.state} (${mr.detailed_merge_status || 'ok'})\n• Comments: ${mr.user_notes_count}\n• Labels: ${mr.labels?.join(", ") || 'None'}\n\nReview Status: Recipe approved by maintainer linsui.`;

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

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}
