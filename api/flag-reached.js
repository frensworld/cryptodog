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
  const { sessionToken } = req.body;
  if (!sessionToken) {
    return res.status(400).json({ error: "Missing session token." });
  }
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data, error } = await db
    .from("sessions")
    .update({ flag_reached: true })
    .eq("token", sessionToken)
    .select()
    .single();
  if (error || !data) {
    return res.status(400).json({ error: "Invalid session." });
  }
  return res.status(200).json({ success: true });
};
