import { getSupportedRepos } from "../lib/repos.js";

const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

export default async function handler(req, res) {
  try {
    const repos = await getSupportedRepos(GH_TOKEN);
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ ok: true, repos });
  } catch (err) {
    console.error("Error in /api/repos:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch repositories" });
  }
}
