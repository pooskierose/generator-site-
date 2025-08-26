// /api/generate-image.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ALLOW_ORIGIN = new Set([
  "https://elleandeastluxe.com",         // your custom Shopify domain
  "https://elleandeastluxe.myshopify.com" // Shopify myshopify.com fallback
]);

function cors(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOW_ORIGIN.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt = "", size = 1024 } = req.body || {};
    const n = Number(size) || 1024;
    const clampedSize = [256, 512, 768, 1024].includes(n) ? n : 1024;

    if (!prompt.trim()) return res.status(400).json({ error: "Missing prompt" });

    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: `${clampedSize}x${clampedSize}`
    });

    const url = result?.data?.[0]?.url;
    if (!url) return res.status(502).json({ error: "No image URL returned" });

    return res.status(200).json({ image_url: url });
  } catch (err) {
    console.error("Image generation failed:", err);
    const msg =
      err?.response?.data?.error?.message ||
      err?.message ||
      "Generation failed";
    return res.status(500).json({ error: msg });
  }
}
