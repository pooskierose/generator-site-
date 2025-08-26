// GET /api/ping -> { ok: true }  (lets you confirm the project is live)
export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({ ok: true, time: new Date().toISOString() });
}
