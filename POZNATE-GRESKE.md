# POZNATE-GRESKE.md

Sve otvoreno na jednom mjestu. Grupirano po tome **što korisnik vidi**, ne po
tome gdje je zapisano.

Stanje: 15. 9. 2026. Provjereno protiv koda.

Izvori: `NOTES.md` §5 i §6, `AUDIT-2026-08-18.md`, `AUDIT-BROJKE-2026-09-04.md`.
Stavke koje su u međuvremenu riješene **nisu** ovdje.

---

# 1. Korisnik vidi

## Ne radi

**Filter „Blog" na `/blog` daje praznu stranicu.**
Dva od tri filtera su neispravna. Traka se danas ne prikazuje jer nema objava
tipa blog, ali čim prva stigne, filter puca.
*Rješivo odmah.*

**Banner „Iz refinanciranja" i njegova dva gumba nikad se ne vide.**
Uvjet za prikaz nikad nije zadovoljen.
*Rješivo odmah.*

**Gumb × „Ukloni uplatu" ne radi u početnom stanju.**
*Rješivo odmah.*

**Odabir modula na `/edukacija` je mrtav.**
Klik ne mijenja ništa.
*Rješivo odmah.*

## Prikazuje krivo

**`{PL_MEDIJAN}`, `{PL_PROSJEK}` i `{PL_RAZLIKA}` čitaju korisnikov odabir
raspona, ne zadnji objavljeni podatak.**
Curi na `/cesta-pitanja` — ako korisnik pomakne klizač na Pokazateljima, FAQ
odgovor se mijenja.
*Rješivo odmah.*

**Graf inflacije: pozitivna i negativna zona nisu na istoj skali.**
Vidljivo u zadanom prikazu.
*Rješivo odmah.*

**„Indeks 100 → X" protuslovi vlastitom grafu.**
*Rješivo odmah. Provjeriti je li još aktualno nakon zamjene `HPI_GOD`.*

**`osLbl` bezuvjetno briše predzadnju oznaku na osi.**
*Rješivo odmah.*

**Dva nesinkronizirana broja pretplatnika** — 48.300 i 44.908 kao dva fallbacka.
*Rješivo odmah.*

**`pokFaqOpen` prenosi otvorenu FAQ stavku između kategorija** s različitim
brojem pitanja.
*Rješivo odmah.*

**Klizači razdoblja ne resetiraju hover svog grafa.**
*Rješivo odmah.*

**Zarada i vrijednost portfelja: kartica ima dvije decimale, graf i tooltip
nula.**
Nije utvrđeno je li svjesna odluka.
*Rješivo odmah.*

## Rubni slučajevi

**Prethodno odjavljena adresa ne može se ponovno prijaviti, ali dobiva potvrdu
uspjeha.**
*Srednja pouzdanost — nije reproducirano uživo.*

**Zatvaranje PDF pregleda ne obnavlja layout.**
Prijavljeno na desktopu, popravak `pdfClose` nije dokazano riješio. Nakon
popravka se nije ponovio.
*Nepotvrđeno.*

**Datalist popup nečitljiv u macOS Safariju.**
Kad se popis suzi na dva prijedloga ili manje. Chrome radi, iOS Safari ne
koristi popup. Sve pod kontrolom stranice je čisto — popup je native i ne može
se stilizirati.
*Rješenje: zamjena prilagođenom listom, oko pola dana. Odgođeno svjesno.*

**Fiksna traka s rezultatom sjedne usred ekrana na iOS-u**, kad je tipkovnica
otvorena pri prvom montiranju.
Dva pokušaja popravka prošla u simulaciji, pala na uređaju. Traka se ispravno
postavi čim se tipkovnica zatvori.
*Reproducirano na iPhoneu. Prihvaćeno kao poznato.*

## Nepotpuno

**`sekcije` ne stižu u mail.** Jedanaest potvrđenih slučajeva — detalji
prijelaza na kombiniranu stopu, prijevremena otplata, interkalarna kamata,
godišnji iznosi plaće, faza isplate, „gdje si u otplati" i drugo.
Korisnik uključi opciju jer ga zanima, pošalje si izvještaj, i ne dobije je.
*Jedna izmjena rješava svih jedanaest, ali dira `report.js` — kod koji je bio
otvoreni mail relay.*

**`/projekti` je zastario ~27 dana.** Zadnji unos 19. 8.
*Čeka Markovo očitanje stanja.*

---

# 2. Šteti SEO-u i AI dohvatu

**Nema prave 404.** Nepostojeće dvosegmentne rute vraćaju 200 s djelomičnim
sadržajem. Tražilice to tretiraju kao soft-404.
*Djelomično rješivo odmah, potpuno čeka SSR.*

**Gotovo nema internih `<a href>`.** Blog kartice su dobile prave poveznice,
ali zaglavlje, podnožje, mobilni izbornik i kartice na hubu i dalje su
`<button>` s JavaScriptom. Tražilica ne može slijediti navigaciju.
*Čeka migraciju.*

**`BlogPosting` shema po članku ne postoji.** U statičkom `<head>` bila bi
prisutna na svakoj ruti, što Google tretira kao obmanjujuće strukturirane
podatke — kazna gasi rich results za cijelu domenu.
*Arhitektonski nemoguće bez SSR-a.*

**Nema poslužiteljskog renderiranja.** Sadržaj postoji tek nakon izvršavanja
JavaScripta. Googlebot ga vidi, dio AI crawlera ne.
*Čeka migraciju.*

---

# 3. Pristupačnost

**62 gumba s `tabindex="-1"`**, bez roving tabindex ili navigacije strelicama.
Korisnik tipkovnice ne može doseći dio sučelja.
*Posljedica vizualnog buildera. Čeka migraciju.*

---

# 4. Sigurnost i infrastruktura

**Rate limit propušta šest zahtjeva umjesto pet.** Off-by-one, identičan na sve
tri rute.
*Rješivo odmah.*

**Rate limit je in-memory `Map`** i ne preživljava hladan start. Na Vercelu to
znači da se brojač resetira nepredvidivo.
*Rješivo odmah kroz KV ili Upstash. Svjesno prihvaćeno.*

**`kSlobodno` nema gornju granicu.** Gumb „Dodaj još jednu uplatu" može se
klikati neograničeno. Zaštita je samo vizualna.
*Zaobiđeno sažimanjem u izvještaju, ali granica i dalje ne postoji.*

**Privola za newsletter ne zapisuje se u beehiiv.** Serverska provjera radi,
ali `custom_field` traži ručno kreiranje polja u beehiiv dashboardu.
*Rješivo odmah, uz ručni korak.*

---

# 5. Unutarnji dug

Ne vidi se izvana, ali otežava rad.

**Osam grešaka u konzoli na svakom učitavanju** — `{{ }}` u SVG atributima,
prije hidracije. Runtime ih prepiše ispravnim vrijednostima.
*Čeka migraciju.*

**`TRZISTE` je hardkodiran**, `marketApiUrl` nikad spojen.

**`tz()` i ticker čitaju dva različita izvora.** Latentno — aktivira se tek ako
se `marketApiUrl` spoji.

**`POK_KAT.nekretnine.graf.key` i `krediti.graf.key` oba su `'stambeni'`.**
Uspavano jer je `imaGraf: false`.

**Mrtav kod koji je ostao:**
- `ct` i `gModeChips` — grade se preko `seg()`, nikad ne renderiraju. Stvarni
  tab-stripovi koriste paralelne inline objekte.
- `on.goPlaca` i sedam srodnih handlera — funkcionalni skokovi na drugi
  kalkulator, nikad zakačeni. `goHome` i `goHub` istog obrasca jesu spojeni.
- oko 40 `*S` slidera, `mirScenView`, `schedule()`
- `trzistePotpis`, `PORTFELJI.meta[*].start`, `ZIGOVI`, `MODULI[*].trajanje`
- `mailEndpoint` prop, `NASTUPI` prazna konstanta, `defaultTab` mrtav enum
- rupe u reset listi: `mailSlanje`, `editKey`/`editTxt`, `kamoHover`,
  `placaHover`, `gh`
- honeypot mrtav `value` binding — zaštita radi, binding je kozmetički mrtav
- „kamo ide plaća" pod-blok dupliciran s `kamo`/`placaDonut`

**Pet `KS_*` nizova se ažurira iako se ne prikazuje.** Svjesna odluka — dijele
duljinu preko `KS_MJ`.

---

# 6. Dokumentacija i procesi

**`STUP2_B_ISPOD55` nema datiran zapis provjere u `IZVORI.md`**, iako se
aktivno prikazuje.

**`PORTFELJI.meta[3].start` ne slaže se sa stvarnim prvim retkom** za Luciju —
18. 8. naspram 20. 8. Ne prikazuje se, ali je neusklađeno.

**Više brojki bez navedenog izvora** — FAQ na naslovnici, „18+ godina
iskustva", „50 m²" kao ilustrativna pretpostavka na nekretninama.

**`PLACE_GOD` treba jednom godišnje provjeru** protiv konačnih DZS objava.
Isto za `CPI` — stopa za 2025. bila je upisana kao 3,6 % umjesto 3,7 % i stajala
je mjesecima.

---

# 7. Svjesne odluke, ne greške

Ovdje su da se ne prijavljuju ponovno.

**Kalkulator ulaganja koristi proporcionalni obračun** (`godišnja ÷ 12`), ne
konformni. Razlika je oko 2,6 % kroz 20 godina, u smjeru optimističnijeg
rezultata. Metoda je navedena u PDF-u za sva tri moda.

**Ilustrativne brojke koje se ne ažuriraju:** `CALC_META.kredit.faq[0]`
(6,25 % za nenamjenski), `CALC_META.zatvoriti.savjet` (6 %), „oko 4,5 % nakon
inflacije".

**Boje grafova koje koriste istu nijansu kao pomoćni tekst** (8877, 9372, 9488)
namjerno nisu mijenjane pri kontrast-popravku — kategorijalna boja isječka nije
tekst.

**`refi`, `opcije` i `zatvoriti` namjerno su izvan sitemapa** — tretiraju se kao
pod-scenariji kreditnog kalkulatora. Vrijedi preispitati.

**Vercel Hobby plan** — provjereno da uvjeti dopuštaju ovakvu upotrebu.

---

# Što bi prvo rješavao

Ako se vraćaš nakon pauze i ne znaš odakle:

1. **Filter „Blog"** — puca čim objaviš prvi tekstualni članak
2. **`{PL_*}` tokeni na `/cesta-pitanja`** — prikazuju krivu brojku ovisno o
   tome što je korisnik radio drugdje
3. **Rate limit off-by-one** — jedna linija
4. **`sekcije` u mail** — najveći dobitak za korisnika, ali dira osjetljiv kod
5. **Migracija na build** — otključava SSR, 404, `BlogPosting`, interne
   poveznice i pristupačnost odjednom

Sve ostalo može čekati.
