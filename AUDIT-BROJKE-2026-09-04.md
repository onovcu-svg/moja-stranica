# NALAZ: sve brojke koje portal O novcu prikazuje korisniku

Datum nalaza: **4. 9. 2026.** Prethodni popis: 21. 8. 2026. (zastario — od tada ažurirani
plaće/mirovine/mirovinski fondovi/kamatne stope, vidi niže).

**Bez izmjene koda. Ništa nije commitano.**

Metodologija: šest paralelnih prolaza kroz `index.html` (~10.632 linija), po ruti/sekciji,
svaka brojka izračunata iz stvarnog render-koda (ne procijenjena), formatirana prema
`nf()`/`eur()`/`pct()` (hr-HR lokal, zarez decimalni). Usporedba **NOVO** rađena protiv
`IZVORI.md` (zadnji potpun zapis 21.8.2026., djelomični zapisi do 1.9.2026.) i `NOTES.md` §5
("Riješeno 29.8.–1.9.2026."). Isključeno po zadatku: rezultati kalkulatora (ovise o unosu),
brojevi stranica.

**Poznato ažurirano između 21.8. i 1.9.2026. (izvor: NOTES.md §5, IZVORI.md):**
- Plaće (DZS, lipanj 2026.): **1.555 € / 2.184 € / 1.345 € / 1.850 €** — vrijednosti su bile
  iste već 21.8.2026. po IZVORI.md, ali `TRZISTE.placaProsjek.prev` je popravljen (bio jednak
  `val`-u, sad 1552) → **ticker strelica/delta je novo ponašanje**, sam broj nije nov.
- Mirovine (HZMO, srpanj 2026.): **722,01 €** (bilo 721,73 €), udjeli **46,43 % / 56,57 %**
  (bilo 46,50 % / 56,65 %), **879,69 €** (bilo 879,28 €) — **NOVO** svugdje gdje se pojave.
- HNB kamatne stope (srpanj 2026.): stambeni **2,91 % / EKS 3,27 %** (bilo 2,90 %/~3,25 %),
  gotovinski **5,39 % / EKS 5,71 %** (bilo 5,42 %), novi stambeni **370,46 mil €** (bilo
  316,59 mil €), gotovinski **449,0 mil €** — **NOVO** svugdje gdje se pojave.
- Mirovinski fondovi (HANFA): trenutne vrijednosti u kodu (B 73,51 %, A 23,45 %, C 3,04 %)
  odgovaraju IZVORI.md zapisu od **21.8.2026.**, nema kasnijeg zapisa provjere — dakle **NE
  računa se kao promjena unutar ovog perioda** (nalaz niže objašnjava zašto ipak vrijedi
  napomenuti kao "provjera bez novijeg datuma").

---

## 1. Naslovnica ("/")

| Vrijednost | Gdje | Izvor i razdoblje |
|---|---|---|
| **3,9 %** ▼ „0,60 pp od prošlog mjeseca" | Ticker, stavka 1/5 · `index.html:232-244`, `TRZISTE[0]:5562` | DZS, „Indeksi potrošačkih cijena", srpanj 2026. |
| **1.555 €** ▲ „3 € od prošlog mjeseca" (**0 decimala** — vidi nalaz o formatu niže) | Ticker, stavka 2/5 · `TRZISTE[1]:5563` | DZS, lipanj 2026. |
| **722,01 €** → „bez promjene" | Ticker, stavka 3/5 · `TRZISTE[2]:5564` | HZMO, srpanj 2026. — **NOVO** |
| **2,91 %** ▲ „0,01 pp od prošlog mjeseca" | Ticker, stavka 4/5 · `TRZISTE[3]:5565` | HNB, Tablica G2, srpanj 2026. — **NOVO** |
| **14,3 %** ▲ „4,10 pp od prošlog tromjesečja" | Ticker, stavka 5/5 · `TRZISTE[4]:5566` | DZS, indeks cijena nekretnina, I. tromj. 2026. |
| Broj pretplatnika YouTube (live dohvat s `/api/yt-subs`; fallback prop **„44.908"**) | Hero, "Najnoviji video" · `:394`, izračun `:9239` | Live YouTube Data API — nije statička brojka |
| Tooltip "9 gradova", "Karlovac, 49.594 stanovnika" (za fallback 44.908) | Hero, tooltip uz broj pretplatnika · `:401`, `GRADOVI_POP:5578` | DZS, Popis stanovništva 2021. |
| „40-ak posto" (razlika bruto→neto, u opisu videa) | Hero, opis najnovijeg videa · `:367`, `OBJAVE[0].opis:5500` | Bez izvora — prozni tekst |
| „18+ godina iskustva" | Hero/bio | Bez izvora — biografska tvrdnja |
| FAQ (4 pitanja, ista kao na `/cesta-pitanja` minus 2 filtrirana): **15 %, 5 %, 600,00 €, 5.000,00 €, 16,5 %, 3,9 %, 10.000,00 €, 6.820,94 €** | FAQ sekcija na naslovnici · `FAQ:5569-5574` | Vidi §8 — potpuno preklapanje s /cesta-pitanja |
| „© 2026" | Footer · `:4294` | Statički literal, ne generiran |

**Nalazi specifični za ovu rutu:**
- **Ticker plaća prikazuje "1.555 €" bez decimala** dok je SVUGDJE drugdje na portalu ista
  brojka "1.555,00 €" (2 decimale) — `TRZISTE[1]:5563` nema `dec:2` polje (mirovina ga ima,
  `dec:2` na `:5564`). Vjerojatan propust prilikom dodavanja polja `dec`. Vidi §9.
- **JSON-LD FAQPage (`<head>`, :186-189) piše "600 €"/"5.000 €"/"10.000 €" bez decimala**,
  dok vidljivi FAQ ispod (`:5570,5573`) piše "600,00 €"/"5.000,00 €"/"10.000,00 €" — **potvrđen
  još otvoren nalaz iz NOTES.md §6.**
- `trzistePotpis` (`:10231`) izračunat ali se nigdje ne koristi u JSX-u — mrtav kod.
- `MODULI` (7 modula edukacije) **ne prikazuje se na naslovnici** — to je `/edukacija` (`isB2b`).

---

## 2. /pokazatelji/inflacija

| Vrijednost | Gdje | Izvor i razdoblje |
|---|---|---|
| „srpanj 2026." | Banner "Zadnje ažuriranje" · `:3053`, `ZADNJE_RAZDOBLJE:6120` | DZS |
| „HNB · DZS · HZMO · HANFA" | Banner "Izvori" · `:3055`, `pokIzvori:10065` | **Nefiltrirano** — isti tekst na svih 5 `/pokazatelji/*` ruta bez obzira na kategoriju |
| **3,9 %**, „košarica... danas košta 103,90 €" | Sažetak (bluf) · `:3072`, `POK_KAT.inflacija.bluf:5750` | DZS, srpanj 2026. |
| **3,9 %** / „Godišnja stopa inflacije" / „CPI · srpanj 2026." | Kartica 1/4 · `:3076-3086`, `5752` | DZS, srpanj 2026. |
| **32,7 %** / „Kumulativna inflacija, 5 g." / „danas 100 € = 75,37 € u 2021." | Kartica 2/4 · `kum5:8596-8599` | Izvedeno iz `CPI` 2022-2026 |
| **40,9 %** / „Kumulativna inflacija, 10 g." / „danas 100 € = 70,95 € u 2016." | Kartica 3/4 · `kum10:8596-8600` | Izvedeno iz `CPI` 2017-2026 |
| **−0,2 %** / „Mjesečna promjena cijena" / „CPI · srpanj / lipanj 2026." — **hardkodiran literal, ne token** | Kartica 4/4 · `:5758` | DZS, srpanj/lipanj 2026. |
| Graf: 17 stupaca 2010.–2026. po godini, tooltip s pravim postotkom | Graf · `:3672-3688`, `povChart:8580-8588` | DZS, `CPI` niz po godini |
| Prosjek **2,46 %**, kumulativno **51,3 %**, najviša „2022. (10,8 %)", najniža „2016. (−1,1 %)" | Graf, statistike ispod · `:3690-3693` | Izvedeno 2010–2026 |
| „Košarica od 100,00 € na kraju je stajala 151,28 €." | Graf, zaključna rečenica · `:3695` | Izvedeno |
| „Izvor: DZS, indeks potrošačkih cijena · zadnji podatak: srpanj 2026." | Graf, footer · `:3696` | DZS |
| Košarica, mod „Udio" (zadano): 13 redaka, npr. Hrana **26,9 %** (−0,1 %), Stanovanje **15,0 %** (+12,2 %), Prijevoz **13,9 %** (+8,2 %) ... Obrazovanje **0,6 %** (−2,0 %) | Prsten + tablica · `:3733-3739`, `KOSARICA:6165-6179` | DZS, srpanj 2026. |
| Sredina prstena (mod Udio): **„3,77 %"** — **NIJE 100 %**, prikazuje zbroj doprinosa (namjerno, objašnjeno u kodu) | Prsten, centar · `:3717-3722` | Izvedeno |
| Mod „Doprinos": 9 pozitivnih redaka (npr. Stanovanje +1,83 %, Prijevoz +1,14 %...) + 4 negativna („SNIŽAVALE INFLACIJU": Hrana −0,03 %, Odjeća −0,30 %, Pokućstvo −0,07 %, Obrazovanje −0,01 %) | Prsten + tablica, drugi prikaz · `:3741-3753` | Izvedeno |
| „Izvor: DZS, težine potrošačke košarice za 2026. · zadnji podatak: srpanj 2026." | Košarica, footer · `:3759` | DZS |
| FAQ (3 pitanja): „4 % na 3,5 %" (ilustrativni primjer, ne stvaran podatak) | FAQ · `POK_FAQ_INF:5846-5850` | — |

---

## 3. /pokazatelji/place

| Vrijednost | Gdje | Izvor i razdoblje |
|---|---|---|
| „lipanj 2026." | Banner · `:3053`, `ZADNJE_PLACE:6122` | DZS |
| „Prosječna neto plaća... iznosi **1.555,00 €**, a medijalna **1.345,00 €**." | Sažetak · `:3072`, `5763` | DZS, lipanj 2026. |
| **1.555,00 €** / „Prosječna neto plaća" / „mjesečno · lipanj 2026." | Kartica 1/4 · `5765` | DZS |
| **1.345,00 €** / „Medijalna neto plaća" — **sub nema navedeno razdoblje** | Kartica 2/4 · `5766` | DZS, lipanj 2026. (implicitno) |
| **2.184,00 €** / „Prosječna bruto plaća" — **hardkodiran literal**, sub bez razdoblja | Kartica 3/4 · `5767` | DZS |
| **1.050,00 €** / „Minimalna bruto plaća" — **hardkodiran literal**, sub „zakonski minimum za 2026." bez imena institucije | Kartica 4/4 · `5768` | Uredba Vlade RH, NN 132/2025 (samo u IZVORI.md, ne na kartici) |
| Graf, toggle Neto (zadano)/Bruto: 17 stupaca 2010.–2026., y-os „1.600 €"/„800 €" (0 decimala) | Graf · `:3363-3381`, `plChart:8613-8624` | DZS, `PLACE_GOD` |
| Rast prosjeka **119,3 %** (od 2010.), rast medijana **100,4 %** (od 2016.) | Graf, statistike · `:3397-3398` | Izvedeno |
| Zadnji prosjek **1.555,00 €**, zadnji medijan **1.345,00 €** | Graf, statistike · `:3399-3400` | DZS |
| „Razlika prosjeka i medijana iznosi **210 €** (0 decimala) ili **13,5 %** prosjeka." | Graf, zaključna rečenica · `:3403` | Izvedeno |
| „Izvor: DZS, statistika plaća · zadnji podatak: lipanj 2026." | Graf, footer · `:3408` | DZS |
| FAQ Q1: „medijalna **1.345,00 €**, prosječna **1.555,00 €**" | FAQ · `POK_FAQ_PLACE[0]:5854` | DZS |
| FAQ Q3: „razlika... iznosi **210,00 €**" (2 decimale — **ne poklapa se s grafom gore**) | FAQ · `5856` | Izvedeno |

**Nalaz — potvrđen još otvoren (NOTES.md §6):** „210 €" (graf, `:3403`, `eur(...,0)`) naspram
„210,00 €" (FAQ, `:5856`, `eur(...,2)`) — **ista brojka, ista stranica, dva formata istovremeno
vidljiva**.

---

## 4. /pokazatelji/mirovine

| Vrijednost | Gdje | Izvor i razdoblje |
|---|---|---|
| „HZMO · HANFA: srpanj 2026." | Banner · `:3053`, `pokDatum:8868` | HZMO + HANFA, srpanj 2026. |
| „Izvori: HNB · DZS · HZMO · HANFA · eNekretnine" | Banner, drugi dio · `:3055` | Nefiltrirano, isto na svih 5 ruta |
| „Na jednog umirovljenika dolazi **1,46** zaposlenih" (hardkodiran literal) | Sažetak · `5773` | HZMO |
| **722,01 €** | Sažetak + stat kartica 2 + tab 1. stup kartica | HZMO, srpanj 2026. — **NOVO** (bilo 721,73 €) |
| **46,43 %** (MIR_RATIO) | Sažetak + stat kartica 3 + tab 1. stup kartica | HZMO, doslovno preuzeto — **NOVO** (bilo 46,50 %) |
| „2,42 milijuna" (STUP2_CLANOVI_MIL) | Sažetak · `8753` | HANFA, srpanj 2026. |
| **73,51 %** (STUP2_B_PCT) | Sažetak + stat kartica 4 | HANFA — nepromijenjeno od 21.8.2026. provjere |
| „513.882" (STUP3_CLANOVI) | Sažetak (**ne pojavljuje se u FAQ-u OVE rute** — to pitanje je samo u `POK_FAQ`, koji na ovoj ruti nije uključen) | HANFA, srpanj 2026. |
| „1 : 1,46" (hardkodiran literal) | Stat kartica 1 · `5775` | HZMO, srpanj 2026. |
| „naspram plaće od **1.555,00 €**" (2 decimale, {STUP1_PLACA}) | Stat kartica 3, sub · `8752` | HZMO, lipanj 2026. |
| „1 : 1,46" (računato, `nf(2)`) | Tab 1. stup, kartica „Tko koga uzdržava" · `:3107-3136` | HZMO, srpanj 2026. |
| „1.802.261" osiguranika, „1.234.791" umirovljenika | Tab 1. stup · `:3110-3111` | HZMO |
| „46 %" („Zadnja figura je djelomična: 46 %...") | Tab 1. stup · `:3132` | Izvedeno |
| **722,01 €** „bez međunarodnih ugovora · srpanj 2026." | Tab 1. stup, kartica · `:3141` | HZMO — **NOVO** |
| **46,43 %** naspram plaće od **„1.555 €" (0 decimala — vidi nalaz)** | Tab 1. stup, kartica · `:3146`, `eur(d.prosjecnaPlaca,0):9668` | HZMO — **NOVO** |
| **879,69 €** / **56,57 %** | Tab 1. stup, kartica „40+ godina staža" · `:3151` | HZMO, srpanj 2026. — **NOVO** (bilo 879,28 €/56,65 %) |
| „10,2 mlrd €" rashodi 2026. (plan), „4,0 mlrd €" iz proračuna | Tab 1. stup, kartica · `:9658,9683` | HZMO/proračun RH, `MIROVINE_FIN` |
| „39 %"/„61 %" (proračun/doprinosi, 2026.) | Tab 1. stup · `:9680-9681` | Izvedeno iz `MIROVINE_FIN` |
| Tablica po godinama (4 retka): 2025. rashodi 9,0/doprinosi 5,6/razlika 3,4 mlrd €·62 %/38 %; 2026. 10,2/6,2/4,0·61 %/39 % (plan, istaknuto); 2027. 10,5/6,6/3,9·63 %/37 %; 2028. 11,0/6,8/4,2·62 %/38 % | Tab 1. stup, tablica · `MIROVINE_FIN:5643-5648` | Financijski plan HZMO-a i državni proračun |
| „33 %" (udio mirovina u proračunu), „97 %"/„39,8 mlrd €" (footnote) | Tab 1. stup · `:3196,3198` | HZMO/proračun RH |
| „5 %" bruto plaće u 2. stup (hardkodiran, bez izvora u kodu) | Tab 2. stup, uvod · `:3208` | Nenavedeno |
| „2.418.271 članova" (STUP2_UK) | Tab 2. stup · `:3217` | HANFA, srpanj 2026. |
| A: **23,45 %**/567.105, „najviše 70 % u dionice"; B: **73,51 %**/1.777.582, „najviše 40 %"; C: **3,04 %**/73.584, „najviše 10 %/najmanje 60 % obveznice" | Tab 2. stup, tri retka · `:3221-3236` | HANFA — nepromijenjeno od 21.8.2026. |
| **„1.470.765"** — „koliko Hrvata može prijeći u A" | **Crvena kutija** · `STUP2_B_ISPOD55:5683`, render `:3243` | HANFA tablica 1.2 — **ručno zbrojena vrijednost, BEZ vlastitog datiranog zapisa provjere u IZVORI.md** |
| Prinosi po kategoriji (default A): ytd **12,71 %**, 12mj **18,13 %**, 10g **9,1 %** | Tab 2. stup, „Povijesni prinosi" · `:9711-9733` | HANFA |
| „433.576 €" / „169.296 €" / „81.436 €" (A/B/C, „100 €/mj., 40 god.") | Tab 2. stup, scenariji · `:3272-3278` | Izvedeno iz `prinos10` po kategoriji |
| „513.882" članova, „461.932 u otvorenim, 51.950 u zatvorenim" | Tab 3. stup, kartica · `:3296,3298` | HANFA, srpanj 2026. |
| „28,5 %" (udio zaposlenih koji štede u 3. stupu) | Tab 3. stup · `:3301` | Izvedeno (513.882/1.802.261) |
| „3.520 €" prosječna ušteđevina po članu (ponovljeno dvaput na stranici) | Tab 3. stup · `:3306,3318` | Izvedeno (1,81 mlrd€/513.882) |
| „1,81 mlrd €" imovina | Tab 3. stup · `:3308` | HANFA |
| „15 %" državni poticaj, „99,54 €" maksimalni godišnji poticaj | Tab 3. stup · `:3311,3313` | Zakon o dobrovoljnim mirovinskim fondovima |
| „15 %" (hardkodiran, bez izvora) | FAQ, „Treba li mi treći stup?" · `POK_FAQ_MIR[2]:5863` | — |

**Ključni novi nalaz na ovoj ruti:** plaća **„1.555 €"** prikazana s **0 decimala** u tabu 1.
stup (`:3146`, `eur(d.prosjecnaPlaca,0)`) dok je na stat kartici sažetka iste stranice **2
decimale** ("1.555,00 €", `:8752`) — krši pravilo NOTES.md §3 ("Brojka mora izgledati identično
na svim mjestima"), dosad nezabilježeno.

FAQ ove rute je **samo `POK_FAQ_MIR`** (3 pitanja) — `POK_FAQ` (pitanja o 3. stupu i
kategorijama A/B/C, koja koriste `{STUP3_CLANOVI}`/`{STUP3_IMOVINA}`) prikazuje se **samo** na
`/cesta-pitanja`, ne i ovdje.

---

## 5. /pokazatelji/nekretnine

| Vrijednost | Gdje | Izvor i razdoblje |
|---|---|---|
| „Indeks cijena: prvo tromjesečje 2026." | Banner · `:3053` | DZS |
| **14,3 %** | Sažetak + stat kartica 1 („Godišnji rast cijena") + FAQ Q1 + ticker | DZS, I. tromj. 2026. |
| **3,3 %** — hardkodiran literal | Stat kartica 2 („Kvartalni rast cijena") · `5791` | DZS, isto priopćenje (CIJ-2026-2-1/1) |
| Graf: 11 stupaca 2015.–2025. (2026. namjerno isključena iz aritmetike, `HPI_PUNE`), indeks 100,0 → 215,6 | Graf · `:3544-3584` | DZS, godišnji prosjeci |
| Razdoblje „2015. – 2025.", ukupni rast **115,6 %**, prosječno godišnje **8,0 %**, indeks „100 → 215,6" | Graf, statistike · `:3590-3593` | Izvedeno |
| Kuće-ikone „100" (2015.) i „215,6" (2025.) | Graf, vizualizacija · `:3600-3613` | Izvedeno |
| „...porasla za **115,6 %**. Za 50 m² 2015. → **23,2 m²** 2025." | Graf, zaključna rečenica · `:3615` | Izvedeno (50 m² je ilustrativna pretpostavka, bez izvora) |
| **−42,2 %** (broj) i **−35,4 %** (vrijednost) prodanih stambenih objekata | Kartica „Aktivnost tržišta" · `:3637` | DZS, isto priopćenje, I. tromj. 2026. |
| FAQ Q1: 14,3 %, 115,6 %, 50 m², 23,2 m² | FAQ · `POK_FAQ_NEK[0]:5839` | DZS |
| FAQ Q3: „2015. = 100" (baza indeksa) | FAQ · `5841` | DZS metodologija, bez izrijekom navedenog izvora uz samu brojku |

**Ispravka pretpostavke iz zadatka:** kategorija **ima** stvaran interaktivni graf s klizačima
godina (`nekOd`/`nekDo`), ne samo statičke kartice — `imaGraf` zastavica iz NOTES.md §5 više ne
postoji u kodu (uklonjena).

Mrtav podatak: `NEK_PROSJEK_M2=2440` generira `nek.stanOd`/`nek.stanDo` koji se **nigdje ne
renderiraju** (potvrđeno grepom).

---

## 6. /pokazatelji/krediti

| Vrijednost | Gdje | Izvor i razdoblje | |
|---|---|---|---|
| **2,91 %** / **5,39 %** | Sažetak · `5796` | HNB, Tablica G2, srpanj 2026. | **NOVO** (bilo 2,90 %/5,42 %) |
| „370,5 milijuna eura" / „449,0 milijuna eura" (tokeni) | Sažetak · `5796` | HNB, srpanj 2026. | **NOVO** (bilo 316,6 mil €) |
| **2,91 %** „Stambeni krediti" | Stat kartica 1 · `5798` | HNB | **NOVO** |
| **5,39 %** „Gotovinski nenamjenski" | Stat kartica 2 · `5799` | HNB | **NOVO** |
| **370,5 mil €** — hardkodiran literal — „Novih stambenih kredita, odobreno u srpnju 2026." | Stat kartica 3 · `5804` | HNB | **NOVO** |
| Graf kamatnih stopa, vrsta Stambeni (default), siječanj 2019.–srpanj 2026., zadnja **2,91 %**, promjena kroz razdoblje **−0,62 pp**, raspon **2,19 %–3,76 %** | Graf · `:3412-3463` | HNB, srpanj 2026. | zadnja točka **NOVO** |
| **Tablica „Prosječne kamatne stope na jednom mjestu"** (Vrsta/Nominalna/EKS/Razlika/Prom. 12mj./Novi poslovi): Stambeni 2,91 %\|3,27 %\|+0,36 pp\|−0,07 pp\|370,5 mil €; Gotovinski 5,39 %\|5,71 %\|+0,32 pp\|−0,34 pp\|449,0 mil €; Potrošački 5,02 %\|5,46 %\|+0,44 pp\|−0,04 pp\|1,3 mil € | Tablica · `:3471-3506` | HNB, srpanj 2026. | Stambeni/gotovinski **NOVO**; potrošački redak nije eksplicitno potvrđen u IZVORI.md |
| Graf „Novoodobreni stambeni/gotovinski krediti" (toggle): stambeni zadnji mj. **370,5 mil €**, zbroj razdoblja **19.239 mil €**; gotovinski zadnji mj. **449,0 mil €**, zbroj **14.636 mil €** | Graf · `:3508-3541` | HNB, srpanj 2026. | zadnji mjesec **NOVO** |
| FAQ (5 pitanja): 2,91 %, 3,27 %, 2,48 pb, 0,36/0,32 pb, 370,5/449,0 mil eura, „1.924 €" (primjer 20.000€/7g) | FAQ · `POK_FAQ_KRED:5829-5835` | HNB | **NOVO** (sve brojke ovisne o NOM stopama) |

**Bug pronađen:** `POK_FAQ_KRED[3]` (`:5833`) doslovno kaže *„U **lipnju** 2026. banke su
odobrile {KR_IZNOSSTAMB}..."*, ali `{KR_IZNOSSTAMB}` sad razrješava na **srpanj 2026.**
vrijednost (370,5 mil €) — mjesec u prozi nije ažuriran zajedno s podatkom pri HNB reviziji od
1.9.2026.

Mrtvi tokeni (izračunati, nikad prikazani): `{KR_PREKO_NOM}`, `{KR_KART_NOM}`,
`{KR_STAMB_GOD}`, `{KR_GOTOV_GOD}` — potvrđuje NOTES.md §5.

---

## 7. /projekti

| Vrijednost | Gdje | Izvor i razdoblje |
|---|---|---|
| „19. 8. 2026." — „Stanje na dan" | Zbirno, vrh · `:3816`, `PROJ_STANJE:6199` | Osobna evidencija (Genius by InterCapital) — **ručni literal, ne izveden iz zadnjeg retka** |
| **10.195 €** ukupno uplaćeno (svi portfelji) | Zbirna kartica · `:3848` | Genius, 17.7.2024.–19.8.2026. |
| **12.472,27 €** ukupna vrijednost danas | Zbirna kartica · `:3852` | isto |
| **+2.277,27 €** zarada od početka | Zbirna kartica · `:3856` | isto |
| **+22,3 %** na uloženo (jednostavni prinos) | Zbirna kartica · `:3857` | Izvedeno |
| **+30,35 %** prosječni godišnji prinos (XIRR) | Zbirna kartica (tint) · `:3861` | Izvedeno, metoda obrazložena na stranici |
| Ista 4 broja ponovljena u retku „Sve zajedno" tablice „Svi portfelji" | Tablica · `:3931-3941` | isto, identično |
| ETF Start: 2.220 €/2.761,09 €/+541,09 €/+19,08 % | Kartica (čip aktivan) + redak tablice | Genius, 17.7.2024.–19.8.2026. |
| S&P 500: 1.575 €/1.863,92 €/+288,92 €/+18,17 % | " | isto |
| BET: 1.575 €/2.670,03 €/+1.095,03 €/+63,65 % | " | isto |
| Lucija: 4.825 €/5.177,23 €/+352,23 €/+26,30 % | " | 20.8.2025.–19.8.2026. |
| „500 €" min. početna uplata (ETF Start), „50 € → 75 €" mjesečna uplata (sva 4) | Proza u opisima portfelja · `:6211-6214` | Osobna evidencija — nema formalni izvor, poklapa se sa stvarnim podacima |
| Graf: 26 stupića, tooltip „D. M. GGGG.: uplaćeno X €, vrijednost Y €" (**0 decimala** — razlikuje se od 2 decimale na kartici) | Graf · `:8907-8923` | isto |
| „Najnovija objava · 19. 8. 2026." + puni tekst („...Ukupna zarada od početka: 2.277,27 €.") | Zadnja objava, cijeli tekst prikazan · `POSTOVI['2026-08-19']:6269` | Osobna evidencija |
| „Izvor: vlastita evidencija projekta · stanje: 19. 8. 2026." | Footer kartice · `:3948` | Jedina formalna napomena o izvoru na ovoj ruti |
| „17. 7. 2024. – 19. 8. 2026." razdoblje grafa | Ispod grafa · `:3904` | Izvedeno iz stvarnih redaka |

**Ključan nalaz — zastarjelost:** zadnji redak podataka i zadnja objava su **19.8.2026.** Danas
je 4.9.2026. — podaci su stari **16 dana**, bez ikakve vizualne oznake da možda nisu najsvježiji
(dosadašnji obrazac je mjesečno ažuriranje sredinom mjeseca, sljedeći unos očekivan oko
19.–20.9.). Ovo nije greška u kodu (kod je interno konzistentan), nego sadržajni zaostatak.

`PORTFELJI.meta[*].start` je mrtvo polje (nikad se ne renderira) i ne slaže se sa stvarnim prvim
retkom za Luciju (meta kaže "18.8.2025.", stvarni prvi redak je "20.8.2025.") — bezopasno jer se
ne prikazuje, ali vrijedi ukloniti razilaženje.

---

## 8. /cesta-pitanja

Dvije grupe: **„Pokazatelji"** (`FAQ` minus 2 filtrirana + `POK_FAQ` + `POK_FAQ_KRED` +
`POK_FAQ_NEK` + `POK_FAQ_INF` + `POK_FAQ_PLACE` + `POK_FAQ_MIR`) i **„Kalkulatori"**
(`CALC_META[*].faq`, svi statični literali bez tokena).

### Grupa „Pokazatelji" — brojke po pitanju

| Vrijednost | Pitanje | Izvor i razdoblje |
|---|---|---|
| 15 %, 5 %, 600,00 €, 5.000,00 € | FAQ[0] „Kako se izračunava neto plaća..." `5570` | Zakon o doprinosima/PDD |
| 16,5 % | FAQ[1] „Bruto 1 vs Bruto 2" `5571` | isto |
| **3,9 % (hardkodiran literal, ne token!)**, 10.000,00 €, 6.820,94 € | FAQ[3] „Kako inflacija utječe na štednju" `5573` | Ilustrativni izračun; 3,9 % danas se poklapa s `{CPI}` ali NIJE na njega vezan |
| {STUP3_CLANOVI}="513.882", {STUP3_IMOVINA}="1,81" mlrd €, 15 % | POK_FAQ[0] `5867` | HANFA, srpanj 2026. |
| „deset godina", „pet" (godina), „šest mjeseci" | POK_FAQ[1] „Kategorije A/B/C" `5872` | HANFA brošura |
| {KR_STAMB_NOM}=2,91 %, {KR_STAMB_EKS}=3,27 %, {KR_DIFF_SG}=2,48 pb, {KR_DIFF_20K7G}=1.924 €, {KR_STAMB_EKS_DIFF}=0,36 pb, {KR_GOTOV_EKS_DIFF}=0,32 pb, {KR_IZNOSSTAMB}=370,5 mil eura, {KR_IZNOSGOTOV}=449,0 mil eura | POK_FAQ_KRED[0-3] `5830-5833` | HNB — **NOVO** (sve) |
| {HPI_RAST}=14,3 %, 115,6 %, 23,2 m², 50 m², „2015. = 100" | POK_FAQ_NEK[0,2] `5839,5841` | DZS |
| „4 %", „3,5 %", „0 %" | POK_FAQ_INF[1] `5848` | Ilustrativni primjer |
| {PL_MEDIJAN}=1.345,00 €, {PL_PROSJEK}=1.555,00 €, {PL_RAZLIKA}=210,00 € | POK_FAQ_PLACE[0-2] `5854-5856` | DZS, lipanj 2026. |
| 15 % (treći put ista brojka na stranici) | POK_FAQ_MIR[2] `5863` | Bez izvora u tekstu |

### Grupa „Kalkulatori" — svi literali, bez izvora u tekstu (namjerno, po dizajnu)

15 %, 5 %, 16,5 %, 2.000,00 €, 2.330,00 € (plaća); 25 godina (mladi); 1.200,00 € (neopor. bonus);
3 %/7 %/6,25 % (kredit, EKSPLICITNO ilustrativne, ne stvarne stope); 45 % (opcije); 6 %/3 %
(zatvoriti); 7 %/3-5 %/10 % (cilj); 4 %/30 godina (renta, "američki podaci"); 12 %/2 godine
(porez na kapitalnu dobit); 7 %/4,5 %/−20 %/+25 % (kamata); 3,9 %/1,15 %/−2,6 % i
10.000,00 €/3,9 %/10 godina/6.820,94 € (inflacija — **potpuni duplikat FAQ[3] gore, unutar iste
rute**).

---

## 9. Ostale rute (blog, statične stranice)

| Vrijednost | Ruta | Gdje | Napomena |
|---|---|---|---|
| 2.000 €, 2.330 €, 1.370 €, 41/40-ak posto | `/blog/gdje-odlazi-tvoja-placa` | proza članka i teaser | Ilustrativan primjer |
| „600 eura" (osobni odbitak) | isto | proza | **Treći zapis iste brojke** (uz `ODB=600` konstantu i FAQ „600,00 €") — različit format registar |
| „728 eura" (prosj. neto plaća „krajem 2012.") | `/blog/zivimo-li-bolje-nego-2013` | proza | **Ne poklapa se** s `PLACE_GOD[2012]=719 €` (`6134`) — 9 € razlike, vrijedi provjeriti izvornu tvrdnju |
| „1.498 eura" („danas", tj. na dan pisanja 6.2.2026.) | isto | proza | Zamrznuto na dan objave, ne prati trenutni `TRZISTE` (1.555 €) — svjesno, članak je povijesna usporedba |
| „23 posto" (Zagreb, viša porezna stopa) | isto | proza | Poklapa se s `GRADOVI['Zagreb']` |
| 1. siječnja 2027. (HIR datum) | `/blog/hrvatski-investicijski-racun-2027` | proza | Najavljeni zakonski datum |
| 80/70 posto (rast cijena/kupnje bez kredita) | `/blog/zasto-cijene-nekretnina-rastu` | proza | Bez izvora u tekstu |
| do 20 % (jednokratna isplata 2. stupa) | `/blog/odlazak-u-mirovinu-drugi-stup-mod` | proza | Bez datuma |
| 50 €/mj., ~11 % u plusu, 43 % | `/blog/50-eura-mjesecno-u-etf` | proza | Osobni portfelj (Genius), bez datuma provjere |
| „01"-„07", 7 modula, „7,5 h" (hardkodiran zbroj, poklapa se ali nije izveden iz `MODULI.reduce`) | `/edukacija` | popis modula | `m.trajanje` po modulu se **ne prikazuje** iako postoji u podatku |
| „18+ godina iskustva" | `/edukacija`, `/o-meni` (ponovljeno na 4+ mjesta ukupno) | proza | Bez izvora |
| „15-ak godina" edukacija, „2024." pokretanje YT kanala | `/o-meni` | proza | Bez izvora |
| `PRESS`: samo datumi nastupa (6.4.2026., 26.2.2026., 2.2.2026., 7.9.2025.), **bez ijedne brojke gledanosti** | `/o-meni` | popis medijskih nastupa | — |
| „Zadnje ažuriranje: kolovoz 2026." (mjesec bez dana) | `/politika-privatnosti` | uvod | Poznato, bez preciznog datuma |
| „12 mjeseci" / „godinu dana" (rokovi čuvanja podataka) | `/politika-privatnosti` | proza | Interna politika, bez vanjskog izvora |

Ruta `/uvjeti-koristenja` **ne postoji** u kodu (provjereno grepom).

---

## Zbirni pregled — brojke bez navedenog izvora ili razdoblja

- Naslovnica: „40-ak posto" (opis videa), „18+ godina iskustva", svi brojevi u FAQ Q1/Q2 (porezni parametri), „© 2026".
- /pokazatelji/place: kartica „Prosječna bruto plaća" (sub bez razdoblja), kartica „Minimalna bruto plaća" (institucija nije imenovana na kartici).
- /pokazatelji/mirovine: **„1.470.765" u crvenoj kutiji** (ručno zbrojena HANFA vrijednost bez vlastitog datiranog zapisa u IZVORI.md), „5 %" (2. stup doprinos, `:3208`), „15 %" u FAQ-u.
- /pokazatelji/nekretnine: „50 m²" (ilustrativna pretpostavka), „2015. = 100" (baza indeksa bez izrijekom navedenog izvora uz samu brojku).
- /pokazatelji/krediti: potrošački redak tablice (5,02 %/5,46 %/1,3 mil €) nije eksplicitno potvrđen u IZVORI.md kao provjeren nakon 21.8.
- /cesta-pitanja: gotovo sve brojke u grupi „Kalkulatori" (namjerno — statični ilustrativni primjeri, po dizajnu).
- Ostale rute: većina brojki u blog prozi i na `/o-meni`/`/edukacija`.

## Zbirni pregled — brojke hardkodirane u prozi (ne token)

- Naslovnica FAQ (sve 4 stavke, `FAQ:5569-5574`), uklj. „3,9 %" koje se poklapa s `{CPI}` ali NIJE na njega vezano.
- /pokazatelji/inflacija: „−0,2 %" (mjesečna promjena, `5758`).
- /pokazatelji/place: „2.184,00 €" i „1.050,00 €" (`5767-5768`).
- /pokazatelji/mirovine: „1,46"/„1 : 1,46" (dva mjesta), „5 %" (2. stup), „15 %" (FAQ).
- /pokazatelji/nekretnine: „3,3 %" (`5791`), „115,6 %"/„23,2 m²" (FAQ, `5839`).
- /pokazatelji/krediti: „370,5 mil €" (`5804`), „U lipnju 2026." (FAQ — **bug, vidi §6**).
- /cesta-pitanja: cijela grupa „Kalkulatori" (namjerno, po dizajnu — CALC_META.faq ne koristi tokene).
- Blog: brojna mjesta, uklj. „600 eura" (treći zapis iste brojke kao `ODB` i FAQ) i „728 eura" (ne poklapa se s `PLACE_GOD`).

## Zbirni pregled — brojke na više mjesta i poklapaju li se

**NE poklapaju se (format):**
1. **1.555 € (plaća)** — ticker (0 decimala, `TRZISTE[1]` bez `dec` polja) naspram SVIH ostalih prikaza (kartice, sažeci, FAQ, /pokazatelji/mirovine tab 1. stup s izuzetkom niže) — 2 decimale. Vjerojatno propust: nedostaje `dec: 2` na `TRZISTE[1]:5563`.
2. **1.555 € (plaća, na /pokazatelji/mirovine)** — stat kartica sažetka (2 decimale, `:8752`) naspram tab „1. stup" kartice (0 decimala, `eur(d.prosjecnaPlaca,0):9668`) — isti broj, dva formata na istoj stranici. Novootkriveno.
3. **210 € (razlika plaća prosjek−medijan, /pokazatelji/place)** — graf (0 decimala, `:3403`) naspram FAQ (2 decimale, `:5856`) — **potvrđen još otvoren nalaz iz NOTES.md §6**.
4. **600 €/5.000 €/10.000 € (naslovnica)** — JSON-LD `<head>` (bez decimala) naspram vidljivog FAQ teksta (2 decimale) — **potvrđen još otvoren nalaz iz NOTES.md §6**.
5. **Zarada/vrijednost portfelja (/projekti)** — kartica (2 decimale) naspram grafa/tooltipa (0 decimala) — namjerna razlika preciznosti kartica vs. graf, ali vrijedi provjeriti je li to svjesna odluka.

**Poklapaju se (potvrđeno):**
- CPI 3,9 % na tickeru, kartici, sažetku, FAQ-u — dosljedno 1 decimala.
- {KR_STAMB_NOM}/{KR_GOTOV_NOM} na svim mjestima na /pokazatelji/krediti i /cesta-pitanja — dosljedno 2 decimale.
- {HPI_RAST} 14,3 % svugdje — dosljedno 1 decimala.
- 370,5/449,0 mil € pojavljuje se i kao „mil €" i kao „milijuna eura" — namjerno drugačiji registar (obrazloženo komentarom u kodu), ista vrijednost.
- 722,01 € i 46,43 % na /pokazatelji/mirovine (osim iznimke #2 gore) — dosljedno.

---

## Ostali nalazi vrijedni pažnje (izvan strogog opsega "brojka")

- **/projekti je sadržajno zastario 16 dana** (zadnji unos 19.8.2026., danas 4.9.2026.) — vrijedi novi mjesečni update.
- **POK_FAQ_KRED[3] tvrdi „U lipnju 2026." dok citira srpanjske brojke** — stvaran bug, treba ručno uskladiti mjesec u prozi pri idućem HNB ažuriranju.
- **STUP2_B_ISPOD55 („1.470.765" u crvenoj kutiji na /pokazatelji/mirovine)** nema vlastiti datirani zapis provjere u IZVORI.md, iako se aktivno prikazuje — jedina "živa" brojka na stranici bez formalnog provjernog traga.
- Potvrđeno mrtvi/neprikazani podaci (bez promjene potrebne, samo za evidenciju): `NEK_PROSJEK_M2`-izvedeni `nek.stanOd/stanDo`, `{KR_PREKO_NOM}`/`{KR_KART_NOM}`/`{KR_STAMB_GOD}`/`{KR_GOTOV_GOD}`, `STUP2_IMOVINA_MIL`, `STUP2[*].uvjet`/`.imovina`, `PORTFELJI.meta[*].start`, `trzistePotpis`, `ZIGOVI` (samo u PDF-u, ne na javnoj ruti), `MODULI[*].trajanje` (postoji u podatku, ne prikazuje se pojedinačno).
- `PORTFELJI.meta[3].start` ("18.8.2025.") ne slaže se sa stvarnim prvim retkom za Luciju ("20.8.2025.") — bezopasno jer se ne prikazuje.

---

*Sastavljeno automatski, 4.9.2026., pregledom `index.html` bez izmjene. Za svaki nalaz proći
kroz `IZVORI.md` prije ijedne stvarne izmjene brojke, po postupku opisanom ondje.*
