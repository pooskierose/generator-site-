// /api/generate-image.js
export default async function handler(req, res) {
  // --- CORS (Shopify needs this) ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const { prompt, size = "1024x1024" } = req.body || {};
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    // OpenAI Images API (gpt-image-1)
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size, // must be "256x256" | "512x512" | "1024x1024"
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      // Bubble up OpenAI error message
      return res.status(r.status).json({ error: data.error?.message || "OpenAI error" });
    }

    const url = data?.data?.[0]?.url;
    if (!url) return res.status(500).json({ error: "No image URL returned" });

    // Keep response shape simple for the Shopify script
    return res.status(200).json({ imageUrl: url });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}
