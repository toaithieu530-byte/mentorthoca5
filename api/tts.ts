/**
 * api/tts.ts — FPT AI TTS (giọng linhsan)
 * Frontend gửi JSON: { text: "..." }
 * Server chuyển tiếp raw text sang FPT API
 * Env: FPT_TTS_API_KEY
 */
 
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
 
  // Đọc text từ JSON body (frontend gửi { text: "..." })
  const text: string | undefined = req.body?.text;
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'text is required' });
    return;
  }
 
  const apiKey = process.env.FPT_TTS_API_KEY?.trim();
  if (!apiKey) {
    res.status(503).json({ error: 'FPT_TTS_API_KEY not configured on Vercel' });
    return;
  }
 
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
 
  try {
    // Gọi FPT — body là raw text, giống curl -d "text content"
    const fptRes = await fetch('https://api.fpt.ai/hmi/tts/v5', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'voice': 'linhsan',
        'speed': '',        // để trống = tốc độ bình thường
      },
      body: text.trim(),    // raw text, không encode
      signal: controller.signal,
    });
 
    if (!fptRes.ok) {
      const err = await fptRes.text();
      console.error('FPT error:', fptRes.status, err);
      res.status(502).json({ error: `FPT TTS lỗi (${fptRes.status}): ${err}` });
      return;
    }
 
    const json = await fptRes.json();
    console.log('FPT response:', JSON.stringify(json));
 
    // FPT trả về { error: 0, async: "https://..." }
    const audioUrl: string | undefined = json?.async;
    if (!audioUrl) {
      res.status(502).json({ error: `FPT không trả về URL audio: ${JSON.stringify(json)}` });
      return;
    }
 
    // Polling: FPT xử lý bất đồng bộ, cần thử nhiều lần
    let audioRes: Response | null = null;
    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? 1000 : 1500));
      try {
        const r = await fetch(audioUrl, { signal: controller.signal });
        if (r.ok && r.headers.get('content-type')?.includes('audio')) {
          audioRes = r;
          break;
        }
      } catch { /* retry */ }
    }
 
    if (!audioRes) {
      res.status(502).json({ error: 'FPT: không lấy được file audio sau khi retry' });
      return;
    }
 
    const buffer = await audioRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-TTS-Provider', 'fpt-linhsan');
    res.status(200).send(Buffer.from(buffer));
 
  } catch (err: any) {
    const msg = err?.name === 'AbortError' ? 'Timeout' : (err?.message || String(err));
    res.status(502).json({ error: `FPT TTS exception: ${msg}` });
  } finally {
    clearTimeout(timeout);
  }
}
