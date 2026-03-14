const { activeSessions } = require("./start-session");

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
  const { sessionToken } = req.body;
  if (!sessionToken || !activeSessions.has(sessionToken)) {
    return res.status(400).json({ error: "Invalid session." });
  }
  const session = activeSessions.get(sessionToken);
  session.flagReached = true;
  return res.status(200).json({ success: true });
};
