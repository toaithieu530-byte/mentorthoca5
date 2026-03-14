const GEMINI_KEY = 'AIzaSyCpDfmPef-DX7wev8ZGaW4tUquDl2Fz9kg';

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

  const apiKey = process.env.GEMINI_API_KEY?.trim() || GEMINI_KEY;

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
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Aoede' }
              }
            }
          }
        }),
        signal: ctrl.signal,
      }
    );

    if (!r.ok) {
      const e = await r.text();
      res.status(502).json({ error: `Gemini TTS ${r.status}: ${e}` });
      return;
    }

    const json = await r.json();
    const b64 = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mime = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

    if (!b64) {
      res.status(502).json({ error: `Gemini no audio: ${JSON.stringify(json).slice(0, 200)}` });
      return;
    }

    const buf = Buffer.from(b64, 'base64');
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-TTS-Provider', 'gemini-aoede');
    res.status(200).send(buf);

  } catch (e: any) {
    res.status(502).json({ error: e?.name === 'AbortError' ? 'Timeout' : e?.message });
  } finally {
    clearTimeout(t);
  }
}
