#!/usr/bin/env node
// Provjerava da je JSON-LD FAQPage blok u index.html i dalje točno ono što
// bi scripts/gen-faq-jsonld.js generirao iz trenutnog FAQ niza.
//
// Odvojeno od check-meta-sync.js namjerno: drugačiji izvor podataka (FAQ
// tekst, ne ruta->meta tablice) i drugačiji popravak (pokreni generator,
// ne ručno uredi jedan od dva mjesta). Dijeli funkcije s
// scripts/gen-faq-jsonld.js umjesto da duplicira regex za izvlačenje FAQ-a -
// dvije kopije istog regexa bile bi treći izvor razilaženja, ne rješenje.
//
// Pokretanje: node scripts/check-faq-jsonld-sync.js
// Exit 0 = usklađeno. Exit 1 = FAQ niz izmijenjen bez ponovnog pokretanja
// generatora (ili greška u samoj skripti — promijenjen format pa ništa nije
// izvučeno, isto ponašanje kao check-meta-sync.js). Popravak:
// node scripts/gen-faq-jsonld.js, zatim commit.

const fs = require('fs');
const path = require('path');
const { izvuciFaq, izgradiJsonLd, pronadjiGranice } = require('./gen-faq-jsonld.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const faq = izvuciFaq(html);
const ocekivano = izgradiJsonLd(faq);
const { contentStart, endIdx } = pronadjiGranice(html);
const stvarno = html.slice(contentStart, endIdx);

if (stvarno === ocekivano) {
  console.log(`USKLADENO - JSON-LD FAQPage odgovara ${faq.length} zapisa iz FAQ niza.`);
  process.exit(0);
} else {
  console.error('RAZILAZENJE - JSON-LD FAQPage u index.html NIJE usklađen s FAQ nizom.');
  console.error('Popravak: node scripts/gen-faq-jsonld.js, zatim commit izmijenjenog index.html.');
  process.exit(1);
}
