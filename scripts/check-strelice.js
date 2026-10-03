#!/usr/bin/env node
// Provjerava da se smjer strelice na karticama pokazatelja (POK_KAT[*].stat)
// stvarno može izvesti iz podataka. Strelica se ne upisuje ručno: kartica s
// poljem 'smjer' izvodi je iz TRZISTE / KS_* serije / CPI / predznaka vrijednosti,
// a kartica BEZ 'smjer' nema izvor prethodne vrijednosti pa strelicu ne prikazuje.
// Vidi komentar iznad `const POK_KAT` u index.html.
//
// Javlja SAMO kartice koje IMAJU deklariran izvor, a smjer se iz njega ne može
// izvesti (nema stavke, nema prethodne vrijednosti, krivo ime, vrijednost se ne
// slaže s onom koju kartica prikazuje). Kartice koje svjesno nemaju izvor ne
// javlja - samo ih prebroji.
//
// ZAŠTO ZASEBNA SKRIPTA, a ne dio check-meta-sync.js: ta skripta je u
// buildCommandu (vercel.json) pa svaki njen neuspjeh blokira deploy. Pokvarena
// strelica je kozmetička greška podatka, ne razlog da se zaustavi objava
// ažuriranja. Pokreće se ručno uz mjesečno ažuriranje. Exit 1 ako nešto nije
// u redu, pa se po potrebi može ubaciti i u buildCommand.
//
// Isti pristup kao check-meta-sync.js: čisti regex, bez eval-a. Svaka izvučena
// cjelina ima provjeru "nađeno je barem N, inače odustani glasno".
//
// Pokretanje: node scripts/check-strelice.js

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function odustani(poruka) {
  console.error('GRESKA U SKRIPTI (ne stvarno razilazenje - provjeri format): ' + poruka);
  process.exit(1);
}

function isjecak(od, doOznake, naziv) {
  const i = html.indexOf(od);
  if (i === -1) odustani(`ne mogu naci '${od}' (${naziv})`);
  const j = html.indexOf(doOznake, i);
  if (j === -1) odustani(`ne mogu naci kraj '${doOznake}' (${naziv})`);
  return html.slice(i, j);
}

const num = (t) => (t === 'null' ? null : parseFloat(t));

// ── TRZISTE: id -> { val, prev } ────────────────────────────────────────
const trziste = {};
for (const l of isjecak('const TRZISTE = [', '\n];', 'TRZISTE').split('\n')) {
  const m = /id: '([^']+)'/.exec(l);
  if (!m) continue;
  const v = /\bval: (-?[\d.]+)/.exec(l), pr = /\bprev: (-?[\d.]+)/.exec(l);
  trziste[m[1]] = { val: v ? num(v[1]) : null, prev: pr ? num(pr[1]) : null };
}
if (Object.keys(trziste).length < 4) odustani('TRZISTE: izvučeno manje od 4 stavke');

// ── KS_* serije ─────────────────────────────────────────────────────────
const ksMj = /const KS_MJ = (\d+);/.exec(html);
if (!ksMj) odustani("ne mogu naci 'const KS_MJ'");
const ZI = parseInt(ksMj[1], 10) - 1;
const ksSer = {};
const serBlok = isjecak('const KS_SER = {', '};', 'KS_SER');
for (const m of serBlok.matchAll(/(\w+): KS_(\w+)/g)) {
  const a = new RegExp('const KS_' + m[2] + ' = \\[([^\\]]*)\\];').exec(html);
  if (!a) odustani('ne mogu naci niz KS_' + m[2]);
  ksSer[m[1]] = a[1].split(',').map((x) => num(x.trim()));
}
if (Object.keys(ksSer).length < 10) odustani('KS_SER: izvučeno manje od 10 serija');

// ── CPI, zadnja godina ──────────────────────────────────────────────────
const cpiZ = /const CPI_ZADNJA = (\d+);/.exec(html);
if (!cpiZ) odustani("ne mogu naci 'const CPI_ZADNJA'");
const cpiBlok = isjecak('const CPI = {', '};', 'CPI');
const cpiZadnja = new RegExp('\\b' + cpiZ[1] + ': (-?[\\d.]+)').exec(cpiBlok);
if (!cpiZadnja) odustani('CPI nema unos za ' + cpiZ[1]);

// ── PLACE_GOD, zadnji redak ─────────────────────────────────────────────
const placeBlok = isjecak('const PLACE_GOD = [', '];', 'PLACE_GOD');
const placeRedovi = [...placeBlok.matchAll(/\[(\d{4}), (-?[\d.]+), (-?[\d.]+), (-?[\d.]+), (-?[\d.]+)\]/g)];
if (placeRedovi.length < 5) odustani('PLACE_GOD: izvučeno manje od 5 redaka');
const placeZadnji = placeRedovi[placeRedovi.length - 1];

// ── POK_KAT stat kartice ────────────────────────────────────────────────
const kartice = [];
let kat = null;
for (const l of isjecak('const POK_KAT = {', '\n};', 'POK_KAT').split('\n')) {
  const k = /^  (\w+): \{$/.exec(l);
  if (k) { kat = k[1]; continue; }
  if (!/^\s*\{ val: /.test(l)) continue;
  const label = /label: '([^']*)'/.exec(l);
  const val = /\{ val: '([^']*)'/.exec(l);
  const sm = /smjer: \{([^}]*)\}/.exec(l);
  if (!label) odustani('kartica bez label-a u kategoriji ' + kat + ': ' + l.trim().slice(0, 60));
  kartice.push({ kat, label: label[1], val: val ? val[1] : null, smjer: sm ? sm[1].trim() : null });
}
if (kartice.length < 14) odustani('POK_KAT: izvučeno manje od 14 kartica (očekivano 16)');

// ── Provjera ────────────────────────────────────────────────────────────
const greske = [];
let sIzvorom = 0;
let bezIzvora = 0;

for (const c of kartice) {
  if (!c.smjer) { bezIzvora++; continue; }
  sIzvorom++;
  const ime = `${c.kat} / "${c.label}"`;
  const tz = /\btz: '([^']+)'/.exec(c.smjer);
  const ks = /\bks: '([^']+)'/.exec(c.smjer);
  const kum = /\bkum: (\d+)/.exec(c.smjer);
  const znak = /\bznak: true\b/.test(c.smjer);

  if (tz) {
    const t = trziste[tz[1]];
    if (!t) greske.push(`${ime}: TRZISTE nema stavku '${tz[1]}'`);
    else if (t.prev === null || isNaN(t.prev)) greske.push(`${ime}: TRZISTE '${tz[1]}' nema prev`);
    else if (tz[1] === 'placaProsjek' && t.val !== parseFloat(placeZadnji[2])) {
      greske.push(`${ime}: kartica prikazuje PLACE_GOD ${placeZadnji[2]}, a smjer se izvodi iz TRZISTE.placaProsjek.val ${t.val} - ažuriraj oba`);
    }
  } else if (ks) {
    const a = ksSer[ks[1]];
    if (!a) greske.push(`${ime}: KS_SER nema seriju '${ks[1]}'`);
    else if (typeof a[ZI] !== 'number' || typeof a[ZI - 1] !== 'number' || isNaN(a[ZI]) || isNaN(a[ZI - 1])) {
      greske.push(`${ime}: serija ${ks[1]} nema vrijednost za zadnja dva mjeseca (indeksi ${ZI - 1}, ${ZI})`);
    }
  } else if (kum) {
    const t = trziste.inflacija;
    if (!t || t.prev === null || isNaN(t.prev)) greske.push(`${ime}: TRZISTE.inflacija nema prev`);
    else if (t.val !== parseFloat(cpiZadnja[1])) {
      greske.push(`${ime}: CPI[${cpiZ[1]}] = ${cpiZadnja[1]}, a TRZISTE.inflacija.val = ${t.val} - smjer se izvodi uz pretpostavku da su jednaki`);
    }
  } else if (znak) {
    if (!c.val || !/^[+\-−]?\s*\d/.test(c.val)) greske.push(`${ime}: smjer { znak: true } traži literalnu vrijednost s brojem, ne token (val: ${c.val})`);
  } else {
    greske.push(`${ime}: nepoznat izvor smjera '${c.smjer}' (dopušteno: tz, ks, kum, znak)`);
  }
}

if (greske.length) {
  console.error('STRELICE: smjer se ne može izvesti za ' + greske.length + ' karticu/kartice:');
  greske.forEach((g) => console.error('  - ' + g));
  process.exit(1);
}
console.log(`STRELICE OK - ${sIzvorom} kartica s izvorom smjera provjereno, ${bezIzvora} bez izvora (namjerno bez strelice, ne provjerava se).`);
