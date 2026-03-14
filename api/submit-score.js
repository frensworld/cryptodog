const { createClient } = require("@supabase/supabase-js");
const { activeSessions } = require("./start-session");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const MAX_SCORE = 45000;
const MIN_SCORE = 500;
const MIN_COINS = 3;
const MIN_PLAY_SECONDS = 60;

const rateLimits = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { count: 1, start: now });
    return true;
  }
  const limit = rateLimits.get(ip);
  if (now - limit.start > windowMs) {
    rateLimits.set(ip, { count: 1, start: now });
    return true;
  }
  limit.count++;
  if (limit.count > 5) return false;
  return true;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const origin = req.headers.origin || "";
  const allowedOrigins = [
    "https://thecryptodog.lol",
    "https://www.thecryptodog.lol",
    "http://localhost",
  ];
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Too many requests." });
  }
  const { playerName, score, coins, sessionToken } = req.body;
  if (!sessionToken || !activeSessions.has(sessionToken)) {
    return res.status(400).json({ error: "Invalid session." });
  }
  const session = activeSessions.get(sessionToken);
  if (!session.flagReached) {
    return res.status(400).json({ error: "Flag not reached." });
  }
  const serverPlayTime = (Date.now() - session.startTime) / 1000;
  if (serverPlayTime < MIN_PLAY_SECONDS) {
    return res.status(400).json({ error: "Game too short." });
  }
  if (typeof score !== "number" || score < MIN_SCORE || score > MAX_SCORE) {
    return res.status(400).json({ error: "Score out of valid range." });
  }
  if (typeof coins !== "number" || coins < MIN_COINS) {
    return res.status(400).json({ error: "Not enough coins." });
  }
  const maxPlausible = (coins * 100) + 10000;
  if (score > maxPlausible) {
    return res.status(400).json({ error: "Score not plausible." });
  }
  const safeName = String(playerName || "ANON")
    .replace(/[^a-zA-Z0-9_ \-\.]/g, "")
    .substring(0, 16)
    .trim() || "ANON";
  activeSessions.delete(sessionToken);
  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: existing } = await db
      .from("leaderboard")
      .select("score")
      .eq("player_name", safeName)
      .single();
    if (existing && existing.score >= Math.round(score)) {
      return res.status(200).json({ message: "Existing score is higher." });
    }
    const { error } = await db
      .from("leaderboard")
      .upsert(
        [{ player_name: safeName, score: Math.round(score) }],
        { onConflict: "player_name" }
      );
    if (error) throw error;
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error("Supabase error:", e);
    return res.status(500).json({ error: "Database error." });
  }
};
