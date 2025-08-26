// Vercel Serverless Function
// POST /api/generate-image  { prompt: string, size?: 512|768|1024 }

export default async function handler(req, res) {
  // --- CORS (allow your store) ---
  const ORIGIN = req.headers.origin || '';
  const ALLOW_ORIGIN = [
    'https://YOUR-STORE.myshopify.com',
    'https://yourcustomdomain.com'
  ];
  if (ALLOW_ORIGIN.includes(ORIGIN)) {
    res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt = '', size = 1024 } = req.body || {};
    if (!prompt.trim()) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server missing API key' });
    }

    // Call OpenAI Images (gpt-image-1). Returns base64.
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: `${size}x${size}`,
        response_format: 'b64_json' // easy to send back to browser
      })
    });

    const data = await r.json();
    if (!r.ok) {
      // Common errors: billing/limit (402/429), policy, etc.
      const msg = data?.error?.message || 'Generation failed';
      return res.status(r.status).json({ error: msg });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: 'No image data returned' });

    // Send a data URL (Shopify page can just set <img src=...>)
    return res.status(200).json({ data_url: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error('gen error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
