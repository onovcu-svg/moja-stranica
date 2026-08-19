# NOTES.md — O novcu / moja-stranica

Radni dnevnik projekta. Odluke, ograničenja i otvorene stavke.
**Claude Code: pročitaj ovaj file prije svakog većeg zadatka i ažuriraj ga kad
se donese nova odluka ili zatvori stavka.**

Zadnje ažuriranje: 19. 8. 2026., 21:12

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
- **4-stupčana usporedbena tablica STANE na 430px** — izmjereno (20.8.2026,
  kredit) s realnim i ekstremnim iznosima (7 znamenki, `−2.469.135,78 €`) i
  dugim labelama ("Prva mjesečna obveza"). Nijedna ćelija horizontalno ne
  prelijeva; duge labele se prelamaju u dva retka (isti kompromis kao PDF-ova
  vlastita tablica). Relevantno ako se ikad odluči prenijeti usporedbu na
  ekran — danas je takva tablica samo u PDF-u (`pdf.usporedba`, kredit).
- **`pdf.rezPdf` je snimka `pdfRez`-a prije dodavanja usporedbe modela
  otplate** (kredit, 20.8.2026). PDF prikazuje `rezPdf` pod "REZULTAT
  IZRAČUNA", mail i dalje dobiva puni `rez` (nedirano, i dalje isti pet
  redaka iz `7119b9d`) — bez ovoga bi PDF prikazao usporedbu dvaput, jednom
  kao plošne retke i jednom kao tablicu "USPOREDBA MODELA OTPLATE". `base()`
  ima `r.rezPdf = r.rezPdf || r.rez`, pa ostalih devet grana `buildPdf`-a
  ne treba dirati — nikad eksplicitno ne postavljaju `rezPdf`, pa im se
  prikaz uopće ne mijenja.
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
- **Skrol na vrh ide točno onda kad se promijeni vrijednost koju `_pathFor()`
  čita** — `tab`, `calcTab`, `pokKat`, `blogOpen` — dakle kad se stvarno
  mijenja URL. Promjena bilo kojeg drugog polja stanja (čip unutar kartice,
  podtab, filter, smjer, model otplate) NIKAD ne skrola, koliko god vizualno
  velika promjena bila.
  Prijašnja formulacija ("bez iznimke", uz nabrajanje "kategorije/podtaba") bila
  je izvor greške: `mirKat` i `projPort` su tretirani kao "podtab" po analogiji
  s `pokKat`, iako prvi ne mijenjaju rutu a `pokKat` mijenja. Provjera je
  mehanička: mijenja li kontrola `_pathFor()` izlaz.
  U kodu ne postoji nijedan link koji cilja određeni dio stranice (kotva/hash) -
  nema legitimnog razloga da bilo koja PRAVA navigacija ostavi korisnika usred
  stranice. `_onPopState` (natrag/naprijed) do 18.8. NIJE resetirao skrol -
  popravljeno dodavanjem istog `window.scrollTo(0,0)` + `resetHScroll()`
  poziva, i postavljanjem `history.scrollRestoration = 'manual'` u
  `componentDidMount()` da preglednikovo vlastito vraćanje skrol pozicije na
  popstate ne poništi taj reset asinkrono.
  Provjereno 19.8.2026: svih 16 mjesta koja mijenjaju rutu ispravno skaču;
  nijedno mjesto ne mijenja rutu bez reseta skrola. Uklonjen `scrollTo(0,0)` s
  pet mjesta koja rutu NISU mijenjala: `projTab`/`projPortChips`/`projPerChips`
  (projPort/projPer), `mirKat` (2. stup A/B/C), `vrstaF` (blog Sve/Video/Blog) -
  potonji radi konzistentnosti s `filter` (kategorija), koji nikad nije skakao.
  `resetHScroll()` OSTAJE na `projTab`/`projPortChips`/`projPerChips`: traka
  `data-seg="projport"` stvarno ima `overflow-x:auto`, a tablica "Svi
  portfelji" je `[data-hscroll]` (`min-width:640px`) - oboje se moraju vratiti
  na lijevi rub pri promjeni. Uklonjen je s `mirKat` (traka `data-seg="pok2"`
  nema `overflow-x`, ne može prijeći širinu) i s `vrstaF` (traka ima samo 3
  kratke oznake, `/blog` nema nijedan `[data-hscroll]`).
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
- **`/api/report` prihvaća SAMO whitelistane naslove i zatvorene obrasce
  vrijednosti** (`dec1d4a`). Bio je otvoreni mail relay: primatelj, subject i
  tijelo pod kontrolom pošiljatelja, bez autentikacije. Sad: `naslov` mora biti
  jedan od 10 iz `buildPdf` grana, svaka vrijednost mora proći jedan od
  obrazaca (eur, postotak, trajanje, datum, broj+riječ, euro s postotkom u
  zagradi, raspon dvaju iznosa sa strelicom, kratka oznaka), labele imaju
  vlastiti širi obrazac. Nijedan URL, `@` ni slobodna rečenica ne može doći u
  mail. Izračun se NE prenosi na server — mail i ekran ostaju na istom `pdf`
  objektu (6898), pa se brojke ne mogu razići.
- **PRAVILO: svaki novi red u `buildPdf` mora proći `report.js` validaciju.**
  Inače mail tiho pukne na 400 i korisnik dobije grešku bez objašnjenja. Ovo je
  već dvaput uhvaćeno u testu: `'Da, do 1.200 €'` (7091, bonus u kalkulatoru
  plaće) i `"667 € → 419 €"` (8482, model otplate "Rate") — oba su legitimni
  fiksni stringovi koje prvi obrasci nisu pokrivali. Šest labela sadrži `%` i
  zagrade (`"Doprinos I. stup, 15 %"`, `"Osobni odbitak (koeficijent 1,0)"`),
  zato labele imaju širi obrazac od vrijednosti. Treći par u projektu koji se
  mora držati usklađen bez mehanizma koji to jamči — kao `{CPI}` decimale i
  `TRZISTE` niz-kao-objekt.
- **`sazetak` više ne ide u mail.** Proza se ne može validirati (10 predložaka
  × ternari unutar svakog). Klijent ga i dalje šalje, server ga ignorira. Mail
  nosi `rez`/`male`/`param`. Ako se ikad vrati, treba mu vlastiti mehanizam.
- **`reply_to` u `contact.js` (153) NIJE ranjivost.** Primatelj je fiksan
  (`CONTACT_TO_EMAIL`), a adresa pošiljatelja je već vidljiva u tijelu maila
  prije nego odgovoriš. Ne dirati.
- **beehiiv koristi SCC, NE Data Privacy Framework.** Provjereno u beehiiv-ovom
  vlastitom DPA (SCC Module 2, Controller-to-Processor, Odluka Komisije
  2021/914). Ne pisati DPF u politici privatnosti — jedan sekundarni izvor to
  tvrdi, ali je u suprotnosti s njihovim pravnim dokumentom. Resend je
  drugačiji slučaj: tamo DPF stoji.
- **`aria-label` ne traži `sc-camel-` prefiks** — `support.js` ga propušta
  nepromijenjeno za obične DOM elemente (432-440). Prefiks postoji samo za
  pravu camelCase sintaksu bez crtice. Svih 76 polja obrasca ima `aria-label`
  izveden iz vidljivog labela; `id`/`for` parovi se NE koriste (tražili bi
  generiranje jedinstvenih id-eva, `aria-label` je dovoljan za dostupno ime).
- **Blog kartice koriste "stretched-link" obrazac, ne `<a>` oko cijele kartice.**
  Unutar kartice postoji YouTube `<a>` (aktivan na svim objavama), pa bi
  omotavanje dalo ugniježđeni `<a>` — nevažeći HTML. Rješenje: kartica ostaje
  `<div>` s `position:relative`, dobiva nevidljivi `<a href="/blog/<slug>">`
  preko cijele površine. **Oba trebaju eksplicitan `z-index`** — unutarnji div
  sa sličicom je `position:relative` i kasnije u DOM-u, pa bez toga prekriva
  overlay (otkriveno `elementFromPoint`-om, ne vidi se iz koda).
- **`otvoriLink` poziva `preventDefault()` SAMO kad nije pritisnut
  Cmd/Ctrl/Shift.** Bezuvjetni `preventDefault()` gasi otvaranje u novom tabu —
  točno funkciju radi koje je stretched-link i uveden.
- **`prenesi()` (refi → kredit) postavlja `kIzvor` u callbacku drugog
  `setState`**, ne u prvom. U prvom bi ga `componentDidUpdate` obrisao u istom
  ciklusu (reset lista, promjena `_calcIdent`), pa banner "Iz refinanciranja"
  nikad nije bio vidljiv. Reset lista i `_calcIdent` mehanizam su netaknuti —
  banner i dalje ispravno nestaje pri prelasku na treći kalkulator.
- **`faqGrupe` ima dvije grupe: "Pokazatelji" i "Kalkulatori".** Druga se puni
  iz `CALC_META[*].faq`. `FAQ` niz se NE mijenja jer se renderira i na
  naslovnici (9676); dva pitanja koja se preklapaju s `CALC_META` verzijama
  izostavljena su samo iz spoja. `CALC_META.faq` ne koristi tokene (statični
  brojčani primjeri u tekstu) — ako se ikad promijeni npr. stopa zdravstvenog
  doprinosa, ti primjeri se neće sami ažurirati.
- **Traka filtera vrste na `/blog` prikazuje se samo kad postoje obje vrste
  objava** — isti obrazac kao `imaKats`. Danas su sve objave video pa je traka
  skrivena; prvi tekstualni članak s `vrsta: 'blog'` je vraća automatski.
- **`visualViewport` korekcija za fiksnu traku** (`_onVVResize`,
  `--mob-rez-shift`, `data-mob-rez`, `_prevHasMobRez`): sluša `resize`/`scroll`
  i preračunava se pri montiranju trake. Na desktopu i Androidu je korekcija
  uvijek 0, dakle no-op. **NE rješava iOS bug iz §6** — provjereno na uređaju
  dvaput. Ne graditi na pretpostavci da radi.

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
- **`/api/report` bio otvoreni mail relay** (`dec1d4a`) — bilo kome, bilo
  kakav tekst, s verificirane domene. Rizik je bio suspenzija Resenda ili
  blacklist `onovcu.hr`, nakon čega prestaju raditi sve tri forme. Vidi §3.
- **`image-slot.js` obrisan** (`701036a`) — 1225 linija, 64 KB, nula referenci,
  ali se deployao i bio javno čitljiv na `onovcu.hr/image-slot.js`, uz interne
  detalje razvojnog alata u komentarima. README.md ispravljen.
- **Politika privatnosti tvrdila dvije neistine** (`701036a`) — pohranu teme u
  pregledniku (`localStorage` = 0 pojava) i obradu newslettera unutar EGP-a
  (beehiiv je američki). Oboje ispravljeno.
- **Lažna potvrda uspjeha na sve tri forme** (`d280f9f`) — `t0` s korisnikovog
  sata; pomaknut sat naprijed davao je 200 bez slanja maila uz punu potvrdu.
- **Rate limit se sam produžavao** (`d280f9f`) — odbijeni zahtjev je pomicao
  prozor.
- **Privola za newsletter nije se bilježila serverski** (`d280f9f`).
- **`null` se prikazivao kao nula u Pokazateljima** (`e31b8fb`) —
  `isFinite(null) === true`. Promjena kroz razdoblje za gotovinske kredite bila
  je +5,42 pp umjesto −0,06 pp; medijan plaće 0,00 € dok je tekst dva reda
  iznad govorio da nije riječ o nuli.
- **`/cesta-pitanja` prikazivala samo pola pitanja** (`a5c2516`) — 24 od 50.
  Nedovršena implementacija, ne urednička odluka.
- **Meta, rute, klizači, meni, `_syncUrl`** (`285ea67`) —
  `/kalkulatori/povijest` nasljeđivao naslov kalkulatora plaće; čip "Mediji"
  slao temu "Sponzorstvo"; `/kalkulatori` tiho otvarao plaću; `pokOd/pokDo` bez
  uparivanja; mobilni meni ostajao otvoren na Natrag; četiri putanje
  preskakale `_syncUrl`/skrol.
- **Pristupačnost** (`96dd7d4`) — 76 polja bez dostupnog imena, blog kartice
  bez `href`.

### Riješeno 19. 8. 2026.
- **`ZADNJE_HZMO` odvojen od `ZADNJE_HANFA`** (`64029a6`). HZMO (1. stup) i
  HANFA (2./3. stup) su različite institucije s vlastitim kalendarima; to što
  danas nose istu vrijednost je slučajnost. `STUP1.mirovina40Mjesec` je treća,
  neovisna vrijednost. Obrisan mrtvi kod (`STUP3.razdoblje`, `mjHnb`,
  `mjPlace`, `mjHanfa`).
- **HPI izračuni miješali tromjesečno očitanje s godišnjim prosjekom**
  (`e445976`, `205a75e`). Tooltip je pokazivao 10,9 % dok kartica pokazuje
  14,3 %, a "Ukupni rast", "Prosjek godišnje" i "kupiš X m²" bili su
  kontaminirani u ZADANOM prikazu. Uveden `HPI_PUNE` — zadnji redak ostaje
  kao podatak ali ne ulazi u aritmetiku. Tekst prepisan: 115,6 % i 23,2 m²
  za 2015.–2025., "danas" zamijenjeno stvarnom godinom.
- **Tablica `SEKTORI` uklonjena** (`ed23250`) — od 21 vrijednosti samo 2 su
  bile objavljene, 1 u izravnoj suprotnosti s izvorom (farmaceutska
  proizvodnja 4.281 € nasuprot DZS-ovom izričitom maksimumu od 2.364 €), 18
  bez izvora. Miješala je dvije razine NKD klasifikacije, a prikazivala se
  pod "Izvor: DZS, statistika plaća".
- **Blok "Aktivnost tržišta" (`NEK_AKT`) uklonjen** (`a4ca504`) — nijedna od
  8 provjerenih vrijednosti nije odgovarala izvoru. Kupoprodaje 79–87 %
  previsoke (36.400 nasuprot 20.293 stanova), a smjer OBRNUT: portal je
  prikazivao rast dok je tržište palo 21,7 % (2025.) i 9,7 % (2024.).
  Zamijenjeno karticom sa stopama promjene iz DZS priopćenja (−42,2 % broj,
  −35,4 % vrijednost) i kvartalnim rastom 3,3 %.

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
  **Chrome dodatno prikazuje 2 upozorenja (warning, ne error) koje Safari ne
  pokazuje**: `index.html:1062` i `1066` — `<input type="date">` s
  `{{ ikIsplata }}`/`{{ ikPrvi }}` placeholderom u `value` atributu, "ne
  odgovara formatu yyyy-MM-dd". Ista klasa problema kao SVG placeholderi
  (predložak u sirovom HTML-u, parsiran prije hidracije). Polja rade ispravno.
  **Ukupno u Chromeu: 8 grešaka + 2 upozorenja.** Safari grupira drugačije —
  prikazuje 6 grešaka za istu stvar, ne 8.
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
- **Rate limit u `api/*` je slab i to je svjesno prihvaćeno.** In-memory `Map`
  ne preživljava hladne startove ni više instanci, pa limit 5/10min po IP-u
  praktično ne postoji. Pravi popravak traži dijeljeno stanje (KV/Upstash) što
  bi uvelo novog izvršitelja obrade i izmjenu politike privatnosti. Provjeriti
  ima li Vercel Hobby platformski rate limit — to bi bilo rješenje bez koda.
- **Rate limit se sam produžuje**: `arr.push(now)` je izvan grane pa i odbijeni
  zahtjev pomiče prozor. Korisnik koji pritišće "Pokušaj ponovno" drži se u
  blokadi. Ide u prolaz 2.
- **62 gumba s `tabindex="-1"` bez zamjenske tipkovničke navigacije.** Uzorak
  je uobičajen kod segmentiranih kontrola kad postoji roving tabindex s
  upravljanjem strelicama — ovdje ga nema, pa su te kontrole izvan tab reda.
  Uključuje "Izvoz u Excel" (jedini način preuzimanja otplatnog plana) i
  zatvaranje mail modala (koje nema ni Escape handler). Posljedica vizualnog
  buildera; ide s migracijom.
- **Skala grafa inflacije: pozitivna i negativna zona nisu na istoj skali**
  (8047-8052, i 7886-7892 u kalkulatoru povijesti). −1,1 % izgleda kao ~35 %
  stupca od +10,8 %, a stvarno je 10 %. Predznaci i tooltipovi su ispravni,
  pogrešan je samo vizualni odnos.
- **"Indeks 100 → X" protuslovi vlastitom grafu** (3607). Za "Od 2010." traka
  tvrdi 100 → 204,9, tooltipovi pokazuju DZS skalu 116,7 → 239,1, opis kartice
  tvrdi bazu 2015. Zadano (Od 2015.) se slučajno poklapa.
- **58 handlera u `on:` bez reference u predlošku**, od toga ~40 `*S` za
  slidere kojih više nema. Plus 5 nekorištenih tokena u `faqTokens`, mrtvi
  `schedule()`, `mirScenView`, i ~40 mrtvih ključeva u objektima koje
  `renderVals` vraća. Puni popis u `AUDIT-2026-08-18.md` §E.
- **Rate limit off-by-one**: propušta 6 zahtjeva prije blokade, ne 5.
- **`syncSegs` prebojava aktivni čip i nikad ne vrati boju** (6517). Nakon PDF
  print pregleda aktivni čip može ostati crven na crvenom do prve promjene
  čipa.

  Uzrok utvrđen 19.8.2026: kad `@media print` postavi `main` na
  `display:none`, aktivni čip ima `offsetWidth === 0`, pa grana `if (w <= 0)`
  postavi boju na `var(--acc)` kao fallback i nikad je ne vrati kad se `main`
  vrati. Reproducirano na `/kalkulatori/kredit`, sve četiri `[data-seg]` trake
  (calc, calcsub, kmod, ktip) — aktivni čip ostaje crven na crvenom,
  nečitljiv. Indikatori ostaju ispravni.

  **Popravljeno 20.8.2026.** `syncSegs()` je dobio `else` granu: čim
  pokazivač ponovno ima širinu, boja se eksplicitno vraća na `'#FFF'` (jedina
  moguća boja za aktivan čip). Pravi uzrok nije bio "poziva se u krivom
  trenutku" nego da grana nikad nije imala povratni put. Potvrđeno uživo na
  `/kalkulatori/kredit` (sve četiri trake), `/kalkulatori/placa` i
  `/pokazatelji` — nije vezano uz jedan kalkulator.

  Dio je šireg problema: **zatvaranje PDF pregleda ne obnavlja stanje
  stranice.** Drugi simptom, potvrđen na desktopu: nakon zatvaranja pregleda
  sadržaj se prekida i ispod ostaje prazan prostor do dna, a desna kolona je
  odsječena. `pdfClose` sad (20.8.2026) dispatcha sintetički `resize` event
  nakon zatvaranja kao protumjera — ali **taj drugi simptom NIJE reproduciran
  u testnom okruženju ni u jednoj varijanti** (1440px, 700px s aktivnim
  `zoom`-om na `.on-pdf-sheet`, simuliran `@media print` prijelaz), pa učinak
  protumjere na njega ostaje nepotvrđen. Ne tretirati kao riješeno dok se ne
  potvrdi na stvarnom pregledniku.

  Napomena o testiranju: `window.print()` blokira headless preglednik nativnim
  dijalogom, pa se CSS posljedica mora simulirati. Konačna potvrda popravka
  traži stvarni preglednik.
- **`<input type="email">` sam obrezuje razmake** po WHATWG specifikaciji,
  prije nego JS vidi vrijednost. Trim u tri forme (`d280f9f`) je dodan radi
  dosljednosti s `posaljiIzvjestaj`, ne zato što je rupa bila iskoristiva.

### iOS-specifično — ne može se reproducirati u Chromeu
Auto-zoom na inpute, ponašanje visual viewporta pri tipkovnici, `height:100%`
obrada. Testirati na pravom uređaju.

---

## 6. Otvorene stavke

### Prije lansiranja
- [x] PDF pregled — cijeli list stane u širinu ekrana na mobilnom (CSS `zoom`, vidi §3)
- [x] Dinamički naslovi i description po ruti (svih 30 URL-ova + og:/twitter:, vidi §3)
- [x] **Funkcionalna provjera cijele stranice** (što izgleda da radi a ne radi) —
      odrađena kao `AUDIT-2026-08-18.md` (89 nalaza). Popravljeno danas:
      sigurnosna blokada, lažna potvrda formi, netočni podaci, FAQ spoj,
      meta/rute/klizači, pristupačnost. Preostalo je zapisano u §5 "Poznato,
      namjerno neriješeno" i §6 "Poslije lansiranja".
- [ ] Layout provjera cijele stranice na 430px
- [ ] **Fiksna traka s rezultatom sjedne usred ekrana na iOS-u.** Pojavi se
      preko sadržaja kad se prvi put montira DOK je tipkovnica otvorena; nakon
      zatvaranja i ponovnog otvaranja je ispravno na dnu. Reproducirano na
      Kredit → Refinanciranje (iPhone 16 Pro Max, Safari).
      **Dva pokušaja popravka nisu uspjela** (`9fea78f`, `20b6328`), iako oba
      prolaze u simulaciji. Ostavljeni su u kodu jer je `visualViewport`
      logika sama po sebi ispravna i pokriva promjene viewporta — ali stvarni
      scenarij i dalje pada. Sljedeći pokušaj traži novu hipotezu, ne varijaciju
      postojeće. Prihvaćeno kao poznato za lansiranje: traka se ispravno
      postavi čim se tipkovnica zatvori.
- [x] **Cmd/Ctrl-klik na blog karticu otvara novi tab** — potvrđeno na uređaju.
- [x] **Tab tipkom do blog kartice, Enter otvara članak** — potvrđeno na uređaju.
- [x] Provjera da logika izračuna nije dotaknuta: `git diff 580b606 HEAD -- index.html` —
      provedeno, nijedna formula nije dirana kroz 41 commit koji dira
      `index.html` i 2.013 promijenjenih redaka (1.217 dodanih, 796 obrisanih).
      Promjene u izračunu su bile isključivo prikaz: redak "Grad ili općina" u
      PDF-u, decimala u oznaci stope, labele u KOSARICA sažetku ("zbroj
      doprinosa" umjesto "ukupna inflacija" gdje je bilo dvosmisleno).
      Konstante netaknute: pragovi, doprinosi 15/5/16,5 %, osobni odbitak,
      koeficijenti, 365 dana.
- [x] **Provjera izvora i točnosti svih podataka u Pokazateljima.**
      Interna konzistentnost popravljena (`d71eb73`), točnost provjerena prema
      DZS / HNB / HZMO / HANFA / MPGI — 12 od 13 provjerivih brojki bilo je
      točno. Rast cijena nekretnina ispravljen s 11,0 % na 14,3 % (`1d74c37`).
      Tablica cijena po m² po gradovima uklonjena umjesto ispravljanja
      (`4ffd793`) — nije imala potvrdiv izvor. Banner za Nekretnine sad kaže
      "Indeks cijena: prvo tromjesečje 2026." jer kategorija ima tri razdoblja.
      **Svi izvori, linkovi i ritam objava zapisani su u `IZVORI.md`** — prije
      svake buduće izmjene brojke otvoriti link odande.
- [x] **Stopa za Oroslavje u kalkulatoru plaće (`GRADOVI`) — riješeno (`1b7d82c`).**
      Službena tablica Porezne uprave za 2026. navodi Oroslavje kao
      `OROSLAVJE*` — jedini naziv u 592 retka sa zvjezdicom, bez legende koja
      objašnjava što ona znači. Odluka Grada Oroslavja objavljena u NN
      152/2023 (na snazi od 1.1.2024.) navodi nižu stopu **18,0 %**; službena
      zbirna tablica i naša konstanta imaju **20,0 %**. Iz dostupnih izvora
      (Zagorje.com, Radio Stubica) ta odluka gradskog vijeća bila je
      politički/pravno sporna — gradonačelnik ju je smatrao nezakonitom
      (nedostajalo javno savjetovanje, pogrešan predlagatelj); ishod spora
      nije potvrđen. **Odluka: 20/30 ostaje, zvjezdica uklonjena iz naziva.**
      Portal slijedi propisani primarni izvor (zbirna tablica Porezne
      uprave) i ne ispravlja ga vlastitim čitanjem NN-a — isti princip kao
      kod HNB revizija (vidi §3). Obrazloženje uz sam unos u `GRADOVI`, izvor
      i poveznice u `IZVORI.md`, odjeljak "JLS stope poreza na dohodak".
- [x] beehiiv i EGP u politici privatnosti — ispravljeno (`701036a`)
- [x] **InterCapital disclosure u sekciji Projekti — provedeno (`89b4175`).**
      Dodan u karticu "Investiram svaki mjesec", nakon opisa četiriju
      portfelja i prije grafa i brojki, kako §7 propisuje. Diskretan stil:
      `border-left:2px solid var(--line2)`, `font-size:12.5px`,
      `color:var(--soft)`, bez pozadine — potvrđeno da ne izgleda kao alert.
      Tekst usklađen s §7 istim commitom.
- [x] **`"O novcu"` u navodnike na naslovnici — provedeno (`89b4175`).**
      Primijenjeno SAMO u hero tekstu (dva odlomka ispod naslova "Novac nije
      kompliciran."), hrvatskim niskim-visokim navodnicima „..." — isti par
      koji projekt već koristi na 42 druga mjesta (npr. „Spremi kao PDF").
      Logotip, meta/og/JSON-LD i sve ostale sekcije nedirani.
- [ ] Provjera sitemapa i svih ruta
- [x] **Finalni test svih formi.** Testirano na produkciji 18.8.2026. sa
      stvarnim Resendom: kontakt, Mediji (tema ispravna), B2B, izvještaj
      kredita (anuiteti i rate), izvještaj plaće (bonus), newsletter s
      privolom i bez. Svi mailovi dostavljeni, sažetak ispravno izostavljen iz
      izvještaja.
- [x] **Odabrana tema se pamti** (`localStorage`, ključ `on-tema`).
      Primjenjuje se inline skriptom u `<head>` prije prvog rendera, pa nema
      bljeska svijetle teme — dokazano tako da se tema ispravno postavi čak i
      kad `support.js` potpuno padne (HTTP 500, React se nikad ne montira).
      Bez ranijeg izbora poštuje `prefers-color-scheme`. Kad `localStorage`
      nije dostupan (privatni tab), tema se mijenja ali se ne pamti, bez
      greške. Politika privatnosti dopunjena istim commitom.
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
- [ ] **Privola u beehiiv kao `custom_field`.** Serverska provjera radi
      (`d280f9f`), ali privola se ne zapisuje u beehiiv. Traži ručno kreiranje
      polja u beehiiv dashboardu prije nego kod može poslati `custom_fields`.
- [ ] **Rate limit s dijeljenim stanjem.** In-memory `Map` ne preživljava
      hladne startove. Provjeriti ima li Vercel Hobby platformski rate limit —
      to bi bilo rješenje bez koda i bez novog izvršitelja obrade.
- [ ] **Prava 404 stranica.** Soft-404 na dvosegmentnim rutama vraća 200 s
      djelomičnim sadržajem — loše za korisnika i za indeksiranje. Vidi §5.
- [ ] **Neovisno otvaranje FAQ-a po grupi.** `faqSveOpen` je jedna dijeljena
      vrijednost, pa je samo jedno pitanje otvoreno na cijeloj stranici.

### Sporedno
- Domena `onovcu.hr` istječe **13. 11. 2026.** (registrar: Hrvatski Telekom /
  Regica.net, DNS: Cloudflare)
- Mail na domeni ide preko **iCloud Custom Email Domain** — Resend koristi
  subdomenu `send`, nema konflikta sa SPF-om
- iCloud **tiho odbacuje** mailove (Delivered u Resendu, ali nema ih ni u spamu).
  Zato postoji BCC.

---

## 7. InterCapital disclosure — tekst

**Provedeno (`89b4175`)** — vidi §6. Ide u sekciju Projekti, unutar kartice
"Investiram svaki mjesec", **nakon** opisa četiriju portfelja i **prije** grafa
i brojki. Diskretno izdvojeno (sivi okvir ili tanka linija lijevo), manji font,
neutralne boje, **ne** stil alerta.

> Dugogodišnji sam zaposlenik InterCapitala i trenutačno Growth Strategist u
> Geniusu. Ni ovaj prikaz ni ijedna objava o Geniusu nisu plaćeni oglas ni
> suradnja.

---

## 8. Radni proces

- **Nikad ne commitati bez potvrde.** Nikad ne pushati bez izričitog odobrenja.
- **Nalaz prvo, izmjena poslije** kod svega što nije trivijalno.
- **Odvojeni commitovi** za izmjene koje diraju temeljni layout.
- **Regresijska provjera na desktopu** (1024/1440/1920px) nakon svake layout izmjene.
- Git remote: SSH (`git@github.com:onovcu-svg/moja-stranica.git`).
  Autor: `Marko Bogdan <kontakt@onovcu.hr>`.
- Testiranje isključivo na Vercel URL-u. **Ne** na GitHub Pages (ugašen).
