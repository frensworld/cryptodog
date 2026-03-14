const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async function handler(req, res) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const token = crypto.randomBytes(32).toString("hex");
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  await db.from("sessions").insert([{
    token,
    start_time: Date.now(),
    flag_reached: false,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown",
  }]);
  return res.status(200).json({ token });
};
