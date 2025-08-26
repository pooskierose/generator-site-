// /api/generate-image.js
export default async function handler(req, res) {
  // CORS – allow calls from Shopify
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { prompt, size } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const imageSize = typeof size === "string" ? size : "1024x1024";
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY not set" });

    // Call OpenAI Images API (Stable names at time of writing)
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: imageSize,        // "1024x1024", "512x512", etc.
        response_format: "url"  // easiest for browsers
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({
        error: data?.error?.message || "OpenAI error",
        details: data
      });
    }

    const url = data?.data?.[0]?.url;
    if (!url) return res.status(500).json({ error: "No image URL in response", details: data });

    return res.status(200).json({ ok: true, url });
  } catch (err) {
    return res.status(500).json({ error: "Server exception", message: err?.message });
  }
}
