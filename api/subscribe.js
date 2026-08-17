// Vercel serverless funkcija: čuva beehiiv API ključ na serveru, nikad u pregledniku.
// Env varijable (Vercel → Project Settings → Environment Variables):
//   BEEHIIV_API_KEY          Bearer token (beehiiv → Settings → Integrations → API)
//   BEEHIIV_PUBLICATION_ID   pub_996e8b39-bb16-4b32-85c3-816edf3b2b8a

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Vrlo jednostavan in-memory rate limit po IP-u (5 zahtjeva / 10 min).
// Na serverless-u se memorija ne dijeli između instanci/hladnih startova,
// pa ovo suzbija samo grublji spam; za jaču zaštitu koristiti Vercel KV/Upstash.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    res.status(429).json({ error: 'too_many_requests' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const email = String((body && body.email) || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'invalid_email' });
    return;
  }

  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!apiKey || !pubId) {
    res.status(500).json({ error: 'not_configured' });
    return;
  }

  try {
    const beehiivRes = await fetch(`https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        // Double opt-in ide iz postavki beehiiv publikacije; ovaj flag samo
        // traži da beehiiv (ako opt-in nije obavezan) posalje pozdravni mail.
        send_welcome_email: true,
        utm_source: 'onovcu.hr',
        utm_medium: 'web',
        utm_campaign: 'newsletter-traka',
        referring_site: 'https://onovcu.hr',
      }),
    });

    // beehiiv vraća postojecu pretplatu za duplikat adrese - to nije greska.
    if (!beehiivRes.ok && beehiivRes.status !== 409) {
      const detail = await beehiivRes.text().catch(() => '');
      console.error('beehiiv error', beehiivRes.status, detail);
      res.status(502).json({ error: 'beehiiv_error' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('subscribe handler error', err);
    res.status(500).json({ error: 'server_error' });
  }
};
