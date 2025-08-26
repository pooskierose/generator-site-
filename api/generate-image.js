// /api/generate-image.js
import OpenAI from "openai";

export default async function handler(req, res) {
  // CORS for Shopify storefront
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, size } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const px = Number(size) || 1024;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: `${px}x${px}`,
      // Force base64 so we can always return a displayable data URL
      response_format: "b64_json",
    });

    const b64 = result?.data?.[0]?.b64_json;
    if (!b64) {
      return res.status(502).json({ error: "No image data from OpenAI" });
    }

    const dataUrl = `data:image/png;base64,${b64}`;

    // The front-end looks for one of: image / url / images[0].url / b64_json
    // We'll return `image` to make it unambiguous.
    return res.status(200).json({ image: dataUrl });
  } catch (err) {
    console.error("generate-image error:", err);
    return res
      .status(500)
      .json({ error: err?.response?.data || err?.message || "Server error" });
  }
}
