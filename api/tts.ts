const XI_KEY   = 'deaa774bedb654e1a9adf6ef823335b3ec9cf705b20934e601e4dd8906e1632c';
const VOICE_ID = '5vqV9IG7sDpzgzKOIZAv';

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
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY || XI_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
          voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
        }),
        signal: ctrl.signal,
      }
    );

    if (!r.ok) {
      const e = await r.text();
      res.status(502).json({ error: `ElevenLabs ${r.status}: ${e}` });
      return;
    }

    const buf = await r.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(Buffer.from(buf));

  } catch (e: any) {
    res.status(502).json({ error: e?.name === 'AbortError' ? 'Timeout' : e?.message });
  } finally {
    clearTimeout(t);
  }
}
