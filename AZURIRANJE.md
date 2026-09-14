# AZURIRANJE.md — kako ažurirati podatke

Praktični vodič. Za svaki podatak: **kad izlazi**, **gdje ga naći**, **na što
paziti**, i **što se mijenja u kodu**.

Svi podaci su hardkodirani i mijenjaju se ručno. Registar izvora s linkovima je
u `IZVORI.md` — ovaj file je uputa kako se njime služiti.

> **Zlatno pravilo: nikad ne prepisuj brojku s medijskog portala.** Samo iz
> priopćenja institucije. Mediji redovito uzmu susjedni redak.

Provjereno protiv koda 14. 9. 2026.

---

## Kalendar objava

| Podatak | Ritam | Kad izlazi | Kasni za razdobljem |
|---|---|---|---|
| Inflacija (CPI) | mjesečno | procjena ~1., **konačni ~15.** | ~1,5 mjeseca |
| Plaće | mjesečno | oko 21. | ~2 mjeseca |
| Kamatne stope (HNB) | mjesečno | oko 1. | ~1,5 mjeseca |
| Mirovine (HZMO) | mjesečno | početak mjeseca | ~1 mjesec |
| Mirovinski fondovi (HANFA) | mjesečno | oko 21. | ~1,5 mjeseca |
| Indeks nekretnina | **tromjesečno** | 1.10., 8.1., 5.4. | ~3 mjeseca |
| Projekti | **mjesečno** | kad Marko očita stanja | — |
| JLS porezne stope | **godišnje** | odluke do 15.12. | — |
| Minimalna plaća | **godišnje** | uredba u listopadu | — |

**Praktično:** provjeru radi oko **25. u mjesecu** — tad su svi izvori vani.

---

## 1. Inflacija

**Izvor:** DZS, „Indeksi potrošačkih cijena" · https://podaci.dzs.hr/hr/podaci/cijene/

### Što tražiš
Godišnja stopa, mjesečna stopa, te **ponderi i stope po 13 skupina** iz priloga
priopćenja (list T1).

### Zamke

> **Uzmi KONAČNE podatke, ne prvu procjenu.** Procjena izlazi oko 1., konačni
> oko 15. Portal koristi isključivo konačne.

> **HICP nije CPI.** U istom priopćenju stoje obje. Portal prikazuje CPI.

> **Košarica se ažurira ZAJEDNO s naslovnom stopom.** Inače kartica doprinosa
> pokazuje prošli mjesec.

> **Zbroj doprinosa NIJE jednak naslovnoj stopi** i to nije greška — CPI se
> agregira preko indeksa. DZS ima isto odstupanje.

> **Jednom godišnje provjeri i prošlogodišnju stopu** protiv konačne objave.
> CPI za 2025. bio je upisan kao 3,6 %, a DZS objavljuje 3,7 % — greška je
> stajala mjesecima i ulazila u kumulativnu inflaciju.

### Što se mijenja
`TRZISTE` stavka `inflacija` (`val`, `prev`, `datum`) · `KOSARICA` (13 skupina,
`w` i `r`) · `CPI` objekt (nova godina ili prepis zadnje) · `ZADNJE_RAZDOBLJE`

**Izračunato iz toga:** `{KOSARICA_100}`, kumulativna inflacija za 5 i 10 godina.

---

## 2. Plaće

**Izvor:** DZS · https://podaci.dzs.hr/hr/podaci/trziste-rada/
Godišnje vrijednosti: Narodne novine, službena priopćenja DZS-a.

### Što tražiš
Prosječna neto, prosječna bruto, medijalna neto, medijalna bruto.

### Zamke

> **`PLACE_GOD` miješa dvije mjere, i to je namjerno.** Neto i bruto su
> **godišnji prosjeci**, medijan su **prosinačke vrijednosti** — DZS medijalnu
> plaću ne objavljuje kao godišnji prosjek, samo mjesečno.
> To je označeno na grafu, u tooltipu i u karticama. Ne miješaj ih.

> **Zadnji redak nije godišnji prosjek** nego zadnji objavljeni mjesec.
> `PLACE_GOD_NEPUNA` ga označava, `PLACE_PUNE` ga filtrira iz izračuna rasta.
> Inače bi rast uspoređivao godišnji prosjek s jednim mjesecom.

> **Kad DZS objavi punu godinu** (u veljači), zadnji redak postaje pravi
> godišnji prosjek i `PLACE_GOD_NEPUNA` se pomiče na sljedeću godinu.

> Plaće kasne ~2 mjeseca, više od inflacije. `ZADNJE_PLACE` je zato obično
> mjesec stariji od `ZADNJE_RAZDOBLJE`. Nije greška.

> **Bruto nikad ne izvodi iz neta.** Stvarni omjer varira 0,696–0,736 kroz
> godine, jer su se doprinosi i porezi mijenjali. Portal je nekad imao
> konstantu 0,7123 — cijeli stupac bio je izmišljen.

### Što se mijenja
`TRZISTE` stavka `placaProsjek` · `PLACE_GOD` (zadnji redak svaki mjesec) ·
`ZADNJE_PLACE` · `PLACE_GOD_NEPUNA` (jednom godišnje)

`PLACE_PUNE` se **ne dira** — sam se preračuna.

---

## 3. Kamatne stope

**Izvor:** HNB, **tablica G2**, list **EUR**
https://www.hnb.hr/statistika/statisticki-podaci/financijski-sektor/druge-monetarne-financijske-institucije/kreditne-institucije/kamatne-stope

### Što tražiš
Stambeni, gotovinski nenamjenski, potrošački — **nominalna i EKS** za svaki,
plus iznose novih poslova. I prekoračenje i kreditne kartice.

### Zamke

> **Mjeseci rastu u STUPCE, ne u redove.** Zadnji popunjeni stupac je najnoviji.

> **„Gotovinski nenamjenski" nije „Za ostale namjene".** To su dva različita
> retka, i mediji redovito uzmu krivi. Za srpanj 2026. razlika je bila
> 5,39 % naspram 5,29 %.

> **HNB tiho revidira objavljene podatke.** Marker se briše, starija verzija
> nije dostupna. Ako brojka odstupa od one koju pamtiš, provjeri je li
> revidirana.

> **Pet nizova se ažurira iako se ne prikazuje** — `KS_PREKORACENJE`,
> `KS_KARTICE`, `KS_OSTALE`, `KS_EKSOSTALE`, `KS_IZNOSREVOLVING`. Svjesna
> odluka: svi nizovi dijele duljinu preko `KS_MJ`, pa preskakanje ostavlja rupu.

### Što se mijenja
**Svih 14 `KS_*` nizova** — dodaj jednu vrijednost na kraj svakom ·
`KS_MJ` +1 · `TRZISTE` stavka `stambeni` · `ZADNJE_HNB`

**Izračunato:** razlike nominalna/EKS, godišnja promjena, usporedba anuiteta —
sve iz zadnjeg indeksa.

---

## 4. Mirovine

**Izvor:** HZMO, „Aktualna statistika" · https://www.mirovinsko.hr/hr/statistika/860

### Što tražiš
Prosječna **ukupna starosna mirovina**, ZOMO, **bez međunarodnih ugovora** ·
broj osiguranika i korisnika · omjer · mirovina uz 40+ staža ·
**oba postotka udjela u plaći** · **koju plaću HZMO koristi**

### Zamke

> **NAJOPASNIJI IZVOR.** HZMO na istoj stranici objavljuje više brojki koje se
> zovu „prosječna mirovina". U susjednom retku stoji ona za 40+ godina staža
> (oko 880 €) — **to nije brojka za glavnu karticu.** Pročitaj cijelu rečenicu.

> **Udjeli u plaći se PREUZIMAJU, ne računaju.** HZMO ih objavljuje doslovno,
> s izričito navedenim razdobljem plaće. Portal ih ne izvodi — upisuju se kao
> podatak.

> **HZMO koristi STARIJU plaću od DZS-a.** Obično mjesec. Zato
> `STUP1.placaMjesec` **nije** `ZADNJE_PLACE`. Pri svakom ažuriranju pročitaj
> koju plaću HZMO navodi i upiši i taj mjesec.

> **`ZADNJE_HZMO` i `ZADNJE_HANFA` moraju ostati ODVOJENE.** Različite
> institucije, vlastiti kalendari. To što se često poklapaju je slučajnost.

> `omjer` je **literal**, ne izračun — HZMO ga sam objavljuje kao „1 : 1,46".

### Što se mijenja
`TRZISTE` stavka `mirovina` · `STUP1` (osiguranici, umirovljenici, omjer,
mirovina, mirovina40, **prosjecnaPlaca**, **placaMjesec**, **udioPlace**,
**udio40Place**) · `ZADNJE_HZMO` · `MIROVINE_FIN` (godišnje)

`mirovina40Mjesec` čita `ZADNJE_HZMO` — ne dira se.

---

## 5. Mirovinski fondovi

**Izvor:** HANFA, mjesečno izvješće · https://www.hanfa.hr/statistika/mjesecna-izvjesca/

### Što tražiš
Tablica 1.1 članstvo · 1.2 po dobi · 1.8 imovina OMF · 1.9 prinosi MIREX ·
1.11 i 1.15 ODMF · 1.18 i 1.22 ZDMF

### Zamke

> **Naziv datoteke je mjesec + 1.** Izvješće za srpanj zove se `mi-08_26.xlsx`.

> Link ima nasumični dio u putanji — **ne može se pogoditi**, idi preko tablice.

> **Provjera: A + B + C mora biti ≈ 100 %.**

> **MIREX ima sedam varijanti prinosa.** Portal koristi tri: `prinos12` je
> zadnjih 12 mjeseci, `ytd` od početka godine, `prinos10` prosječni godišnji u
> zadnjih 10 godina. **Ne uzimaj „od početka rada"** — to je četvrta metrika
> koju HANFA ističe na naslovnici.

> **`STUP2_B_ISPOD55` se zbraja ručno** iz tablice 1.2, dobne skupine do 50–54.
> Komentar u kodu ima raspodjelu — ažuriraj i nju.

### Što se mijenja
`STUP2` (3 kategorije × članovi, imovina, tri prinosa) · `STUP2_UK` ·
`STUP2_B_ISPOD55` · `STUP3` (otvoreni, zatvoreni, imovina, poticaji) ·
`ZADNJE_HANFA`

`STUP3.clanovi` i `STUP3.imovina` se **ne diraju** — izračunavaju se.
`STUP3.razdoblje` čita `ZADNJE_HANFA`.

---

## 6. Nekretnine

**Izvor:** DZS, „Indeksi cijena stambenih objekata"
https://podaci.dzs.hr/hr/podaci/cijene/indeksi-cijena-stambenih-objekata/

### Što tražiš
Godišnja stopa, kvartalna stopa, stope promjene broja i vrijednosti prodanih
objekata.

### Zamke

> **Tromjesečno, ne mjesečno.**

> **`HPI_GOD` sadrži GODIŠNJE PROSJEKE.** Zadnji redak je tromjesečno očitanje
> i **ne ulazi u izračune** — `HPI_PUNE` ga filtrira. Inače bi dijelio
> tromjesečnu vrijednost s godišnjim prosjekom.

> **Niz je na bazi 2025 = 100**, revidiran 2.7.2026. DZS je uz promjenu baze
> **revidirao i vrijednosti** — odstupanje od čiste preskalacije bilo je
> −6 % do +10,5 %. Ako DZS ikad opet promijeni bazu, **ne pretpostavljaj** da
> se postoci ne mijenjaju. Provjeri.

> **Godišnja stopa je strukturno neizvediva iz `HPI_GOD`** — niz nema
> tromjesečne točke za usporedbu. Upisuje se ručno iz priopćenja.

> Kvartalni rast i aktivnost tržišta dolaze iz **istog priopćenja** —
> ažuriraju se zajedno.

### Što se mijenja
`TRZISTE` stavka `hpi` · `ZADNJE_HPI` · kartica kvartalnog rasta · kartica
„Aktivnost tržišta" (dvije stope, hardkodirane) · **FAQ tekst** ako sadrži
brojke

`HPI_GOD` se mijenja **samo kad DZS objavi punu godinu**, ne pri tromjesečnim
objavama.

---

## 7. JLS porezne stope

**Izvor:** Porezna uprava, zbirna tablica stopa po JLS
**Ritam:** godišnje, odluke do 15.12.

### Zamke

> **556 unosa, ulaze u svaki izračun plaće.** Pogrešna stopa znači pogrešan neto.

> **`JLS_GODINA` je samo prikaz.** Mijenjanje te brojke **ne ažurira**
> `GRADOVI`. Cijela tablica se prepisuje ručno.

> **`GRAD_ALIAS` se mijenja pri preimenovanju ili spajanju JLS-a.**

> Nejednoznačni nazivi (Otok, Privlaka, Sveta Nedelja, Novigrad) **namjerno ne
> pogađaju ništa** — dvije JLS s različitim stopama.

> **Oroslavje:** NN 152/2023 propisuje 18 %, zbirna tablica navodi 20 %.
> Portal slijedi zbirnu tablicu.

---

## 8. Minimalna plaća

Uredba Vlade RH, Narodne novine. Jednom godišnje, u listopadu.

Mijenja se `MIN_PLACA` i `MIN_PLACA_GODINA`.

---

## 9. Projekti

**Izvor:** Markova vlastita evidencija. Nema vanjskog izvora ni odjeljka u
`IZVORI.md`.

### Što se mijenja, ovim redom

1. **`PORTFELJI.redovi`** — novi redak na **kraj** niza:
   `{ d: 'GGGG-MM-DD', etf: [uplata, stanje], sp: [...], bet: [...], luc: [...] }`
2. **`UPLATE`** — novi unos po portfelju, **s točnim datumom uplate**
3. **`POSTOVI`** — komentar pod istim ključem kao datum retka

### Zamke

> **Datum retka i datum uplate nisu isti.** Redak nosi datum **očitanja stanja**,
> `UPLATE` nosi datum **kad je novac uplaćen**. Znaju se razlikovati nekoliko
> dana, i XIRR ovisi o tome.

> **Zarada i prinos se RAČUNAJU.** Ne upisuj ih. Ako izračun ne odgovara tvojoj
> brojci, nešto ne štima s unosom.

> **Nema `ZADNJE_*` konstante.** Sve čita zadnji redak.

---

# Kako promijeniti podatak

Ne uređuješ kod ručno. Daješ Claude Codeu prompt.

```
Pročitaj NOTES.md, IZVORI.md i AZURIRANJE.md prije rada.
Ne commitaj — diff kao tekst, pa čekaj.

Ažuriranje podataka. Nove vrijednosti iz službenog izvora:

[IZVOR, razdoblje, link]
- [metrika]: staro [X] → novo [Y]
- razdoblje: staro [mjesec] → novo [mjesec]

PRIJE izmjene:
1. Otvori izvor i POTVRDI svaku brojku doslovno. Ako se ne poklapa, STANI.
2. Ispiši popis SVIH mjesta gdje se svaka brojka pojavljuje.
3. Javi koje se IZRAČUNATE vrijednosti mijenjaju i za koliko.
4. Provjeri broj decimala — ista brojka mora izgledati identično svugdje.

Nakon izmjene testiraj uživo i ISPIŠI svako mjesto gdje se brojka pojavljuje,
plus banner s razdobljem.

Na kraju ažuriraj datum provjere u IZVORI.md.
```

### Nakon izmjene, provjeri sam

1. **Kartica, sažetak i ticker** moraju pokazivati identičnu brojku
2. **Banner s razdobljem** gore
3. **FAQ odgovori** te kategorije

---

# Zamke koje se ponavljaju

Sve su se već dogodile na ovom portalu.

> **`TRZISTE` je NIZ.** Pristup preko `tz(id)`. Kao objekt daje `undefined`, a
> formateri tiho prikažu **nulu** — greška izgleda kao vjerodostojan podatak.

> **Broj decimala ovisi o formatu.** Bez `dec` polja, eurske stavke padaju na
> **0**, postotci na **2**. Eurska stavka koja se drugdje prikazuje s
> decimalama **mora** imati eksplicitan `dec`.

> **Razdoblje se mijenja zajedno s brojkom.** Nova brojka pod starim datumom je
> gore od stare brojke pod starim datumom.

> **Dvije konstante koje se danas poklapaju nisu ista stvar.** To je puklo
> triput: `STUP1.placaMjesec` (DZS razdoblje naspram razdoblja koje HZMO
> koristi), `mirovina40Mjesec` (pretpostavka da kasni mjesec, povučena), i
> `STUP3.razdoblje` (zaseban literal umjesto `ZADNJE_HANFA`).
> Ako dolaze iz različitih objava, drži ih odvojeno i **veži oznaku na pravu
> konstantu**.

> **Niz koji daje savršeno pravilan omjer je sumnjiv.** Tako su otkriveni
> bruto stupac i bruto medijan u `PLACE_GOD` — omjer neto/bruto bio je
> 0,7120–0,7126 kroz 17 godina, dok stvarni DZS omjer varira 0,696–0,736.
> Isti test vrijedi za svaki niz: ako je odnos dvaju stupaca previše stabilan,
> jedan je vjerojatno izveden iz drugog.

> **Brojke žive i u prozi.** FAQ odgovori i sažetci sadrže brojke upisane u
> rečenicu. Dio je tokeniziran, dio nije.

> **Ne diraj ilustrativne brojke.** `CALC_META.kredit.faq[0]` i
> `CALC_META.zatvoriti.savjet` su hipotetski primjeri. Imaju komentar u kodu.

---

# Nova ruta ili blog članak — četiri mjesta

1. `META_*` tablica u `index.html`
2. Mirror u `middleware.js`
3. `sitemap.xml`
4. `llms.txt`

Zatim **`node scripts/check-meta-sync.js`** — mora vratiti „USKLAĐENO".
Skripta je i Vercelov `buildCommand`, pa razilaženje blokira deploy.
`llms.txt` nije pokriven skriptom — provjeri ga sam.

Ako mijenjaš **FAQ tekst**, pokreni i `node scripts/gen-faq-jsonld.js`, pa
`check-faq-jsonld-sync.js`.

---

# Prompt za novu sesiju

### Claude Codeu

```
Pročitaj NOTES.md, IZVORI.md i AUDIT-2026-08-18.md u korijenu repozitorija u
cijelosti prije bilo kakvog rada. Reci mi u dvije rečenice gdje smo i što je
sljedeća stavka.
```

### Meni, u novom razgovoru

```
Radim na portalu O novcu (onovcu.hr, repo onovcu-svg/moja-stranica) — hrvatski
portal o osobnim financijama s kalkulatorima i pokazateljima. Portal je lansiran.

U znanju projekta su NOTES.md (radni dnevnik i odluke), IZVORI.md (registar
izvora) i AZURIRANJE.md (vodič za ažuriranje). Pročitaj ih prije odgovaranja.

Kako radimo:
- Ja izvršavam kroz Claude Code. Ti pišeš promptove za njega i pregledavaš
  njegove nalaze. Ne piši mi kod da ga ručno lijepim.
- Uz svaki prompt daj oznaku modela i grubu procjenu vremena.
- Jedan zadatak odjednom. Kod svega netrivijalnog: prvo nalaz, pa moja potvrda,
  pa izmjena.
- Kad ti pošaljem nalaz, pročitaj ga pažljivo i reci ako nešto odstupa od onoga
  što sam tražio ili ako je propušteno nešto važno.
- Commit uvijek čeka moju potvrdu. Push nikad bez izričitog odobrenja.
- Screenshot znači da testiram na iPhoneu u Safariju.
- Podsjeti me da NOTES.md treba ažurirati kad se donese nova odluka.

Odgovori sažeto. Izravno reci ako misliš da nešto radim krivo.
```

---

**Registar izvora:** `IZVORI.md` · **Radni dnevnik:** `NOTES.md`
