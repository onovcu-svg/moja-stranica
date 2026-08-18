// Vercel serverless funkcija: čuva beehiiv API ključ na serveru, nikad u pregledniku.
// Env varijable (Vercel → Project Settings → Environment Variables):
//   BEEHIIV_API_KEY          Bearer token (beehiiv → Settings → Integrations → API)
//   BEEHIIV_PUBLICATION_ID   (beehiiv → Settings → Integrations → API)

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_MS_DO_SLANJA = 3000; // isto obrazloženje kao honeypot: brzina odaje bota

// Vrlo jednostavan in-memory rate limit po IP-u (5 zahtjeva / 10 min).
// Na serverless-u se memorija ne dijeli između instanci/hladnih startova,
// pa ovo suzbija samo grublji spam; za jaču zaštitu koristiti Vercel KV/Upstash.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  // Timestamp se dodaje SAMO kad zahtjev prolazi - inace i odbijeni zahtjev
  // pomice klizni prozor naprijed i drzi korisnika u blokadi.
  if (arr.length > 5) { hits.set(ip, arr); return true; }
  arr.push(now);
  hits.set(ip, arr);
  return false;
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
  body = body || {};

  // Honeypot ("hp") i vremenska provjera ("t0" = ms kad je forma prikazana):
  // pravi korisnik ne popunjava skriveno polje niti pošalje formu brže od
  // MIN_MS_DO_SLANJA. Oboje tiho odbijamo kao uspjeh, bez traga botu.
  if (String(body.hp || '').trim()) {
    res.status(200).json({ ok: true });
    return;
  }
  // t0 dolazi s korisnikovog uredaja - klijentski sat mu moze ici naprijed.
  // Ako je u buducnosti (negativna razlika bi ispala "prebrzo") ili nerealno
  // star (vise od 24h - sigurno nije normalno trajanje ispunjavanja forme),
  // ne moze se protumaciti kao pouzdana "prebrzo poslano" provjera. Tad je
  // NE primjenjujemo - bolje propustiti bota (honeypot i rate limit i dalje
  // stite) nego tiho odbiti pravog korisnika ciji sat krivo ide.
  const now = Date.now();
  const t0 = Number(body.t0);
  const t0Vjerodostojan = Number.isFinite(t0) && t0 <= now && now - t0 < 24 * 60 * 60 * 1000;
  if (t0Vjerodostojan && now - t0 < MIN_MS_DO_SLANJA) {
    res.status(200).json({ ok: true });
    return;
  }

  const email = String((body && body.email) || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'invalid_email' });
    return;
  }
  // Privola mora biti eksplicitna: iskljucivo strogo true, nikad podrazumijevana
  // i nikad izvedena iz drugog polja. Bez nje nema server-side zapisa da je
  // korisnik pristao (index.html je do sad ovo provjeravao SAMO na klijentu).
  if (body.privola !== true) {
    res.status(400).json({ error: 'missing_consent' });
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
