/**
 * api/tts.ts — FPT AI TTS (giọng linhsan)
 * Env: FPT_TTS_API_KEY (Vercel environment variable)
 */

export const config = { api: { bodyParser: false } };

const readBody = (req: any): Promise<string> =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.FPT_TTS_API_KEY?.trim();
  if (!apiKey) {
    res.status(503).json({ error: 'FPT_TTS_API_KEY chưa được cấu hình trên Vercel' });
    return;
  }

  let text = '';
  try {
    const raw = await readBody(req);
    try {
      const parsed = JSON.parse(raw);
      text = (parsed?.text || '').trim();
    } catch {
      text = raw.trim();
    }
  } catch (e) {
    res.status(400).json({ error: 'Không đọc được body' });
    return;
  }

  if (!text) {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const fptRes = await fetch('https://api.fpt.ai/hmi/tts/v5', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'voice': 'linhsan',
        'speed': '',
      },
      body: text,
      signal: controller.signal,
    });

    if (!fptRes.ok) {
      const err = await fptRes.text();
      res.status(502).json({ error: `FPT lỗi (${fptRes.status}): ${err}` });
      return;
    }

    const json = await fptRes.json();
    const audioUrl: string | undefined = json?.async;

    if (!audioUrl) {
      res.status(502).json({ error: `FPT không trả về URL: ${JSON.stringify(json)}` });
      return;
    }

    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? 1200 : 1500));
      try {
        const r = await fetch(audioUrl, { signal: controller.signal });
        if (r.ok) {
          const buf = await r.arrayBuffer();
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('X-TTS-Provider', 'fpt-linhsan');
          res.status(200).send(Buffer.from(buf));
          return;
        }
      } catch { /* retry */ }
    }

    res.status(502).json({ error: 'FPT: hết retry vẫn chưa có audio' });

  } catch (err: any) {
    const msg = err?.name === 'AbortError' ? 'Timeout 30s' : (err?.message || String(err));
    res.status(502).json({ error: `FPT exception: ${msg}` });
  } finally {
    clearTimeout(timeout);
  }
}
