// /api/generate-image.js

export default async function handler(req, res) {
  // --- CORS (permissive while you finish setup) ---
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin); // temp: echo origin
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Use POST' });
  }

  try {
    const { prompt = '', size = 1024 } = req.body || {};
    if (!prompt.trim()) {
      return res.status(400).json({ ok: false, message: 'Missing prompt' });
    }

    const n = Number(size) || 1024;
    const clamped = [256, 512, 768, 1024].includes(n) ? n : 1024;
    const sizeStr = `${clamped}x${clamped}`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, message: 'OPENAI_API_KEY is not set' });
    }

    // Use OpenAI Images API (no response_format param)
    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1', // or 'dall-e-3' if that’s what your account supports
        prompt,
        size: sizeStr,
      }),
    });

    const data = await resp.json();

    // Bubble up OpenAI error text (429 quota, 401 key, etc)
    if (!resp.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        `OpenAI error (${resp.status})`;
      return res.status(resp.status).json({ ok: false, message: msg });
    }

    const item = (data && (data.data?.[0] || data.images?.[0])) || {};
    const directUrl = item.url;
    const b64 = item.b64_json;

    if (directUrl) return res.status(200).json({ ok: true, url: directUrl });
    if (b64) return res.status(200).json({ ok: true, url: `data:image/png;base64,${b64}` });

    return res.status(502).json({ ok: false, message: 'No image returned from OpenAI' });
  } catch (err) {
    console.error('generate-image error:', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
}
