const crypto = require("crypto");

const activeSessions = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now - session.startTime > 30 * 60 * 1000) {
      activeSessions.delete(token);
    }
  }
}, 10 * 60 * 1000);

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
  const token = crypto.randomBytes(32).toString("hex");
  activeSessions.set(token, {
    startTime: Date.now(),
    flagReached: false,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
  });
  return res.status(200).json({ token });
};

module.exports.activeSessions = activeSessions;
