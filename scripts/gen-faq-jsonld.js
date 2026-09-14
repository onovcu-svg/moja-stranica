#!/usr/bin/env node
// Generira FAQPage JSON-LD blok (<script type="application/ld+json"> u
// <helmet>/<head>) izravno iz FAQ niza u index.html i upisuje ga natrag,
// natrag u index.html. JSON-LD ostaje DOSLOVAN TEKST u fajlu (ne generira se
// u pregledniku) jer ga crawleri koji NE izvršavaju JS (dio AI crawlera,
// GPTBot/ClaudeBot/PerplexityBot i sl.) čitaju iz sirovog HTML-a prije
// hidracije — runtime generiranje bi njima vratilo prazan/zastario blok.
// Zato ovaj skript ostaje jedini pisac tog bloka: FAQ tekst se uređuje SAMO
// u FAQ nizu, pa se ovaj skript pokrene da JSON-LD prepiše.
//
// NAMJERNO JEDNOSTAVNO, isti stil kao check-meta-sync.js: čisti regex, BEZ
// eval-a i BEZ generičkog JS parsera. FAQ zapisi su plošni jednolinijski
// objekti "{ p: '...', o: '...' }" — ako format ikad postane ugniježđen ili
// višeredan, ovaj regex prestaje raditi i skriptu treba prepraviti, ne
// "popraviti dalje" dodavanjem izuzetaka.
//
// Pokretanje: node scripts/gen-faq-jsonld.js
// Piše index.html na mjestu. Provjera da upis ostaje svjež nakon budućih
// izmjena FAQ niza radi se zasebno, u scripts/check-faq-jsonld-sync.js
// (dijeli ove iste funkcije, ne duplicira regex).

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'index.html');

function odustani(poruka) {
  console.error('GRESKA U SKRIPTI (ne stvarno razilazenje - provjeri format): ' + poruka);
  process.exit(1);
}

// Tijelo JS single-quote string literala (onako kako ga regex ispod izvuče,
// s '\'' i '\\' escapeovima još neraspakiranim) pretvara u stvarni string.
// FAQ odgovori su uvijek jednolinijski, bez '\n' unutar teksta — ako se to
// ikad promijeni, ovaj naivni raspakiravač (svaki '\X' -> 'X') to neće
// ispravno obraditi.
function unescapeJsString(raw) {
  return raw.replace(/\\(.)/g, '$1');
}

// Izvuče [{p, o}, ...] iz 'const FAQ = [ ... ];' u index.html.
function izvuciFaq(html) {
  const i = html.indexOf('const FAQ = [');
  if (i === -1) odustani("ne mogu naci 'const FAQ = [' u index.html");
  const start = i + 'const FAQ = ['.length;
  const j = html.indexOf('\n];', start);
  if (j === -1) odustani("ne mogu naci kraj FAQ niza ('\\n];') u index.html");
  const blok = html.slice(start, j);
  const re = /\{\s*p:\s*'((?:\\.|[^'\\])*)'\s*,\s*o:\s*'((?:\\.|[^'\\])*)'\s*\}/g;
  const out = [];
  let m;
  while ((m = re.exec(blok))) {
    out.push({ p: unescapeJsString(m[1]), o: unescapeJsString(m[2]) });
  }
  if (out.length === 0) odustani('FAQ niz je pronadjen, ali nije izvucen nijedan zapis - provjeri regex protiv formata');
  return out;
}

// [{p, o}, ...] -> tekst Question-objekata, jedan po retku, isti minificirani
// stil kao ostatak JSON-LD bloka (bez uvlake, bez razmaka nakon ':'/',').
function izgradiJsonLd(faq) {
  return faq.map((it) => (
    '{"@type":"Question","name":' + JSON.stringify(it.p)
    + ',"acceptedAnswer":{"@type":"Answer","text":' + JSON.stringify(it.o) + '}}'
  )).join(',\n');
}

// Granice dijela JSON-LD bloka koji ovaj skript smije mijenjati: SAMO popis
// Question-objekata unutar "mainEntity":[ ... ]. WebSite/Person/omotač
// FAQPage-a i sve ostalo u <helmet> ostaju netaknuti.
const START_TAG = '"mainEntity":[\n';
const END_TAG = ']}]}\n</script>';

function pronadjiGranice(html) {
  const startIdx = html.indexOf(START_TAG);
  if (startIdx === -1) odustani('ne mogu naci "mainEntity":[ u JSON-LD bloku');
  const contentStart = startIdx + START_TAG.length;
  const endIdx = html.indexOf(END_TAG, contentStart);
  if (endIdx === -1) odustani('ne mogu naci kraj JSON-LD bloka (]}]}\\n</script>)');
  return { contentStart, endIdx };
}

module.exports = { izvuciFaq, izgradiJsonLd, pronadjiGranice, odustani };

if (require.main === module) {
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  const faq = izvuciFaq(html);
  const novi = izgradiJsonLd(faq);
  const { contentStart, endIdx } = pronadjiGranice(html);
  const novaHtml = html.slice(0, contentStart) + novi + html.slice(endIdx);
  fs.writeFileSync(INDEX_PATH, novaHtml);
  console.log(`Upisano ${faq.length} FAQ zapisa u JSON-LD blok (index.html).`);
}
