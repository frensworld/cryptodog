const { activeSessions } = require("./start-session");

function setCORS(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async function handler(req, res) {
  setCORS(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { sessionToken } = req.body;
  if (!sessionToken || !activeSessions.has(sessionToken)) {
    return res.status(400).json({ error: "Invalid session." });
  }
  const session = activeSessions.get(sessionToken);
  session.flagReached = true;
  return res.status(200).json({ success: true });
};
