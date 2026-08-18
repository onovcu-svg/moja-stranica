// Vercel serverless funkcija: šalje izračun iz kalkulatora na e-mail koji je
// korisnik sam upisao (gumb "Pošalji izvještaj na mail"). Odvojeno od gumba
// "Preuzmi PDF" (window.print), koji ostaje nedirana, čisto klijentska funkcija.
// Env varijable (Vercel → Project Settings → Environment Variables):
//   RESEND_API_KEY       Resend API ključ (resend.com → API Keys)
//   CONTACT_FROM_EMAIL   pošiljatelj, mora biti na verificiranoj domeni u Resendu
// Za newsletter opt-in (samo ako korisnik eksplicitno označi kvačicu) koristi
// iste varijable kao api/subscribe.js:
//   BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID
//
// SADRŽAJ MAILA JE ZATVOREN NA POZNATE OBLIKE (vidi AUDIT-2026-08-18.md, F).
// naslov i kalkulator idu isključivo preko whitelisti ispod - moraju se ručno
// dopuniti OVDJE ako se doda ili promijeni grana u buildPdf (index.html).
// Nema dijeljenog modula između klijenta i servera (nema build koraka), pa je
// ovo namjerno ručno održavana kopija - vidi NASLOVI_DOZVOLJENI niže.
// Svaka labela i vrijednost (rataLabel/rata/male/rez/param) mora odgovarati
// jednom od zatvorenih oblika ispod; slobodan tekst se nikad ne šalje u mail.
// sazetak (proza) se NE prima i NE koristi - ne može se whitelistati.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_MS_DO_SLANJA = 3000; // isto obrazloženje kao honeypot: brzina odaje bota

// Isti tekst kao "Napomena." u PDF izvještaju (index.html, on-pdf-block) - namjerno
// prepisan doslovno, ne parafraziran, da mail nosi istu ogradu kao ekran i PDF.
const NAPOMENA = 'Izračun je informativan i ne predstavlja financijski, investicijski ni porezni savjet. '
  + 'Ne uključuje naknade banke (obrada kredita, procjena nekretnine, javnobilježnički trošak, police osiguranja) '
  + 'niti efektivnu kamatnu stopu pa je stvarni trošak kredita viši od prikazanog. Stope označene kao pretpostavka '
  + 'nisu objavljeni podaci nego vrijednosti koje si sam unio. Prije potpisa usporedi izračun s ponudom banke i s '
  + 'otplatnim planom koji ti banka izdaje.';

// Deset mogućih naslova izvještaja, doslovno prepisano iz buildPdf grana u
// index.html (7055-7434: placa/refi/opcije/zatvoriti/rast/cilj/renta/
// inflacija/povijest) i pdfKredit objekta (8574). Ako se u buildPdf doda ili
// preimenuje grana, ovaj popis treba ručno ažurirati.
const NASLOVI_DOZVOLJENI = new Set([
  'Obračun plaće',
  'Refinanciranje kredita',
  'Kraći ili duži rok otplate',
  'Zatvoriti kredit ili ne',
  'Rezultat ulaganja',
  'Koliko trebam ulagati za cilj',
  'Koliko dugo traje ušteđevina',
  'Koliko će novac izgubiti',
  'Koliko je novac već izgubio',
  'Izračun kredita',
]);

// Identifikator kalkulatora koji šalje posaljiIzvjestaj() (index.html:6904).
// Prije ovog popravka server ovo polje uopće nije čitao.
const KALKULATORI_DOZVOLJENI = new Set([
  'placa', 'kredit', 'refi', 'opcije', 'zatvoriti', 'inflacija', 'povijest',
  'kamata-rast', 'kamata-cilj', 'kamata-renta',
]);

// Zatvoreni oblici za SVAKU vrijednost (rata i svaki v u male/rez/param).
const RE_EUR = /^-?\d{1,3}(\.\d{3})*,\d{2} €$/;
const RE_POSTOTAK = /^-?\d+(,\d+)? %( \(pretpostavka\))?$/;
const RE_TRAJANJE_1 = /^\d+ g\. \d{1,2} mj\.$/;
const RE_TRAJANJE_2 = /^\d+ god\. \(\d+ mjeseci\)$/;
const RE_DATUM = /^\d{2}\.\d{2}\.\d{4}\.$/;
const RE_BROJ_RIJEC = /^\d+([.,]\d+)? \p{L}+$/u;
const RE_KOMBO = /^[^()]{1,30} \(\d+(,\d+)? %\)$/;
// Raspon dvaju iznosa, npr. "180 € → 220 €" (eur(x,0), bez decimala) ili
// "180,00 € → 220,00 €" (eur(x,2)) - "Raspon rate, prva → zadnja"
// (index.html:8482), samo kad je model otplate kredita "Rate" (kTip==='rate'),
// ne default "Anuiteti". Decimalni dio je opcionalan na OBJE strane neovisno,
// da pokrije i sadašnju preciznost (0) i eventualnu buduću promjenu na 2.
const RE_RASPON = /^-?\d{1,3}(\.\d{3})*(,\d{2})? € → -?\d{1,3}(\.\d{3})*(,\d{2})? €$/;
// "Kratka oznaka": pokriva vrijednosti poput "Fiksna kroz cijeli rok" i
// "Kombinirana: fiksna pa varijabilna". Namjerno bez €, %, / - to pokrivaju
// obrasci iznad. Strelica je dopuštena i ovdje (isti razlog kao RE_LABELA
// niže) iako je danas nijedna VRIJEDNOST izvan RE_RASPON ne koristi.
const RE_OZNAKA = /^[\p{L}\d ,.:→-]{1,60}$/u;

// Nekoliko poznatih, fiksnih rečenica u buildPdf-u ne odgovara nijednom
// obrascu iznad (npr. sadrže € usred proze, ne kao samostalan iznos) - ali
// su i dalje literal stringovi iz izvornog koda, ne slobodan tekst. Umjesto
// širenja znakovnog skupa (RE_OZNAKA), ovakve se dodaju ovdje TOČNIM
// stringom, isti mehanizam kao NASLOVI_DOZVOLJENI/KALKULATORI_DOZVOLJENI.
const VRIJEDNOSTI_DOZVOLJENE = new Set([
  'Da, do 1.200 €', // index.html:7091, "Neoporezivi dio bonusa" (smjer==='bonus')
]);

// Labele (l u male/rez/param, i rataLabel) su malo šire od "kratke oznake":
// nekoliko stvarnih labela u buildPdf-u ugrađuje postotak, zagradu ili
// strelicu u SAM TEKST labele, npr. "Doprinos I. stup, 15 %" (index.html:7101),
// "Zdravstveno osiguranje, 16,5 %" (7104), "Osobni odbitak (koeficijent 1,0)"
// (7102), "Preostali dug (glavnica)" (7243), "Prva (najveća) rata" (8576,
// samo kad kTip==='rate'), "Raspon rate, prva → zadnja" (8482, isto samo
// kTip==='rate'). Otkriveno testiranjem uživo (kalkulator plaće u modelu
// "Bonus" i kalkulator kredita u modelu "Rate" su s izvornim, užim obrascem
// vraćali 400 na potpuno legitiman izvještaj).
const RE_LABELA = /^[\p{L}\d ,.:()%→-]{1,60}$/u;

// Eksplicitna zabrana i kad bi znakovi sami po sebi prošli gornje obrasce
// (npr. "http" je samo slova, pa bi inače prošao RE_OZNAKA/RE_BROJ_RIJEC).
const ZABRANJENO_RE = /http|@|<|>|\r|\n/i;

function sadrziZabranjeno(s) {
  return ZABRANJENO_RE.test(s);
}

function isValidnaVrijednost(v) {
  if (typeof v !== 'string' || !v) return false;
  if (VRIJEDNOSTI_DOZVOLJENE.has(v)) return true;
  if (sadrziZabranjeno(v)) return false;
  return RE_EUR.test(v) || RE_POSTOTAK.test(v) || RE_TRAJANJE_1.test(v) || RE_TRAJANJE_2.test(v)
    || RE_DATUM.test(v) || RE_BROJ_RIJEC.test(v) || RE_KOMBO.test(v) || RE_RASPON.test(v) || RE_OZNAKA.test(v);
}

function isValidnaLabela(l) {
  return typeof l === 'string' && l.length > 0 && !sadrziZabranjeno(l) && RE_LABELA.test(l);
}

// Niz { l, v } parova (rezultati ili parametri): mora biti niz, unutar
// dopuštene duljine, i SVAKI redak mora imati valjanu labelu i vrijednost.
// Jedan loš redak odbija CIJELI zahtjev - nema tihog odbacivanja pojedinih
// redaka (za razliku od stare cleanRows(), koja je tiho skratila i propustila
// dalje ono što je preživjelo).
function isValidanNiz(arr, maxItems) {
  if (!Array.isArray(arr) || arr.length > maxItems) return false;
  return arr.every((r) => r && isValidnaLabela(r.l) && isValidnaVrijednost(r.v));
}

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function clean(v, maxLen) {
  return String(v == null ? '' : v).trim().slice(0, maxLen);
}

function rowsToHtml(rows) {
  return rows.map((r) => `<tr><td style="padding:4px 12px 4px 0;color:#71717A;white-space:nowrap;vertical-align:top">${escapeHtml(r.l)}</td><td style="padding:4px 0;white-space:pre-wrap">${escapeHtml(r.v)}</td></tr>`).join('');
}

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
  const kalkulator = clean(body.kalkulator, 40);
  const naslov = clean(body.naslov, 60);
  // sazetak se namjerno NE čita iz body-ja - proza se ne može whitelistati,
  // pa se u mail nikad ne prenosi (vidi komentar na vrhu datoteke).
  if (!EMAIL_RE.test(email) || !KALKULATORI_DOZVOLJENI.has(kalkulator) || !NASLOVI_DOZVOLJENI.has(naslov)) {
    res.status(400).json({ error: 'invalid_fields' });
    return;
  }

  const rataLabel = typeof body.rataLabel === 'string' ? body.rataLabel : '';
  const rata = typeof body.rata === 'string' ? body.rata : '';
  if ((rataLabel && !isValidnaLabela(rataLabel)) || (rata && !isValidnaVrijednost(rata))) {
    res.status(400).json({ error: 'invalid_fields' });
    return;
  }
  if (!isValidanNiz(body.male, 5) || !isValidanNiz(body.rez, 30) || !isValidanNiz(body.param, 40)) {
    res.status(400).json({ error: 'invalid_fields' });
    return;
  }
  const male = body.male;
  const rez = body.rez;
  const param = body.param;

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
  // Bez sažetka (proza) - naslov + rezultati + parametri su dovoljni, i svi
  // dolaze iz zatvorenih oblika provjerenih gore.
  const html = `<div style="font-family:sans-serif;color:#09090B;max-width:560px">`
    + `<h2 style="margin:0 0 8px">${escapeHtml(naslov)}</h2>`
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
