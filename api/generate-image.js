// /api/generate-image.js
import OpenAI from "openai";

function setCors(req, res) {
  const origin = req.headers.origin || "";
  const allowlist = [
    "https://elleandeastluxe.com",
    "https://www.elleandeastluxe.com",
    "https://elleandeastluxe.myshopify.com",
  ];
  // Echo back an allowed origin (better than "*", works with stricter setups)
  res.setHeader(
    "Access-Control-Allow-Origin",
    allowlist.includes(origin) ? origin : allowlist[0]
  );
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt, size } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const px = Number(size) || 1024;

    const out = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: `${px}x${px}`,
      response_format: "b64_json", // always give us displayable data
    });

    const b64 = out?.data?.[0]?.b64_json;
    if (!b64) return res.status(502).json({ error: "No image data from OpenAI" });

    // Always return one clear field the UI can read
    res.status(200).json({ image: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error("generate-image error:", err?.response?.data || err?.message || err);
    res.status(500).json({ error: err?.response?.data || err?.message || "Server error" });
  }
}
