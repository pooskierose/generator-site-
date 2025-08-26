// /api/generate-image.js
const ALLOWED_ORIGIN = "*"; // change to your domain later for stricter CORS

const SIZE_MAP = {
  square: "1024x1024",
  portrait: "896x1152",
  landscape: "1152x896",
};

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Use POST" });
    return;
  }

  try {
    const { prompt, aspect } = req.body || {};
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      res.status(400).json({ ok: false, error: "Missing or too-short prompt." });
      return;
    }

    const size = SIZE_MAP[(aspect || "square").toLowerCase()] || SIZE_MAP.square;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ ok: false, error: "OPENAI_API_KEY is not set on the server." });
      return;
    }

    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: prompt.trim(),
        size,
        response_format: "b64_json",
      }),
    });

    if (!r.ok) {
      let detail = "";
      try { const j = await r.json(); detail = j?.error?.message || JSON.stringify(j); } catch {}
      res.status(r.status).json({ ok: false, error: `OpenAI error (${r.status}): ${detail}` });
      return;
    }

    const data = await r.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) { res.status(502).json({ ok: false, error: "No image returned." }); return; }

    res.status(200).json({ ok: true, size, contentType: "image/png", b64 });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ ok: false, error: "Server error. Please try again." });
  }
}