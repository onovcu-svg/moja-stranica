# NOTES.md — O novcu / moja-stranica

Radni dnevnik projekta. Odluke, ograničenja i otvorene stavke.
**Claude Code: pročitaj ovaj file prije svakog većeg zadatka.**

Zadnje ažuriranje: 18. 8. 2026., 12:52

---

## 1. Arhitektura — što je ovo

- Statični projekt, **bez build koraka**. Vercel servira datoteke izravno.
- Jedan `index.html` (~9700 linija). React 18 + Babel Standalone učitani s
  **unpkg CDN-a**, JSX se transpilira **u pregledniku** pri svakom učitavanju.
- `support.js` je vendored runtime ("dc-runtime") iz vizualnog buildera kojim je
  stranica izvorno građena. Sadrži `sc-for` / `sc-if` interpreter i `<helmet>`
  premještanje u `document.head`.
- `data-props` JSON blok u `<script type="text/x-dc">` je ostatak istog buildera.
- Serverless rute u `api/`: `subscribe.js` (beehiiv), `contact.js` (Resend),
  `report.js` (Resend + opcionalni beehiiv opt-in), `yt-subs.js` (YouTube API).
- SPA rutiranje: `_pathFor()`, `_stateFromPath()`, `_syncUrl()`, `go(tab)`.
  `vercel.json` ima generički rewrite `/(.*)` → `/index.html`.

---

## 2. NE DIRATI

- **`support.js`** — vendored runtime. Njegov `FULL_PAGE_CSS` se nadjačava iz
  stranicinog vlastitog `<style>` bloka, ne mijenja se u samoj datoteci.
- **Gumb "Preuzmi PDF"** (`pdfPrint`, `window.print()`) — radi ispravno, ostaje.
- **`@media print` pravila** — odvojena od ekranskog prikaza, ispravna.
- **"Sponzorstvo" kao tema u kontakt formi** — ostaje, smislen kanal.
- **Tvrdnje koje su i dalje točne** i ne smiju se brisati kao "prototip tekst":
  - da se izračuni izvršavaju u pregledniku
  - da su EURIBOR, inflacija i prinos korisnikove *pretpostavke*, ne objavljeni podaci
  - disclaimeri da izračun nije financijski savjet
  - napomene o metodama obračuna pojedinih banaka

---

## 3. Donesene odluke

### Privatnost i podaci
- **PDF izvještaj i HTML mail moraju biti svijetli, uvijek**, neovisno od teme.
  (Provjereno 17.8. — već je tako, sve boje hardkodirane, ništa nije trebalo mijenjati.)
- **BCC** (`CONTACT_BCC_EMAIL`) ide samo na `contact.js` (kontakt + edukacija).
  **NIKAD na `report.js`** — taj mail sadrži korisnikove financijske podatke i
  kopija trećoj strani bila bi u sukobu s politikom privatnosti.
- **Privola mora biti eksplicitna, nikad podrazumijevana.** `mailNews` je bio
  `true` po defaultu — ispravljeno na `false`.
- Double opt-in na beehiivu je **uključen i ostaje tako**.

### Tehničke odluke
- **Sve putanje moraju biti apsolutne** (`/support.js`, `/assets/...`).
  Relativne (`./`) lome deep-linkove na rutama s dva segmenta — vidi §5.
- **Ne koristiti `maximum-scale` ni `user-scalable=no`** u viewport tagu.
  Rješenje iOS auto-zooma su inputi na 16px, unutar media querya za mobilni.
- **Inputi 16px samo na mobilnom** (`data-fs="sm"` + `@media (max-width: 767px)`).
  Desktop ostaje netaknut.
- **`html, body { height: auto; min-height: 100dvh; overflow: visible }`** —
  `body` više nije scroll container. `overflow-x:hidden` uklonjen jer je
  promocija `overflow-y` na `auto` lomila sticky header. Provjereno da nije
  štitio od stvarnog horizontalnog overflowa (1024/1440/1920px).
- **PDF pregled na mobilnom koristi CSS `zoom`, ne `transform: scale()`.**
  Breakpoint `@media screen and (max-width: 814px)` — stvarni potreban prostor
  je 794px list + 2×10px vodoravnog padda `.on-pdf-pad`-a, ne proizvoljnih
  830px. `transform` po specifikaciji ne mijenja prostor koji element
  zauzima u layoutu, pa bi `.on-pdf-pad` ostao visok kao neskalirani list i
  ostavio prazninu ispod lista; `zoom` stvarno smanjuje i layout kutiju, pa
  nema viška prostora niti dodatnog JS-a za ručno podešavanje visine
  wrappera. Centriranje ide kroz postojeći `margin:0 auto`, `zoom` ga ne
  remeti. `screen and` u uvjetu jamči da se pravilo nikad ne aktivira pri
  `@media print`. (Napomena: `calc()` nazivnik mora biti duljina, npr. `794px`,
  ne goli broj — inače preglednik tiho odbaci cijelu `zoom` deklaraciju.)
- **Dinamički title/description po ruti** (`getMeta()`, poziva se iz `_syncUrl()`
  na svaku promjenu rute, uključivo popstate). Naslovi kalkulatora/pokazatelja/
  statičnih stranica su ručno pisani, blog naslov dolazi iz `OBJAVE[].naslov`
  (jedan izvor istine), blog description je ručno pisan po članku jer je
  `OBJAVE[].opis` predugačak i pripovjedan za meta description. `og:*` i
  `twitter:*` ažuriraju se istom logikom. **Poznato ograničenje:** ovo je čisto
  klijentska izmjena (nema SSR-a) — pomaže Googleu (izvršava JS pri indeksiranju)
  ali NE social-share crawlerima (Slack/WhatsApp/LinkedIn/X ne izvršavaju JS),
  koji i dalje vide statičke `og:` vrijednosti iz `<head>`-a bez obzira na rutu.
  Vidi §6, poslijelansirna migracija.
  **`<title>` treba poseban tretman, `document.title = ...` nije dovoljno:**
  support.js-ov interni "helmet" mehanizam (vidi §2, NE DIRATI) na svaki
  re-render vraća `<title>` na statički tekst iz izvornog `<helmet>` bloka u
  `index.html` (potvrđeno mjerenjem — dogodi se već unutar par sekundi, npr. uz
  interval rotacije pokazatelja). Meta/og/canonical se ne diraju nakon prvog
  mounta pa njih nije trebalo braniti. `<title>` jest, pa `_guardTitle()` drži
  `MutationObserver` na `<title>` elementu koji odmah vrati željenu vrijednost
  čim je support.js prepiše — bez izmjene same `support.js` datoteke.
- **`componentDidUpdate(prevProps, prevState)` u `Component` NIKAD ne dobiva
  pravi `prevState`.** Otkriveno 18.8. dok se popravljao reset stanja pri
  promjeni kalkulatora: `support.js`-ov wrapper (`StreamableComponent`, vidi
  §2, NE DIRATI) zove `logic.componentDidUpdate(prevProps)` sa SAMO JEDNIM
  argumentom — drugi parametar je uvijek `undefined`. Stari kod
  (`if (prevState && prevState.calcTab !== ...)`) je zbog toga oduvijek bio
  no-op (tiho, bez greške u konzoli) — mail-modal reset pri promjeni
  kalkulatora **nikad nije radio**, unatoč tome što je izgledao ispravno.
  Ne postoji ispravka u `support.js`-u za ovo (vendored, ne dira se) — svako
  buduće `componentDidUpdate` mora pratiti prethodnu vrijednost ručno, preko
  vlastitog polja na instanci (npr. `this._prevX`), nikad preko drugog
  parametra. Vidi `_calcIdent`/`_prevCalcIdent` u `componentDidUpdate` kao
  primjer obrasca.
- **Cip trake ([data-seg]) s `justify-content:center` + `overflow-x:auto`
  odsijecaju sadržaj s obje strane kad je širi od trake**, i početni
  `scrollLeft` ne bude 0 nego na sredini overflowa. Uklonjeno centriranje s
  `data-seg="calc"`, `"pok"`, `"mir"` (jedine trake koje su kombinirale oboje).
  `resetHScroll()` više ne vraća cip-trake na `scrollLeft:0` (moglo bi sakriti
  aktivni cip) — umjesto toga `scrollActiveChipsIntoView()` centrira aktivni
  cip (`[data-seg-active="1"]`). `[data-hscroll]` (tablice, nemaju aktivni
  element) i dalje se vraćaju na 0. Poziva se i na mountu (isti checkpointi
  kao `syncSegs()`, zbog širine cipova ovisne o fontu) radi izravnih ruta čiji
  aktivni cip nije prvi u nizu.
  **Nužno `setTimeout(fn, 0)`, ne `requestAnimationFrame`** — potonji se ne
  pokreće pouzdano (u pozadinskim/nefokusiranim tabovima ga preglednik može
  suspendirati), pa je "popravak" izgledao neaktivan za pod-tabove kalkulatora.
  **NE koristiti `scrollIntoView` za ovo, ni s `block:'nearest'`** — prošao
  kroz sve scroll-ancestore uključivo stranicu i povlačio vertikalni skrol
  (regresija potvrđena na iPhoneu: Pokazatelji su se otvarali usred grafa
  umjesto na vrhu). Umjesto toga `scrollActiveChipsIntoView()` računa poziciju
  cipa ručno (`act.offsetLeft`) i postavlja `container.scrollLeft` izravno —
  to fizički ne može dirati `window`/`document` skrol.
- **Dvije različite strategije pozicioniranja cipa, po traci — ne dirati jednu
  zbog druge.** `calc`/`calcsub` (Kalkulatori) nikad nisu stvarno "poskakivali"
  jer `calc` ne prelazi širinu ekrana (scroll je matematički prikovan na 0), a
  `calcsub` gotovo uvijek slijeće na indeks 0 (prvi podtab obitelji), gdje se
  centriranje uvijek zaokruži na 0. `pok` (i rjeđe `mir`) *stvarno* prelazi
  širinu I ima realne ulazne točke na ne-nulte indekse (sitemap ravnopravno
  promovira svih 5 kategorija), pa je centriranje na svaki klik bilo vidljivo
  pomicanje trake i kad nije nužno. Rješenje, primijenjeno SAMO na `pok`/`mir`
  (`calc`/`calcsub` i dalje idu kroz `scrollActiveChipsIntoView()`,
  nepromijenjeno):
  - `scrollActivePokChipsIntoView()` — minimalni pomak: ako je aktivni cip već
    potpuno vidljiv, `scrollLeft` se uopće ne dira; inače se pomakne baš toliko
    da rub cipa (+12px razmaka) sjedne na rub trake.
  - Mount: umjesto 5 checkpointa (0/120/600ms/`load`/`fonts.ready`, i dalje
    korišteno za `calc`/`calcsub`), `pok`/`mir` čekaju isključivo
    `document.fonts.ready` (uz ~1s fallback ako se `ready` nikad ne razriješi,
    čuvano `_pokChipsPositioned` zastavicom da se ne pozicionira dvaput) — na
    stvarnom uređaju svaki raniji checkpoint može izračunati drugačiju poziciju
    dok se širina cipova slaže s učitanim fontom (`font-display: swap`
    + zaseban `saira-latin-ext.woff2` za dijakritiku), što se vidi kao skok.
  - **`scroll-behavior: smooth` i `el.scrollTo({behavior:'smooth'})` su se u
    testiranju pokazali nepouzdani — `scrollLeft` se ponekad uopće nije
    pomaknuo** (isti obrazac kao ranije otkriveni `requestAnimationFrame`
    problem — API-ji vezani uz animacijski frame ne moraju napredovati u
    pozadinskim/automatiziranim kontekstima, a `scroll-behavior:smooth` je
    interno vezan za isti mehanizam). Zato `scrollActivePokChipsIntoView()`
    postavlja `scrollLeft` izravno, bez animacije — pouzdanost ispravne
    pozicije ima prednost pred glatkim klizanjem. Ako se poslije pokaže da
    animacija na stvarnom uređaju ipak radi, može se dodati naknadno, ali
    provjeriti uživo na uređaju, ne osloniti se na automatizirano testiranje.
- **Pravilo: svaka stranica se uvijek otvara na vrhu, bez iznimke.** Vrijedi za
  svaku navigaciju: `go()`, `goCalc()`, `blogVeza()`, izravno otvaranje URL-a,
  promjenu kategorije/podtaba (Pokazatelji, Projekti, Blog), otvaranje i
  zatvaranje blog članka, i gumb natrag/naprijed u pregledniku. U kodu ne
  postoji nijedan link koji cilja određeni dio stranice (kotva/hash) - nema
  legitimnog razloga da bilo koja navigacija ostavi korisnika usred stranice.
  `_onPopState` (natrag/naprijed) do 18.8. NIJE resetirao skrol - popravljeno
  dodavanjem istog `window.scrollTo(0,0)` + `resetHScroll()` poziva, i
  postavljanjem `history.scrollRestoration = 'manual'` u `componentDidMount()`
  da preglednikovo vlastito vraćanje skrol pozicije na popstate ne poništi taj
  reset asinkrono. Provjereno uživo na svim putovima (430px): go() (svih 7
  odredišta), goCalc(), deep-link, promjena kategorije u Pokazateljima/
  Projektima/Blogu, otvaranje/zatvaranje članka, natrag/naprijed, blogVeza -
  svaki na vrhu, s vidljivim aktivnim cipom gdje je primjenjivo.
- **Publication ID ostaje u git historyju** — nije eksploatabilan bez API ključa,
  rewrite historyja nije vrijedan rizika.
- **GitHub Pages ugašen** (17.8.) — bila je druga živa kopija na
  `onovcu-svg.github.io/moja-stranica/` gdje API rute ne mogu raditi.
  Nikad nije bila indeksirana.
- **`TRZISTE` je NIZ, ne objekt.** Pristup ide isključivo preko `tz(id)`
  helpera. `TRZISTE.inflacija` i sl. daju `undefined`, a `pct()`/`eur()` tiho
  padnu na 0 — pa se greška prikaže kao vjerodostojan podatak, bez ičega u
  konzoli. Tako su tokeni `{CPI}`, `{HPI_RAST}`, `{MIROVINA}`, `{MIR_RATIO}`
  mjesecima pokazivali 0. Isti razred zamke kao `prevState`.
  **Svaki novi tihi fallback mora imati `console.error`** — vrijedi za `tz()` i
  `pokDatum`, tako je i izvedeno.
- **Brojka mora izgledati identično na svim mjestima gdje se pojavljuje.**
  `{CPI}` je bio `pct(...,1)` → "4,5 %" dok kartica ima "4,50 %". Kod svake
  nove metrike provjeriti broj decimala na svim prikazima.
- **Banner "Zadnje ažuriranje" čita `pokDatum`** — jedan izvor istine,
  hoistan uz `pk`, koristi se i za `{{ trzisteMjesec }}` (2990) i za
  `src.kategorija` (9219). Ne pisati drugu paralelnu mapu datuma.
- **Svaki podatak u Pokazateljima ima zapisan primarni izvor u `IZVORI.md`.**
  Prije izmjene ijedne brojke: otvoriti link iz tog filea, nikad pretraživati
  web, nikad medijski portal ni agregator. Nakon izmjene zapisati datum
  provjere. Izvori se međusobno razlikuju u metodologiji i bazi — mijenjanje
  izvora je urednička odluka, ne tehnička.
- **`style-<pseudo>` je podržan atribut u `support.js`, ne greška.**
  `collectProps()` hvata svaki atribut koji počinje sa `style-` i generira
  pravi `<style>` s pravilom `.scpN:<pseudo>{...!important}`. Koristi se
  ~113 puta u `index.html` (npr. `style-hover` na linkovima). Element može
  imati i `style` i `style-hover` — to su različita imena atributa, ne
  duplikat. Ne "popravljati" u zaseban CSS.
- **`TRZISTE` retci imaju opcionalno polje `dec`** (broj decimala u tickeru),
  isti obrazac kao postojeći `fmt`. `tickList` čita `x.dec ?? 2`. Bez `dec`
  stavka ostaje na 2 decimale. Postavljeno `dec: 1` na `hpi` jer kartica i
  sažetak prikazuju jednu decimalu — vidi pravilo o identičnom prikazu brojke.
- **Cjeloviti nalaz prije lansiranja: `AUDIT-2026-08-18.md`** (89 potvrđenih
  nalaza po kategorijama, s brojevima linija i dokazima, 11 oborenih s
  obrazloženjem, i popis onoga što je provjereno i ispravno).

### Sadržaj
- Kontakt uklonjen iz mobilnog izbornika, radi simetrije s desktopom. Forma
  dostupna preko footera, "O meni", FAQ CTA-a i politike privatnosti.
- Sekcija `/sponzori` i linkovi "Uvjeti sponzorstva" / "Kako funkcionira
  sponzorstvo" uklonjeni. Naslovi, opisi i logotipi sponzora **ostaju**.
- Regija Resenda: **EU (Irska, eu-west-1)**. Metapodaci se ipak obrađuju u
  SAD-u pod DPF-om — tako i piše u politici privatnosti.

---

## 4. Env varijable (Vercel, Production + Preview)

| Varijabla | Svrha |
|---|---|
| `RESEND_API_KEY` | Resend, slanje mailova |
| `CONTACT_TO_EMAIL` | primatelj upita — `kontakt@onovcu.hr` |
| `CONTACT_FROM_EMAIL` | pošiljatelj, mora biti na verificiranoj domeni |
| `CONTACT_BCC_EMAIL` | rezervni primatelj (opcionalno) |
| `BEEHIIV_API_KEY` | newsletter |
| `BEEHIIV_PUBLICATION_ID` | newsletter |
| `YOUTUBE_API_KEY` | broj pretplatnika |
| `YOUTUBE_CHANNEL_ID` | broj pretplatnika |

Development okruženje je zaključano na Hobby planu — ne treba.
**Ključevi se postavljaju isključivo kroz Vercel dashboard, nikad u terminal ni chat.**

---

## 5. Poznati problemi i njihova povijest

### Riješeno 18. 8. 2026.
- **Stanja kalkulatora "curila" na sljedeći kalkulator/sekciju.** Otvoreni
  accordion "Kako koristiti kalkulator", mail modal, PDF pregled i napredne
  opcije ("+") ostajali su otvoreni nakon prelaska na drugi kalkulator, drugu
  sekciju (`go()`) ili pod-tab. Uzrok: `componentDidUpdate` nikad nije dobivao
  `prevState` (vidi §3) pa je stari uvjet bio no-op. Popravljeno praćenjem
  identiteta kalkulatora ručno (`_prevCalcIdent`); uneseni podaci (iznosi,
  e-mail adresa u modalu) namjerno ostaju sačuvani.
- **Aktivni čip nije vidljiv u kategorijskim trakama.** Na `/pokazatelji`
  (i drugdje) traka je pri prvom otvaranju bila skrolana na sredinu
  (`justify-content:center` + `overflow-x:auto` odsijeca simetrično), a
  `resetHScroll()` je nakon toga vraćao na `scrollLeft:0`, sakrivajući aktivni
  čip ako nije prvi. Vidi §3.
- **Sažetci u Pokazateljima pokazivali 0,0 % / 0,00 €** — `TRZISTE` je niz a
  tokeni su mu pristupali kao objektu. Vidi §3. Popravljeno u `d71eb73`.
- **Nedovršena rečenica u sažetku inflacije** ("...koštala 100,00 € danas
  više.") — dovršena i gramatički ispravljena, iznos preko tokena
  `{KOSARICA_100}`, izveden iz `tz('inflacija')`, nije hardkodiran.
- **Banner "Zadnje ažuriranje" pokazivao isti datum za sve kategorije** — za
  Nekretnine netočan ("lipanj 2026." umjesto "prvo tromjesečje 2026.").
- **Tablica cijena po m² po gradovima uklonjena** (`4ffd793`) — brojke bez
  potvrdivog izvora, MPGI ne objavljuje jedinstvenu cijenu za Grad Zagreb.
  Zamijenjena karticom s objašnjenjem i linkom na MPGI. Detalji u `IZVORI.md`.
- **Rast cijena nekretnina bio 11,0 %, DZS objavio 14,3 %** (`1d74c37`).
  Usput otkriveno da ticker formatira sve postotke na 2 decimale fiksno, pa je
  ista brojka bila "14,3 %" na kartici i "14,30 %" u tickeru — riješeno
  poljem `dec`.

### Riješeno 17. 8. 2026.
- **Deep-linkovi slomljeni na 23/30 URL-ova.** `./support.js` na ruti s dva
  segmenta postajao `/kalkulatori/support.js`, Vercel rewrite vraćao HTML umjesto
  JS-a, runtime se nije pokretao, stranica ostajala nehidrirana sa sirovim
  `{{ }}` i zaglavljenim PDF modalom. **Popravak: apsolutne putanje (13 mjesta).**
- **Forme lažirale uspjeh.** Kontakt, B2B i "Pošalji izvještaj na mail"
  prikazivale su potvrdu bez ikakvog slanja (`setTimeout` + `Sent: true`).
  Spojene s Resendom.
- **Newsletter honeypot bio samo klijentski** — `nlHp` se nikad nije šalo
  serveru. Sad se provjerava server-side.
- **Reset skrola** — `window.scrollTo(0,0)` nije radio jer je `body` bio scroll
  container. Popravljeno na 8 mjesta + `resetHScroll()` za horizontalne kontejnere.
- **Bijeli prostor ispod footera na mobilnom** — vidi §3.

### Poznato, namjerno neriješeno
- **`{{ a.d }}` i slični placeholderi u SVG atributima** (`index.html:822` i
  `3762` za `d`/`transform`, `3615` i `3622` za `width`/`height` kućica).
  Preglednik parsira sirovi `d="{{ a.d }}"` prije hidracije, javi grešku, pa
  runtime prepiše ispravnom vrijednošću. **Grafovi rade** — provjereno uživo.
  **Konzola ima 8 poznatih grešaka po učitavanju** (4 mjesta × 2 atributa), i to
  na SVAKOJ ruti — cijeli template je u sirovom HTML-u pa preglednik parsira sve
  placeholdere neovisno o tome koja se sekcija prikazuje. Izmjereno 18.8.2026. u
  čistom tabu; prije je ovdje pisalo 4 i linije 766/3753/3573/3580, što su bile
  zastarjele vrijednosti (linije su se pomaknule uklanjanjem `NEK_GRAD`).
  Nestat će s migracijom na build. Filter u DevToolsu: `-a.d -nek.kuca`
- **Nema prave 404 stranice, i "preusmjerava na `/`" vrijedi SAMO za
  jednosegmentne rute.** Zaštita u `componentDidMount` (6395) gleda samo
  `init.tab !== 'home'`, pa se za dvosegmentne rute `history.replaceState('/')`
  nikad ne izvrši: `_stateFromPath` za `/pokazatelji/bilo-što` vrati
  `{ tab: 'pok', pokKat: 'bilo-što' }`, `tab` nije `'home'`, URL ostaje i Vercel
  rewrite vraća **200 s djelomičnim sadržajem (soft-404)**. Konkretno:
  `/pokazatelji/bilo-što` prikaže inflacijski sažetak i 4 inflacijske stat
  kartice (3009/3014 nisu pod nijednim `sc-if`, fallback 8297) ali bez ijednog
  grafa i bez aktivnog čipa; `/kalkulatori/bilo-što` prikaže objašnjenje
  kalkulatora plaće (fallback 7869) bez ijednog kalkulatora;
  `/blog/<nepostojeći-slug>` prazan članak (7835). Loše i za korisnika i za
  indeksiranje. Vidi `AUDIT-2026-08-18.md`.
- **Kamatne stope, plaće i ostali podaci u Pokazateljima su hardkodirani**
  (`TRZISTE` konstanta). `marketApiUrl` prop postoji ali je prazan — mehanizam
  za povlačenje nikad nije spojen. Ažurira se ručno.
- **`POK_KAT.nekretnine.graf.key` i `POK_KAT.krediti.graf.key` oba su
  `'stambeni'`** (5802, 5812). Spava jer je `imaGraf: false` (9522) tvrdo za
  sve kategorije. Ako se `imaGraf` ikad uključi, `SERIJE['stambeni']`
  (kamatna stopa, 2,90–3,90 %) napunio bi graf indeksa cijena nekretnina
  (raspon 66–239). Provjeriti prije uključivanja.
- **`STUP2_IMOVINA_MIL` (5675) se nikad ne prikazuje** — mrtav podatak.

### iOS-specifično — ne može se reproducirati u Chromeu
Auto-zoom na inpute, ponašanje visual viewporta pri tipkovnici, `height:100%`
obrada. Testirati na pravom uređaju.

---

## 6. Otvorene stavke

### Prije lansiranja
- [x] PDF pregled — cijeli list stane u širinu ekrana na mobilnom (CSS `zoom`, vidi §3)
- [x] Dinamički naslovi i description po ruti (svih 30 URL-ova + og:/twitter:, vidi §3)
- [ ] Layout provjera cijele stranice na 430px
- [ ] Funkcionalna provjera cijele stranice (što izgleda da radi a ne radi)
- [ ] Provjera da logika izračuna nije dotaknuta: `git diff 580b606 HEAD -- index.html`
- [x] **Provjera izvora i točnosti svih podataka u Pokazateljima.**
      Interna konzistentnost popravljena (`d71eb73`), točnost provjerena prema
      DZS / HNB / HZMO / HANFA / MPGI — 12 od 13 provjerivih brojki bilo je
      točno. Rast cijena nekretnina ispravljen s 11,0 % na 14,3 % (`1d74c37`).
      Tablica cijena po m² po gradovima uklonjena umjesto ispravljanja
      (`4ffd793`) — nije imala potvrdiv izvor. Banner za Nekretnine sad kaže
      "Indeks cijena: prvo tromjesečje 2026." jer kategorija ima tri razdoblja.
      **Svi izvori, linkovi i ritam objava zapisani su u `IZVORI.md`** — prije
      svake buduće izmjene brojke otvoriti link odande.
- [ ] beehiiv i EGP u politici privatnosti — tvrdnja o obradi u EGP-u je vjerojatno netočna
- [ ] InterCapital disclosure u sekciji Projekti (tekst §7)
- [ ] `"O novcu"` u navodnike na naslovnici (samo tamo)
- [ ] Provjera sitemapa i svih ruta
- [ ] Finalni test svih formi
- [ ] **Fiksna traka s rezultatom sjedne usred ekrana.** Pojavi se preko
      sadržaja kad se prvi put montira DOK je tipkovnica otvorena; nakon
      zatvaranja i ponovnog otvaranja je ispravno na dnu. Sumnja:
      `position:fixed` + visual viewport. Reproducirano na Kredit →
      Refinanciranje (iPhone 16 Pro Max, Safari).
- [ ] **Odabrana tema se ne pamti.** Nakon refresha stranica se vrati na
      svijetlu. Riješiti preko `localStorage`, uz: primjenu PRIJE prvog
      rendera (inline script u `<head>` koji postavi klasu na `<html>`,
      inače bljesne svijetla tema), poštivanje `prefers-color-scheme` ako
      korisnik nikad nije birao, i fallback kad `localStorage` nije dostupan
      (privatni tab). **VAŽNO, obrnuto od onoga što je ovdje prije pisalo:
      politika privatnosti (`index.html:4224`) VEĆ SAD tvrdi da se „tamna tema i
      zadnji otvoreni kalkulator spremaju lokalno u tvom pregledniku", a
      `localStorage`/`sessionStorage` imaju 0 pojava u `index.html` i
      `support.js`.** Dokument je dakle netočan DANAS, ne postaje netočan nakon
      implementacije — pravni tekst opisuje pohranu koja ne postoji. Popravak
      teksta je neovisan o implementaciji i može ići odmah.
- [ ] **Povezati `onovcu.hr` u Vercel Domains — ZADNJA STAVKA**

### Poslije lansiranja
- [ ] **Migracija na build** (Vite/Astro). Rješava: Babel u pregledniku,
      `{{ }}` u sirovom HTML-u, prerender po ruti, SVG placeholder greške.
      Procjena: dan do tjedan. **Raditi na Opusu.**
      Dodatni razlog: per-route `og:` tagovi ne rade za social preview dok
      nema SSR-a — svaki podijeljeni blog članak na LinkedInu/WhatsAppu
      pokazuje meta naslovnice. Jedan od glavnih razloga za migraciju.
- [ ] **Headless CMS** (Sanity / Payload / Contentful) — ide s migracijom.
      Trenutno se članci i videi dodaju ručno u `index.html`.
- [ ] Živi podaci HNB/DZS — scraping ruta + cache
- [ ] PDF u prilogu maila — odgođeno, HTML u tijelu ostaje
- [ ] **`HPI_GOD` niz na novu baznu godinu.** DZS je 2.7.2026. promijenio
      baznu godinu s 2015 = 100 na 2025 = 100 i revidirao cijeli niz
      2002.–2025. Postojeći niz (raspon 66–239) je stara baza. Namjerno
      odgođeno — za graf trenda baza je nebitna dok su sve točke na istoj.
      Linkovi i obrazloženje u `IZVORI.md`.

### Sporedno
- Domena `onovcu.hr` istječe **13. 11. 2026.** (registrar: Hrvatski Telekom /
  Regica.net, DNS: Cloudflare)
- Mail na domeni ide preko **iCloud Custom Email Domain** — Resend koristi
  subdomenu `send`, nema konflikta sa SPF-om
- iCloud **tiho odbacuje** mailove (Delivered u Resendu, ali nema ih ni u spamu).
  Zato postoji BCC.

---

## 7. InterCapital disclosure — tekst

Ide u sekciju Projekti, unutar kartice "Investiram svaki mjesec", **nakon** opisa
četiriju portfelja i **prije** grafa i brojki. Diskretno izdvojeno (sivi okvir ili
tanka linija lijevo), manji font, neutralne boje, **ne** stil alerta.

> Dugogodišnji sam zaposlenik InterCapitala i trenutačno Growth Strategist u
> Geniusu. Ova objava i projekt nisu plaćeni oglas ni suradnja.

---

## 8. Radni proces

- **Nikad ne commitati bez potvrde.** Nikad ne pushati bez izričitog odobrenja.
- **Nalaz prvo, izmjena poslije** kod svega što nije trivijalno.
- **Odvojeni commitovi** za izmjene koje diraju temeljni layout.
- **Regresijska provjera na desktopu** (1024/1440/1920px) nakon svake layout izmjene.
- Git remote: SSH (`git@github.com:onovcu-svg/moja-stranica.git`).
  Autor: `Marko Bogdan <kontakt@onovcu.hr>`.
- Testiranje isključivo na Vercel URL-u. **Ne** na GitHub Pages (ugašen).
