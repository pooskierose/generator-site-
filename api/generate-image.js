// /api/generate-image.js
export default async function handler(req, res) {
  try {
    // Handle preflight CORS requests
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      return res.status(204).end();
    }

    // Allow your Shopify site to access
    res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");

    // Only accept POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Use POST" });
    }

    // Get prompt + size from request body
    const { prompt, size = "1024x1024" } = JSON.parse(req.body || "{}");
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    // Call OpenAI Images API
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-image-1",   // this is the image model
        prompt,
        size,                   // ex: "1024x1024" or "1024x1792"
        response_format: "b64_json"
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json(data);
    }

    // Pull the base64 image
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return res.status(500).json({ error: "No image returned" });
    }

    // Send back image to the browser
    return res.status(200).json({ imageBase64: b64 });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
