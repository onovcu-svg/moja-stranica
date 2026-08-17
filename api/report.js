// Vercel serverless funkcija: šalje izračun iz kalkulatora na e-mail koji je
// korisnik sam upisao (gumb "Pošalji izvještaj na mail"). Odvojeno od gumba
// "Preuzmi PDF" (window.print), koji ostaje nedirana, čisto klijentska funkcija.
// Env varijable (Vercel → Project Settings → Environment Variables):
//   RESEND_API_KEY       Resend API ključ (resend.com → API Keys)
//   CONTACT_FROM_EMAIL   pošiljatelj, mora biti na verificiranoj domeni u Resendu
// Za newsletter opt-in (samo ako korisnik eksplicitno označi kvačicu) koristi
// iste varijable kao api/subscribe.js:
//   BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_MS_DO_SLANJA = 3000; // isto obrazloženje kao honeypot: brzina odaje bota

// Isti tekst kao "Napomena." u PDF izvještaju (index.html, on-pdf-block) - namjerno
// prepisan doslovno, ne parafraziran, da mail nosi istu ogradu kao ekran i PDF.
const NAPOMENA = 'Izračun je informativan i ne predstavlja financijski, investicijski ni porezni savjet. '
  + 'Ne uključuje naknade banke (obrada kredita, procjena nekretnine, javnobilježnički trošak, police osiguranja) '
  + 'niti efektivnu kamatnu stopu pa je stvarni trošak kredita viši od prikazanog. Stope označene kao pretpostavka '
  + 'nisu objavljeni podaci nego vrijednosti koje si sam unio. Prije potpisa usporedi izračun s ponudom banke i s '
  + 'otplatnim planom koji ti banka izdaje.';

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

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function clean(v, maxLen) {
  return String(v == null ? '' : v).trim().slice(0, maxLen);
}

// Niz { l, v } parova (rezultati ili parametri) - ocisti, ogranici broj redaka
// i duljinu svakog polja, odbaci redke bez labele.
function cleanRows(arr, maxItems, maxLen) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, maxItems)
    .map((r) => ({ l: clean(r && r.l, maxLen), v: clean(r && r.v, maxLen) }))
    .filter((r) => r.l);
}

function rowsToHtml(rows) {
  return rows.map((r) => `<tr><td style="padding:4px 12px 4px 0;color:#71717A;white-space:nowrap;vertical-align:top">${escapeHtml(r.l)}</td><td style="padding:4px 0;white-space:pre-wrap">${escapeHtml(r.v)}</td></tr>`).join('');
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
  if (clean(body.hp, 200)) {
    res.status(200).json({ ok: true });
    return;
  }
  const t0 = Number(body.t0);
  if (Number.isFinite(t0) && Date.now() - t0 < MIN_MS_DO_SLANJA) {
    res.status(200).json({ ok: true });
    return;
  }

  const email = clean(body.email, 254).toLowerCase();
  const naslov = clean(body.naslov, 200);
  const sazetak = clean(body.sazetak, 2000);
  if (!EMAIL_RE.test(email) || !naslov || !sazetak) {
    res.status(400).json({ error: 'invalid_fields' });
    return;
  }
  const rataLabel = clean(body.rataLabel, 100);
  const rata = clean(body.rata, 100);
  const male = cleanRows(body.male, 20, 200);
  const rez = cleanRows(body.rez, 20, 200);
  const param = cleanRows(body.param, 40, 200);
  // Privola za newsletter mora biti eksplicitna: iskljucivo strogo true, nikad
  // truthy vrijednost, nikad podrazumijevana ako polje izostane.
  const newsletter = body.newsletter === true;

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    res.status(500).json({ error: 'not_configured' });
    return;
  }

  const zaprimljeno = new Date().toLocaleString('hr-HR', { timeZone: 'Europe/Zagreb', dateStyle: 'medium', timeStyle: 'medium' });
  const headlineHtml = rataLabel && rata
    ? `<div style="margin:16px 0;padding:14px 16px;background:#FEF2F2;border:1px solid #DC2626;border-radius:10px">`
      + `<div style="font-size:12px;color:#71717A">${escapeHtml(rataLabel)}</div>`
      + `<div style="font-size:22px;font-weight:700;color:#DC2626">${escapeHtml(rata)}</div></div>`
    : '';
  const rezultatiHtml = (male.length || rez.length)
    ? `<table style="font-family:sans-serif;font-size:14px;color:#09090B;margin-bottom:18px">${rowsToHtml(male)}${rowsToHtml(rez)}</table>`
    : '';
  const paramHtml = param.length
    ? `<div style="font-weight:600;font-size:12px;letter-spacing:.04em;color:#71717A;margin-bottom:6px">UNESENI PARAMETRI</div>`
      + `<table style="font-family:sans-serif;font-size:13px;color:#09090B;margin-bottom:18px">${rowsToHtml(param)}</table>`
    : '';
  const html = `<div style="font-family:sans-serif;color:#09090B;max-width:560px">`
    + `<h2 style="margin:0 0 8px">${escapeHtml(naslov)}</h2>`
    + `<p style="font-size:14px;line-height:1.6;color:#3F3F46;margin:0 0 4px">${escapeHtml(sazetak)}</p>`
    + headlineHtml
    + rezultatiHtml
    + paramHtml
    + `<div style="padding:12px 14px;background:#F4F4F5;border-radius:8px;font-size:11.5px;line-height:1.55;color:#52525B;margin-bottom:16px">`
    + `<strong style="color:#09090B">Napomena.</strong> ${escapeHtml(NAPOMENA)}</div>`
    + `<div style="font-size:11px;color:#A1A1AA">Izrađeno na onovcu.hr · ${escapeHtml(zaprimljeno)}</div>`
    + `</div>`;

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `[Izvještaj] ${naslov}`,
        html,
      }),
    });

    if (!resendRes.ok) {
      // Namjerno bez tijela odgovora u logu - moglo bi sadržavati echo korisnickog unosa.
      console.error('report handler: resend error', resendRes.status);
      res.status(502).json({ error: 'resend_error' });
      return;
    }
  } catch (err) {
    console.error('report handler error', err instanceof Error ? err.name : 'unknown');
    res.status(500).json({ error: 'server_error' });
    return;
  }

  // Newsletter je najbolje-moguci dodatak nakon uspjesno poslanog izvjestaja:
  // ne rusi odgovor korisniku ako beehiiv nije konfiguriran ili padne.
  if (newsletter) {
    const beehiivKey = process.env.BEEHIIV_API_KEY;
    const pubId = process.env.BEEHIIV_PUBLICATION_ID;
    if (beehiivKey && pubId) {
      try {
        const beehiivRes = await fetch(`https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${beehiivKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            reactivate_existing: false,
            send_welcome_email: true,
            utm_source: 'onovcu.hr',
            utm_medium: 'web',
            utm_campaign: 'izvjestaj-kalkulator',
            referring_site: 'https://onovcu.hr',
          }),
        });
        if (!beehiivRes.ok && beehiivRes.status !== 409) {
          console.error('report handler: beehiiv error', beehiivRes.status);
        }
      } catch (err) {
        console.error('report handler: beehiiv error', err instanceof Error ? err.name : 'unknown');
      }
    } else {
      console.error('report handler: beehiiv not_configured');
    }
  }

  res.status(200).json({ ok: true });
};
