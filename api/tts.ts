const FPT_KEY = 'IUUGMkDMX7cMAjfNnISBAJ64pkLP7q70';

export const config = { api: { bodyParser: false } };

const readBody = (req: any): Promise<string> =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c: Buffer) => { data += c.toString(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const apiKey = process.env.FPT_TTS_API_KEY?.trim() || FPT_KEY;

  let text = '';
  try {
    const raw = await readBody(req);
    try { text = (JSON.parse(raw)?.text || '').trim(); }
    catch { text = raw.trim(); }
  } catch { res.status(400).json({ error: 'Cannot read body' }); return; }

  if (!text) { res.status(400).json({ error: 'text is required' }); return; }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);

  try {
    const fptRes = await fetch('https://api.fpt.ai/hmi/tts/v5', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'voice': 'linhsan',
        'speed': '-2',
      },
      body: text,
      signal: ctrl.signal,
    });

    if (!fptRes.ok) {
      const e = await fptRes.text();
      res.status(502).json({ error: `FPT ${fptRes.status}: ${e}` });
      return;
    }

    const json = await fptRes.json();
    const audioUrl: string | undefined = json?.async;
    if (!audioUrl) { res.status(502).json({ error: `No URL: ${JSON.stringify(json)}` }); return; }

    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? 1200 : 1500));
      try {
        const r = await fetch(audioUrl, { signal: ctrl.signal });
        if (r.ok) {
          const buf = await r.arrayBuffer();
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'no-store');
          res.status(200).send(Buffer.from(buf));
          return;
        }
      } catch { /* retry */ }
    }
    res.status(502).json({ error: 'FPT: no audio after retries' });

  } catch (e: any) {
    res.status(502).json({ error: e?.name === 'AbortError' ? 'Timeout' : e?.message });
  } finally {
    clearTimeout(t);
  }
}
