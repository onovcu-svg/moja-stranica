// Vercel serverless funkcija: prima kontakt i B2B/edukacija obrazac i šalje
// mail preko Resenda. API ključ nikad ne ide u preglednik.
// Env varijable (Vercel → Project Settings → Environment Variables):
//   RESEND_API_KEY       Resend API ključ (resend.com → API Keys)
//   CONTACT_TO_EMAIL     adresa na koju stižu upiti (npr. kontakt@onovcu.hr)
//   CONTACT_FROM_EMAIL   pošiljatelj, mora biti na verificiranoj domeni u Resendu
//   CONTACT_BCC_EMAIL    opcionalno - rezervni primatelj (BCC) na kontakt/edukacija mailove.
//                        Ako nije postavljena, mail ide bez BCC-a - ništa se ne blokira.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_MS_DO_SLANJA = 3000; // isto obrazloženje kao honeypot: brzina odaje bota

const TEMA_LABEL = { suradnja: 'Suradnja', radionica: 'Radionica', sponzorstvo: 'Sponzorstvo', pitanje: 'Pitanje' };
const FORMAT_LABEL = { zivo: 'Uživo', online: 'Online', hibrid: 'Hibridno' };

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

// Skrati i obreži prazne rubove; sprječava da jedno polje nosi megabajte teksta.
function clean(v, maxLen) {
  return String(v == null ? '' : v).trim().slice(0, maxLen);
}

function poljaZaKontakt(body) {
  const ime = clean(body.ime, 200);
  const email = clean(body.email, 254).toLowerCase();
  const poruka = clean(body.poruka, 5000);
  const temaRaw = clean(body.tema, 40);
  const tema = TEMA_LABEL[temaRaw] || 'Suradnja';
  if (!ime || !poruka || !EMAIL_RE.test(email)) return null;
  return {
    email,
    subject: `[Kontakt] ${ime} — ${tema}`,
    redci: [
      ['Ime', ime],
      ['E-mail', email],
      ['Tema', tema],
      ['Poruka', poruka],
    ],
  };
}

function poljaZaEdukaciju(body) {
  const tvrtka = clean(body.tvrtka, 200);
  const osoba = clean(body.osoba, 200);
  const email = clean(body.email, 254).toLowerCase();
  const velicinaRaw = clean(body.velicina, 40);
  const velicina = ['1-20', '21-100', '101-500', '500+'].includes(velicinaRaw) ? velicinaRaw : '';
  const formatRaw = clean(body.format, 40);
  const format = FORMAT_LABEL[formatRaw] || '';
  const poruka = clean(body.poruka, 5000);
  if (!tvrtka || !osoba || !EMAIL_RE.test(email)) return null;
  return {
    email,
    subject: `[Edukacija] ${tvrtka}`,
    redci: [
      ['Tvrtka', tvrtka],
      ['Kontakt osoba', osoba],
      ['E-mail', email],
      ['Broj zaposlenika', velicina || '—'],
      ['Format', format || '—'],
      ['Poruka', poruka || '—'],
    ],
  };
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

  const tip = body.tip === 'edukacija' ? 'edukacija' : (body.tip === 'kontakt' ? 'kontakt' : null);
  if (!tip) {
    res.status(400).json({ error: 'invalid_type' });
    return;
  }

  const polja = tip === 'edukacija' ? poljaZaEdukaciju(body) : poljaZaKontakt(body);
  if (!polja) {
    res.status(400).json({ error: 'invalid_fields' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !toEmail || !fromEmail) {
    res.status(500).json({ error: 'not_configured' });
    return;
  }
  // Opcionalni rezervni primatelj - odsutnost varijable ne smije rusiti slanje.
  const bccEmail = String(process.env.CONTACT_BCC_EMAIL || '').trim();

  const zaprimljeno = new Date().toLocaleString('hr-HR', { timeZone: 'Europe/Zagreb', dateStyle: 'medium', timeStyle: 'medium' });
  const redciHtml = polja.redci
    .map(([labela, vrijednost]) => `<tr><td style="padding:4px 12px 4px 0;color:#71717A;white-space:nowrap;vertical-align:top">${escapeHtml(labela)}</td><td style="padding:4px 0;white-space:pre-wrap">${escapeHtml(vrijednost)}</td></tr>`)
    .join('');
  const html = `<table style="font-family:sans-serif;font-size:14px;color:#09090B">${redciHtml}<tr><td style="padding:4px 12px 4px 0;color:#71717A;white-space:nowrap;vertical-align:top">Zaprimljeno</td><td style="padding:4px 0">${escapeHtml(zaprimljeno)}</td></tr></table>`;

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        ...(bccEmail ? { bcc: [bccEmail] } : {}),
        reply_to: [polja.email],
        subject: polja.subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      // Namjerno bez tijela odgovora u logu - moglo bi sadržavati echo korisnickog unosa.
      console.error('contact handler: resend error', resendRes.status);
      res.status(502).json({ error: 'resend_error' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact handler error', err instanceof Error ? err.name : 'unknown');
    res.status(500).json({ error: 'server_error' });
  }
};
