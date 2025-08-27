// /api/generate-image.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// allow only your domains
const ALLOWED_ORIGINS = [
  "https://elleandeastluxe.com",
  "https://elleandeastluxe.myshopify.com"
];

function setCors(res, origin) {
  const okOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader("Access-Control-Allow-Origin", okOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res, req.headers.origin || "");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Use POST" });
  }

  try {
    const { prompt, size = "1024x1024" } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ ok: false, message: "Missing prompt" });
    }

    // only allow these sizes
    const allowed = ["1024x1024", "1024x1536", "1536x1024", "auto"];
    if (!allowed.includes(size)) {
      return res.status(400).json({
        ok: false,
        message: `Invalid value: '${size}'. Supported values are: '1024x1024', '1024x1536', '1536x1024', and 'auto'.`
      });
    }

    const finalSize = size === "auto" ? "1024x1024" : size;

    const resp = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: finalSize
    });

    const b64 = resp?.data?.[0]?.b64_json;
    if (!b64) {
      return res.status(502).json({ ok: false, message: "No image returned from model" });
    }

    // return as data URL so the Shopify page can display immediately
    return res.status(200).json({ ok: true, url: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error(err);
    const msg = err?.response?.data?.error?.message || err?.message || "Server error";
    return res.status(500).json({ ok: false, message: msg });
  }
}
