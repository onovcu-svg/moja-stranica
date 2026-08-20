// Vercel Edge Middleware — vraća minimalan HTML s ISPRAVNIM, po-ruti meta
// tagovima SAMO prepoznatim social-share crawlerima (LinkedIn, Facebook,
// WhatsApp, Slack, X/Twitter, Telegram, Discord). Ti crawleri ne izvršavaju
// JS, pa bez ovoga uvijek vide statičke og: vrijednosti naslovnice iz
// index.html <head>-a, bez obzira koja je ruta podijeljena — vidi NOTES.md
// §3 "Dinamički title/description po ruti" i §6 (nalaz 20.8.2026, opcija 8).
//
// Stvarni posjetitelji (obični preglednik) i Googlebot (izvršava JS, čita
// _applyMeta() iz index.html) NIKAD ne prolaze kroz ovu granu — dobivaju
// nepromijenjen, identičan odgovor kao prije ovog filea. Ovo je namjerno:
// puna SPA stranica je 1+ MB, dohvaćati/regexati taj cijeli sadržaj na
// SVAKI zahtjev pravog posjetitelja bio bi trošak bez koristi.
//
// MIRROR UPOZORENJE — čitaj prije bilo kakve izmjene rute ili bloga:
// Tablice ispod su RUČNA KOPIJA getMeta() tablica iz index.html
// (META_CALC/META_POK/META_STATIC + OBJAVE[].naslov+META_BLOG_DESC spojeni
// u META_BLOG, jer ovdje nema zasebnog OBJAVE izvora). Svaka nova ruta ili
// blog članak MORA se upisati i ovdje, inače će crawleri i dalje vidjeti
// staru/pogrešnu vrijednost za tu rutu. Provjeri usklađenost prije commita:
//   node scripts/check-meta-sync.js
// Ista skripta je i Vercelov buildCommand (vercel.json) — razilaženje
// blokira deploy i ako se ručna provjera preskoči. Vidi NOTES.md §3 za
// postupak ako skripta LAŽNO blokira deploy (Instant Rollback prvo).

export const config = {
  // Preskace api/*, assets/* i sve putanje s ekstenzijom (favicon, robots.txt,
  // sitemap.xml, support.js, slike...) — middleware nema smisla na statickoj
  // imovini, samo na "cistim" SPA rutama koje inace sve servira index.html.
  matcher: '/((?!api/|assets/|.*\\..*).*)',
};

// Koristi se SAMO za skidanje sufiksa u <h1> minimalnog HTML-a ispod, ne za
// gradnju samih naslova — svi naslovi u tablicama vec su gotovi (sufiksirani
// gdje getMeta() u index.html to radi), da izvlacenje u check-meta-sync.js
// ne mora parsirati '+ SUFIKS' sintaksu na ovoj strani.
const SUFIKS = ' | O novcu';

const META_CALC = {
  hub: { title: 'Besplatni financijski kalkulatori' + SUFIKS, desc: 'Kalkulatori plaće, kredita, ulaganja i inflacije za Hrvatsku u 2026., prilagođeni važećim propisima. Bez registracije, izračun ostaje u pregledniku.' },
  placa: { title: 'Kalkulator plaće 2026: bruto u neto' + SUFIKS, desc: 'Izračunaj neto plaću iz bruta ili obratno po propisima za 2026., s doprinosima, osobnim odbitkom i poreznim stopama tvog grada ili općine.' },
  kredit: { title: 'Kalkulator kredita: anuiteti i otplatni plan' + SUFIKS, desc: 'Izračunaj mjesečnu ratu, ukupnu kamatu i otplatni plan za stambeni ili gotovinski kredit, uz mogućnost prijevremene otplate i uštede na kamati.' },
  kamata: { title: 'Kalkulator ulaganja i složene kamate' + SUFIKS, desc: 'Projiciraj rast redovnog mjesečnog ulaganja uz složenu kamatu, izračunaj potrebnu uplatu za cilj ili koliko dugo traje ušteđevina u isplati.' },
  inflacija: { title: 'Kalkulator inflacije za Hrvatsku' + SUFIKS, desc: 'Izračunaj koliko je tvoj novac izgubio na vrijednosti zbog inflacije u Hrvatskoj, za bilo koje razdoblje, početni iznos i stopu inflacije.' },
  povijest: { title: 'Koliko je novac izgubio na vrijednosti' + SUFIKS, desc: 'Izračunaj koliko je iznos iz prošlosti izgubio na kupovnoj moći do danas, po stvarnim godišnjim stopama inflacije Državnog zavoda za statistiku.' },
  refi: { title: 'Refinanciranje kredita: isplati li se?' + SUFIKS, desc: 'Izračunaj koliko novca i vremena možeš uštedjeti refinanciranjem postojećeg kredita, uz uračunate troškove novog ugovora.' },
  opcije: { title: 'Kraći ili duži rok otplate kredita' + SUFIKS, desc: 'Usporedba mjesečnog opterećenja kod kraćeg i duljeg roka otplate kredita, uz opciju ulaganja razlike u ratama.' },
  zatvoriti: { title: 'Zatvoriti kredit prije roka ili ne' + SUFIKS, desc: 'Izračunaj koliko kamate izbjegavaš prijevremenim zatvaranjem kredita i isplati li ti se to u tvojoj fazi otplate.' },
};

const META_POK_INDEX = { title: 'Hrvatska u brojkama: plaće, kamate, inflacija' + SUFIKS, desc: 'Pregled ključnih ekonomskih pokazatelja Hrvatske: inflacija, plaće, mirovine, nekretnine i kamatne stope na kredite, iz podataka DZS-a i HNB-a.' };
const META_POK = {
  inflacija: { title: 'Inflacija u Hrvatskoj: aktualni podaci' + SUFIKS, desc: 'Godišnja i mjesečna stopa inflacije u Hrvatskoj po indeksu potrošačkih cijena (CPI) Državnog zavoda za statistiku, kroz posljednjih nekoliko godina.' },
  place: { title: 'Plaće u Hrvatskoj: prosjek i medijan' + SUFIKS, desc: 'Prosječna i medijalna neto i bruto plaća u Hrvatskoj, zakonska minimalna plaća za 2026. i kretanje plaća kroz vrijeme, po podacima DZS-a.' },
  krediti: { title: 'Kamatne stope na kredite u Hrvatskoj' + SUFIKS, desc: 'Prosječne kamatne stope na nove stambene i gotovinske kredite u Hrvatskoj te ukupan iznos novoodobrenih kredita, po podacima HNB-a svaki mjesec.' },
  nekretnine: { title: 'Cijene nekretnina u Hrvatskoj' + SUFIKS, desc: 'Koliko rastu cijene nekretnina u Hrvatskoj — indeks cijena stambenih objekata prema DZS-u, kretanje po tipu objekta i aktivnost tržišta.' },
  mirovine: { title: 'Mirovinski sustav Hrvatske u brojkama' + SUFIKS, desc: 'Prosječna starosna mirovina, omjer zaposlenih i umirovljenika te raspodjela članova drugog mirovinskog stupa po kategorijama rizika ulaganja.' },
};

const META_BLOG_INDEX = { title: 'Blog i videi o osobnim financijama' + SUFIKS, desc: 'Članci i videi o plaćama, kreditima, ulaganju, mirovinama i financijskim navikama u Hrvatskoj, napisani jasno i bez financijskog žargona.' };
// Spojeno OBJAVE[].naslov (index.html:5467) + META_BLOG_DESC (index.html:6268)
// u jedan zapis po slugu, jer ovdje nema zasebnog OBJAVE izvora - vidi
// napomenu o mirroru na vrhu datoteke.
const META_BLOG = {
  'hrvatski-investicijski-racun-2027': { title: 'Hrvatski investicijski račun: kako ćeš od 2027. ulagati bez poreza na zaradu?' + SUFIKS, desc: 'Objašnjenje hrvatskog investicijskog računa koji od 2027. omogućuje ulaganje u dionice i ETF-ove bez poreza na zaradu, uz uvjet o domaćem tržištu.' },
  'fiksna-ili-kombinirana-kamatna-stopa': { title: 'Fiksna ili kombinirana kamatna stopa: gdje je skrivena zamka?' + SUFIKS, desc: 'Razlika između fiksne i kombinirane kamatne stope na stambeni kredit i zašto niža početna rata zapravo znači prijenos rizika s banke na tebe.' },
  'zasto-kupujes-stvari-koje-ne-trebas': { title: 'Zašto kupuješ stvari koje ti ne trebaju (i kako prestati)' + SUFIKS, desc: 'Tri psihološka mehanizma, dopamin, bol plaćanja i strah od oskudice, kojima marketing danas potiče kupnju stvari koje ti zapravo ne trebaju.' },
  'stambeni-kredit-rok-otplate': { title: 'Stambeni kredit: zašto najkraći rok nije uvijek najbolji' + SUFIKS, desc: 'Zašto najkraći rok otplate stambenog kredita nosi najnižu kamatu, ali i najmanje financijskog manevarskog prostora ako dođe do neplaniranog troška.' },
  'zasto-cijene-nekretnina-rastu': { title: 'Zašto cijene nekretnina u Hrvatskoj ne prestaju rasti?' + SUFIKS, desc: 'Pet razloga zašto su cijene nekretnina u Hrvatskoj u pet godina porasle skoro 80 posto: ponuda, gradnja, plaće, kamate i kupnja u gotovini.' },
  'lazi-o-novcu': { title: '5 laži o novcu koje te ograničavaju' + SUFIKS, desc: 'Pet uvriježenih uvjerenja o novcu, naslijeđenih od roditelja i iz okoline, koja više nisu točna i danas te stvarno koštaju novca.' },
  '50-eura-mjesecno-u-etf': { title: 'Ulagao sam 50 € mjesečno u ETF-ove: evo što se dogodilo' + SUFIKS, desc: 'Dvije godine ulaganja 50 eura mjesečno u ETF-ove kroz Genius, s rezultatima po portfelju, kao dokaz da ne moraš biti bogat da bi počeo ulagati.' },
  'sto-je-ipo-javna-ponuda-dionica': { title: 'Što je IPO i isplati li se kupiti dionice na javnoj ponudi?' + SUFIKS, desc: 'Što je IPO, kako funkcionira javna ponuda dionica i zašto je prospekt jedini dokument koji mali ulagatelj mora pročitati prije ulaganja.' },
  'odlazak-u-mirovinu-drugi-stup-mod': { title: 'Odlazak u mirovinu: tko ti zapravo isplaćuje drugi stup?' + SUFIKS, desc: 'Objašnjenje uloge mirovinskog osiguravajućeg društva (MOD) koje pri odlasku u mirovinu isplaćuje ušteđevinu iz drugog stupa, uz mogućnost isplate do 20 %.' },
  'financije-u-red-u-8-tjedana': { title: 'Kako dovesti financije u red u 8 tjedana?' + SUFIKS, desc: 'Plan od osam tjedana s po jednim ili dva konkretna zadatka tjedno za izlazak iz života od plaće do plaće, bez potrebe za drastičnim rezovima.' },
  'zivimo-li-bolje-nego-2013': { title: 'Živi li prosječan Hrvat danas bolje nego 2013.?' + SUFIKS, desc: 'Usporedba plaća, kamata na stambene kredite i kupovne moći u Hrvatskoj prije ulaska u EU i danas, s razlikom ovisno o imovini pojedinca.' },
  'drugi-mirovinski-stup-fond': { title: 'Drugi mirovinski stup: zašto te pogrešan fond može koštati stotine tisuća eura' + SUFIKS, desc: 'Zašto izbor mirovinskog fonda i kategorije u drugom stupu utječe na konačnu mirovinu više nego razlika u plaći tijekom cijelog radnog vijeka.' },
  'navike-zbog-kojih-nemas-novca': { title: '12 navika zbog kojih ti novac stalno nestaje' + SUFIKS, desc: 'Dvanaest čestih financijskih navika, od potrošnje za status do zaboravljenih pretplata, zbog kojih na kraju mjeseca ne znaš kamo je novac otišao.' },
  'besplatni-bankovni-racun-2026': { title: 'Besplatni bankovni račun od 2026.: kome se stvarno isplati?' + SUFIKS, desc: 'Što donosi zakonska obveza besplatnog osnovnog bankovnog računa od 2026. i kome se stvarno isplati u odnosu na postojeći paket usluga banke.' },
};

const META_STATIC = {
  home: { title: 'O novcu: kalkulator plaće, kredita i inflacije (2026.)', desc: 'Hrvatski portal za osobne financije. Besplatni kalkulatori plaće, kredita, ulaganja i inflacije te aktualni pokazatelji HNB-a i DZS-a. Bez registracije.' },
  proj: { title: 'Javni investicijski eksperimenti' + SUFIKS, desc: 'Pratim uživo vlastito ulaganje u ETF-ove kroz nekoliko portfelja, s otvorenim brojkama i rezultatima.' },
  b2b: { title: 'Financijska edukacija za tvrtke' + SUFIKS, desc: 'Radionice o osobnim financijama za zaposlenike, uživo ili online, prilagođene veličini tvrtke, formatu i temi koju tvrtka sama odabere.' },
  autor: { title: 'Marko Bogdan' + SUFIKS, desc: 'Autor portala O novcu piše o plaćama, kreditima i ulaganju u Hrvatskoj, nakon 18 godina u financijskoj industriji.' },
  faq: { title: 'Česta pitanja o novcu' + SUFIKS, desc: 'Odgovori na najčešća pitanja o obračunu plaće, prijevremenoj otplati kredita i utjecaju inflacije na štednju u Hrvatskoj, kratko i jasno.' },
  priv: { title: 'Politika privatnosti' + SUFIKS, desc: 'Koje podatke portal O novcu prikuplja, kako se obrađuju izračuni i mailovi te koja prava imaš kao ispitanik prema europskoj uredbi GDPR.' },
  kontakt: { title: 'Kontakt' + SUFIKS, desc: 'Kontaktiraj autora portala O novcu za suradnju, pitanja o kalkulatorima i pokazateljima ili prijedloge tema za blog i edukacije za tvrtke.' },
};

const STATICNE_RUTE = { 'projekti': 'proj', 'edukacija': 'b2b', 'o-meni': 'autor', 'cesta-pitanja': 'faq', 'politika-privatnosti': 'priv', 'kontakt': 'kontakt' };

// Isti fallback obrazac kao getMeta()/_stateFromPath() u index.html: nepoznat
// calcTab/pokKat/slug pada na kalkulator plaće, indeks pokazatelja odnosno
// indeks bloga - nikad na prazan naslov.
function getMetaZaPutanju(pathname) {
  const dijelovi = pathname.split('/').filter(Boolean);
  if (dijelovi.length === 0) return META_STATIC.home;
  if (dijelovi[0] === 'kalkulatori') return META_CALC[dijelovi[1]] || META_CALC.placa;
  if (dijelovi[0] === 'pokazatelji') return (dijelovi[1] && META_POK[dijelovi[1]]) || META_POK_INDEX;
  if (dijelovi[0] === 'blog') {
    if (!dijelovi[1]) return META_BLOG_INDEX;
    return META_BLOG[dijelovi[1]] || META_BLOG_INDEX;
  }
  const tab = STATICNE_RUTE[dijelovi[0]];
  return (tab && META_STATIC[tab]) || META_STATIC.home;
}

// Popis crawlera kojima se vraća minimalni HTML - podudaranje je case-insensitive
// substring na User-Agent zaglavlju. Vidi NALAZ 20.8.2026 (opcija 8) za popis
// i obrazloženje; provjeriti protiv trenutne dokumentacije platformi ako se
// ikad pokaže da neki preview prestane raditi.
const CRAWLER_UA = ['facebookexternalhit', 'facebot', 'linkedinbot', 'slackbot', 'whatsapp', 'twitterbot', 'telegrambot', 'discordbot'];

function jeCrawler(userAgent) {
  const ua = (userAgent || '').toLowerCase();
  return CRAWLER_UA.some((needle) => ua.includes(needle));
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const OG_IMAGE = 'https://onovcu.hr/assets/og-image.jpg';

function renderHtml(meta, pathname) {
  const url = 'https://onovcu.hr' + pathname;
  const naslovBezSufiksa = meta.title.endsWith(SUFIKS) ? meta.title.slice(0, -SUFIKS.length) : meta.title;
  const title = escapeHtml(meta.title);
  const desc = escapeHtml(meta.desc);
  return '<!DOCTYPE html>\n<html lang="hr">\n<head>\n'
    + '<meta charset="utf-8">\n'
    + '<title>' + title + '</title>\n'
    + '<meta name="description" content="' + desc + '">\n'
    + '<meta property="og:title" content="' + title + '">\n'
    + '<meta property="og:description" content="' + desc + '">\n'
    + '<meta property="og:type" content="website">\n'
    + '<meta property="og:locale" content="hr_HR">\n'
    + '<meta property="og:url" content="' + url + '">\n'
    + '<meta property="og:image" content="' + OG_IMAGE + '">\n'
    + '<meta property="og:image:width" content="1200">\n'
    + '<meta property="og:image:height" content="630">\n'
    + '<meta name="twitter:card" content="summary_large_image">\n'
    + '<meta name="twitter:title" content="' + title + '">\n'
    + '<meta name="twitter:description" content="' + desc + '">\n'
    + '<meta name="twitter:image" content="' + OG_IMAGE + '">\n'
    + '<link rel="canonical" href="' + url + '">\n'
    + '</head>\n<body>\n'
    + '<h1>' + escapeHtml(naslovBezSufiksa) + '</h1>\n'
    + '<p>' + desc + '</p>\n'
    + '<p><a href="' + url + '">Otvori na onovcu.hr</a></p>\n'
    + '</body>\n</html>\n';
}

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!jeCrawler(ua)) return; // passthrough - obican posjetitelj i Googlebot dobivaju nepromijenjenu stranicu
  const { pathname } = new URL(request.url);
  const meta = getMetaZaPutanju(pathname);
  return new Response(renderHtml(meta, pathname), {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
