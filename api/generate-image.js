// /api/generate-image.js
export default async function handler(req, res) {
  // CORS + preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not set" });
    }

    const { prompt, size = "1024x1024" } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing 'prompt' string" });
    }

    // Call OpenAI Images (gpt-image-1)
    const r = await fetch("https://api.openai.com/v1/images", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size,
        // return base64 data
        response_format: "b64_json"
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      // bubble up OpenAI error message when possible
      return res.status(500).json({ error: data?.error?.message || "OpenAI error" });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return res.status(500).json({ error: "No image returned" });
    }

    // Send base64 image back to the browser
    return res.status(200).json({ ok: true, image_b64: b64 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}