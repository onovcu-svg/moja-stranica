#!/usr/bin/env node
// Provjerava da su ruta->meta tablice u index.html (getMeta(), izvor istine
// za klijent i Google) i middleware.js (rucni mirror za social-share
// crawlere bez JS-a) usklađene. Vidi NOTES.md §3 "Nova ruta ili blog članak
// - tri mjesta, jedna provjera".
//
// NAMJERNO JEDNOSTAVNO: čisti regex + traženje granica preko poznatih
// 'const NAZIV = ' oznaka, BEZ generičkog JS parsera/eval-a. Ako se ikad
// promijeni redoslijed ili oblik tih deklaracija u index.html ili
// middleware.js, ovaj skript će vjerojatno prestati ispravno izvlačiti
// podatke - zato svaka izvučena tablica ima provjeru "nađeno je barem N
// unosa, inače odustani glasno" umjesto da tiho prijavi "sve usklađeno" na
// praznom skupu.
//
// Pokretanje: node scripts/check-meta-sync.js
// Exit 0 = usklađeno. Exit 1 = razilaženje MEĐU TABLICAMA ili greška u
// samom skriptu (npr. promijenjen format pa ništa nije izvučeno) - oba
// slučaja blokiraju Vercelov buildCommand jednako, namjerno. Vidi NOTES.md
// §3 za postupak ako skripta LAŽNO blokira deploy.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const middlewareJs = fs.readFileSync(path.join(ROOT, 'middleware.js'), 'utf8');
const sitemapXml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');

function odustani(poruka) {
  console.error('GRESKA U SKRIPTI (ne stvarno razilazenje - provjeri format): ' + poruka);
  process.exit(1);
}

// ── Pomoćne funkcije za izvlačenje ──────────────────────────────────────

// Tekst između dvije oznake (isključivo početak, isključivo kraj).
function isjecak(text, odOznake, doOznake, naziv) {
  const i = text.indexOf(odOznake);
  if (i === -1) odustani(`ne mogu naci '${odOznake}' (${naziv})`);
  const start = i + odOznake.length;
  const j = text.indexOf(doOznake, start);
  if (j === -1) odustani(`ne mogu naci kraj '${doOznake}' nakon '${odOznake}' (${naziv})`);
  return text.slice(start, j);
}

// kljuc: { title: '...' (+ SUFIKS)?, desc: '...' }  ->  Map(kljuc -> {title, desc})
// kljuc moze biti gol identifikator (hub:) ili citiran (npr. 'neki-slug':).
function izvuciUgnijezdeno(blok, sufiks) {
  const re = /'?([\w-]+)'?:\s*\{\s*title:\s*'((?:\\.|[^'\\])*)'(\s*\+\s*SUFIKS)?\s*,\s*desc:\s*'((?:\\.|[^'\\])*)'\s*\}/g;
  const m = new Map();
  let match;
  while ((match = re.exec(blok))) {
    const [, kljuc, title, plusSufiks, desc] = match;
    m.set(kljuc, { title: title + (plusSufiks ? sufiks : ''), desc });
  }
  return m;
}

// { title: '...' (+ SUFIKS)?, desc: '...' }  ->  {title, desc}  (bez ključa, jedan zapis)
function izvuciPlosno(blok, sufiks) {
  const re = /title:\s*'((?:\\.|[^'\\])*)'(\s*\+\s*SUFIKS)?\s*,\s*desc:\s*'((?:\\.|[^'\\])*)'/;
  const match = re.exec(blok);
  if (!match) return null;
  const [, title, plusSufiks, desc] = match;
  return { title: title + (plusSufiks ? sufiks : ''), desc };
}

// 'kljuc': 'tekst'  ->  Map(kljuc -> tekst)
function izvuciRjecnik(blok) {
  const re = /'([\w-]+)':\s*'((?:\\.|[^'\\])*)'/g;
  const m = new Map();
  let match;
  while ((match = re.exec(blok))) m.set(match[1], match[2]);
  return m;
}

// slug + naslov iz OBJAVE niza  ->  Map(slug -> naslov). Oslanja se na to da
// OBJAVE objekti nemaju ugnijezdene {} (samo plosna polja) - [^}]* zato ne
// prelazi u sljedeci objekt.
function izvuciObjave(blok) {
  const re = /slug:\s*'([\w-]+)'[^}]*?naslov:\s*'((?:\\.|[^'\\])*)'/g;
  const m = new Map();
  let match;
  while ((match = re.exec(blok))) m.set(match[1], match[2]);
  return m;
}

// ── index.html: izvor istine ─────────────────────────────────────────────

const sufiksMatch = /const SUFIKS = '([^']*)';/.exec(indexHtml);
if (!sufiksMatch) odustani("ne mogu naci 'const SUFIKS = ...;' u index.html");
const SUFIKS = sufiksMatch[1];

const blokCalc = isjecak(indexHtml, 'const META_CALC = {', 'const META_POK_INDEX', 'index.html META_CALC');
const blokPokIndex = isjecak(indexHtml, 'const META_POK_INDEX = {', 'const META_POK = {', 'index.html META_POK_INDEX');
const blokPok = isjecak(indexHtml, 'const META_POK = {', 'const META_BLOG_INDEX', 'index.html META_POK');
const blokBlogIndex = isjecak(indexHtml, 'const META_BLOG_INDEX = {', 'const META_BLOG_DESC', 'index.html META_BLOG_INDEX');
const blokBlogDesc = isjecak(indexHtml, 'const META_BLOG_DESC = {', 'const META_STATIC', 'index.html META_BLOG_DESC');
const blokStatic = isjecak(indexHtml, 'const META_STATIC = {', 'function _initDark', 'index.html META_STATIC');
const blokObjave = isjecak(indexHtml, 'const OBJAVE = [', '\n];', 'index.html OBJAVE');

const calc = izvuciUgnijezdeno(blokCalc, SUFIKS);
const pok = izvuciUgnijezdeno(blokPok, SUFIKS);
const stat = izvuciUgnijezdeno(blokStatic, SUFIKS);
const pokIndex = izvuciPlosno(blokPokIndex, SUFIKS);
const blogIndex = izvuciPlosno(blokBlogIndex, SUFIKS);
const blogDesc = izvuciRjecnik(blokBlogDesc);
const objaveNaslovi = izvuciObjave(blokObjave);

if (calc.size < 5) odustani(`META_CALC: izvuceno samo ${calc.size} unosa - ocekivano vise`);
if (pok.size < 3) odustani(`META_POK: izvuceno samo ${pok.size} unosa - ocekivano vise`);
if (stat.size < 3) odustani(`META_STATIC: izvuceno samo ${stat.size} unosa - ocekivano vise`);
if (blogDesc.size < 5) odustani(`META_BLOG_DESC: izvuceno samo ${blogDesc.size} unosa - ocekivano vise`);
if (objaveNaslovi.size < 5) odustani(`OBJAVE: izvuceno samo ${objaveNaslovi.size} naslova - ocekivano vise`);
if (!pokIndex) odustani('META_POK_INDEX: nisam uspio izvuci title/desc');
if (!blogIndex) odustani('META_BLOG_INDEX: nisam uspio izvuci title/desc');

// Blog: title dolazi iz OBJAVE.naslov + SUFIKS, desc iz META_BLOG_DESC (ili
// fallback na META_BLOG_INDEX.desc ako izostane) - isto pravilo kao getMeta().
const blog = new Map();
for (const [slug, naslov] of objaveNaslovi) {
  blog.set(slug, { title: naslov + SUFIKS, desc: blogDesc.get(slug) || blogIndex.desc });
}

const STATICNE_PUTANJE = { proj: '/projekti', b2b: '/edukacija', autor: '/o-meni', faq: '/cesta-pitanja', priv: '/politika-privatnosti', kontakt: '/kontakt' };

function izgradiRuteMapu(calcM, pokIdx, pokM, blogIdx, blogM, statM) {
  const rute = new Map();
  rute.set('/', statM.get('home'));
  for (const [k, v] of calcM) rute.set('/kalkulatori/' + k, v);
  rute.set('/pokazatelji', pokIdx);
  for (const [k, v] of pokM) rute.set('/pokazatelji/' + k, v);
  rute.set('/blog', blogIdx);
  for (const [slug, v] of blogM) rute.set('/blog/' + slug, v);
  for (const [tab, put] of Object.entries(STATICNE_PUTANJE)) {
    if (statM.has(tab)) rute.set(put, statM.get(tab));
  }
  return rute;
}

const izvor = izgradiRuteMapu(calc, pokIndex, pok, blogIndex, blog, stat);

// ── middleware.js: mirror ─────────────────────────────────────────────────

const mwBlokCalc = isjecak(middlewareJs, 'const META_CALC = {', 'const META_POK_INDEX', 'middleware.js META_CALC');
const mwBlokPokIndex = isjecak(middlewareJs, 'const META_POK_INDEX = {', 'const META_POK = {', 'middleware.js META_POK_INDEX');
const mwBlokPok = isjecak(middlewareJs, 'const META_POK = {', 'const META_BLOG_INDEX', 'middleware.js META_POK');
const mwBlokBlogIndex = isjecak(middlewareJs, 'const META_BLOG_INDEX = {', 'const META_BLOG = {', 'middleware.js META_BLOG_INDEX');
const mwBlokBlog = isjecak(middlewareJs, 'const META_BLOG = {', 'const META_STATIC', 'middleware.js META_BLOG');
const mwBlokStatic = isjecak(middlewareJs, 'const META_STATIC = {', 'const CRAWLER_UA', 'middleware.js META_STATIC');

// middleware.js koristi ISTU '+ SUFIKS' sintaksu kao index.html (ista SUFIKS
// vrijednost, provjereno ispod), pa se izvlaci s istim sufiksom.
const mwSufiksMatch = /const SUFIKS = '([^']*)';/.exec(middlewareJs);
if (!mwSufiksMatch) odustani("ne mogu naci 'const SUFIKS = ...;' u middleware.js");
if (mwSufiksMatch[1] !== SUFIKS) odustani(`SUFIKS se razlikuje: index.html '${SUFIKS}' vs middleware.js '${mwSufiksMatch[1]}'`);

const mwCalc = izvuciUgnijezdeno(mwBlokCalc, SUFIKS);
const mwPok = izvuciUgnijezdeno(mwBlokPok, SUFIKS);
const mwStatic = izvuciUgnijezdeno(mwBlokStatic, SUFIKS);
const mwPokIndex = izvuciPlosno(mwBlokPokIndex, SUFIKS);
const mwBlogIndex = izvuciPlosno(mwBlokBlogIndex, SUFIKS);
const mwBlog = izvuciUgnijezdeno(mwBlokBlog, SUFIKS);

if (mwCalc.size < 5) odustani(`middleware.js META_CALC: izvuceno samo ${mwCalc.size} unosa`);
if (mwPok.size < 3) odustani(`middleware.js META_POK: izvuceno samo ${mwPok.size} unosa`);
if (mwStatic.size < 3) odustani(`middleware.js META_STATIC: izvuceno samo ${mwStatic.size} unosa`);
if (mwBlog.size < 5) odustani(`middleware.js META_BLOG: izvuceno samo ${mwBlog.size} unosa`);
if (!mwPokIndex) odustani('middleware.js META_POK_INDEX: nisam uspio izvuci title/desc');
if (!mwBlogIndex) odustani('middleware.js META_BLOG_INDEX: nisam uspio izvuci title/desc');

const mirror = izgradiRuteMapu(mwCalc, mwPokIndex, mwPok, mwBlogIndex, mwBlog, mwStatic);

// ── Usporedba ──────────────────────────────────────────────────────────────

const problemi = [];
const sveRute = new Set([...izvor.keys(), ...mirror.keys()]);
for (const ruta of [...sveRute].sort()) {
  const i = izvor.get(ruta);
  const m = mirror.get(ruta);
  if (!i) { problemi.push(`${ruta}: postoji u middleware.js, NEDOSTAJE u index.html (getMeta)`); continue; }
  if (!m) { problemi.push(`${ruta}: postoji u index.html (getMeta), NEDOSTAJE u middleware.js`); continue; }
  if (i.title !== m.title) problemi.push(`${ruta}: title se razlikuje\n      index.html:    "${i.title}"\n      middleware.js: "${m.title}"`);
  if (i.desc !== m.desc) problemi.push(`${ruta}: desc se razlikuje\n      index.html:    "${i.desc}"\n      middleware.js: "${m.desc}"`);
}

// Dodatna, laksa provjera: svaki blog slug iz META_BLOG_DESC mora imati
// odgovarajuci /blog/<slug> u sitemap.xml (clanci moraju biti indeksirani -
// za razliku od kalkulatora/pokazatelja gdje postoje namjerne iznimke izvan
// sitemapa, vidi index.html ~6250-6252, pa se ta dva NE usporeduju ovdje).
for (const slug of blogDesc.keys()) {
  if (!sitemapXml.includes(`/blog/${slug}<`)) {
    problemi.push(`/blog/${slug}: postoji u META_BLOG_DESC, NEDOSTAJE u sitemap.xml`);
  }
}

// ── Izvjestaj ────────────────────────────────────────────────────────────

if (problemi.length === 0) {
  console.log(`USKLADENO - ${sveRute.size} ruta usporedeno (index.html <-> middleware.js), ${blogDesc.size} blog slugova provjereno u sitemap.xml.`);
  process.exit(0);
} else {
  console.error(`RAZILAZENJE - ${problemi.length} problema:\n`);
  problemi.forEach((p) => console.error('  - ' + p));
  process.exit(1);
}
