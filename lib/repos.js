export async function getSupportedRepos(ghToken) {
  const headers = {
    "User-Agent": "ndev-bot",
    "Accept": "application/vnd.github+json"
  };
  if (ghToken) headers["Authorization"] = `Bearer ${ghToken}`;

  // 1. Fetch repositories from GitHub
  let repos = [];
  try {
    const res = await fetch("https://api.github.com/users/naman-chopra/repos?sort=pushed&per_page=100", { headers });
    if (res.ok) {
      repos = await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch GitHub repos:", err);
  }

  // 2. Fetch F-Droid MRs from GitLab
  let fdroidMRs = [];
  try {
    const mrRes = await fetch("https://gitlab.com/api/v4/projects/36528/merge_requests?author_username=naman-chopra");
    if (mrRes.ok) {
      fdroidMRs = await mrRes.json();
    }
  } catch (err) {
    console.error("Failed to fetch F-Droid MRs:", err);
  }

  // 3. Filter supported repositories
  // Criteria: Not fork, not archived, not the bot itself
  // Supported if: Language is Kotlin or Java, or topics include 'ndev', 'android', 'app'
  const filtered = repos.filter(r => {
    if (r.fork || r.archived || r.name.toLowerCase() === "ndev-bot") return false;
    const lang = (r.language || "").toLowerCase();
    const topics = (r.topics || []).map(t => t.toLowerCase());
    return (
      lang === "kotlin" ||
      lang === "java" ||
      topics.includes("ndev") ||
      topics.includes("android") ||
      topics.includes("app")
    );
  });

  // 4. Attach matching F-Droid MR info if available
  return filtered.map(r => {
    const cleanRepoName = r.name.toLowerCase().replace(/[-_]/g, "");
    const matchingMR = fdroidMRs.find(mr => {
      const titleClean = mr.title.toLowerCase().replace(/[-_]/g, "");
      return titleClean.includes(cleanRepoName);
    });

    return {
      name: r.name,
      fullName: r.full_name,
      description: r.description || "",
      language: r.language || "Unknown",
      htmlUrl: r.html_url,
      defaultBranch: r.default_branch || "main",
      updatedAt: r.pushed_at || r.updated_at,
      fdroidMr: matchingMR ? {
        iid: matchingMR.iid,
        title: matchingMR.title,
        state: matchingMR.state,
        webUrl: matchingMR.web_url,
        notesCount: matchingMR.user_notes_count
      } : null
    };
  });
}
