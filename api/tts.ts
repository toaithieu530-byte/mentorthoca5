/**
 * api/tts.ts — FPT AI TTS (giọng linhsan, vi-VN)
 * Env: FPT_TTS_API_KEY (set on Vercel)
 * Fallback: Web Speech API xử lý ở client, không cần fallback server
 */

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  const apiKey = process.env.FPT_TTS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'FPT_TTS_API_KEY not configured' });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('FPT TTS timeout'), 30000);

  try {
    // Bước 1: Gọi FPT API → nhận JSON có trường "async" (URL mp3)
    const fptRes = await fetch('https://api.fpt.ai/hmi/tts/v5', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'speed': '-0.5',
        'voice': 'linhsan',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: text,
      signal: controller.signal,
    });

    if (!fptRes.ok) {
      const err = await fptRes.text();
      res.status(502).json({ error: `FPT TTS error (${fptRes.status}): ${err}` });
      return;
    }

    const json = await fptRes.json();
    const audioUrl: string | undefined = json?.async;

    if (!audioUrl) {
      res.status(502).json({ error: `FPT TTS: no audio URL in response: ${JSON.stringify(json)}` });
      return;
    }

    // Bước 2: Fetch MP3 từ URL async của FPT (có thể cần retry vì xử lý bất đồng bộ)
    let audioRes: Response | null = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      await new Promise(r => setTimeout(r, attempt === 0 ? 800 : 1200));
      try {
        audioRes = await fetch(audioUrl, { signal: controller.signal });
        if (audioRes.ok) break;
      } catch { /* retry */ }
      audioRes = null;
    }

    if (!audioRes || !audioRes.ok) {
      res.status(502).json({ error: 'FPT TTS: could not fetch async audio after retries' });
      return;
    }

    const buffer = await audioRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-TTS-Provider', 'fpt-ai');
    res.status(200).send(Buffer.from(buffer));
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      res.status(504).json({ error: 'FPT TTS request timed out' });
    } else {
      res.status(502).json({ error: error?.message || String(error) });
    }
  } finally {
    clearTimeout(timeout);
  }
}
