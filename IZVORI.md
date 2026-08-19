# IZVORI.md — odakle dolazi svaki podatak u Pokazateljima

Sve brojke u `TRZISTE`, `SERIJE`, `CPI`, `KS_*`, `STUP*`, `HPI_GOD`, `NEK_*`
su hardkodirane i ažuriraju se RUČNO. Ovaj file je jedini zapis o tome
odakle. Prije svake izmjene brojke: otvori izvor, prepiši, zapiši razdoblje.

**Pravilo: isključivo primarni izvor (DZS, HNB, HZMO, HANFA, APN, NN).
Nikad medijski portal, nikad agregator, nikad drugi kalkulator.**

Zadnja potpuna provjera: 18. 8. 2026. (inflacija ažurirana 19. 8. 2026. na srpanj)

---

## Inflacija (CPI)

- Izvor: DZS, priopćenja "Indeksi potrošačkih cijena"
- Pregled: https://podaci.dzs.hr/hr/podaci/cijene/
- Zadnje korišteno: srpanj 2026. — CIJ-2026-1-1/7, https://podaci.dzs.hr/2026/hr/121443
  (prethodno lipanj 2026. — https://podaci.dzs.hr/2026/hr/121577)
- Ritam: prva procjena ~1. u mjesecu, KONAČNI podaci ~15.
- **Koristiti konačne, ne prvu procjenu.** Šifra `1-1` = mjesečna (konačna)
  serija; `1-2` je prva procjena.
- Provjereno 19.8.2026: godišnje 3,9 %, mjesečno −0,2 % — poklapa se s kodom.
  Portal je prije ove provjere bio jednu objavu u zaostatku (imao je lipanj
  4,5 % / −0,4 % dok je srpanj već bio objavljen 14.8.2026.).
- **HICP (harmonizirani indeks) NIJE CPI** — u istom priopćenju, u tablici T3,
  stoji i harmonizirana stopa (za srpanj 2026: 3,6 % godišnje, +0,6 %
  mjesečno). Lako se zamijeni s CPI-jem jer su brojevi blizu i u istom
  dokumentu. Portal koristi ISKLJUČIVO CPI (tablica T1 u prilogu), nikad HICP.
- Napomena: od siječnja 2026. CPI se računa po ECOICOP ver. 2, nova bazna
  godina 2025 = 100. Serije prije toga nisu na istoj bazi.
- **Od siječnja 2026. ECOICOP ver. 2 ima 13 skupina, ne 12** (ver. 1 je imala
  12). Razdvojene su npr. "Usluge osiguranja i financijske usluge" i "Osobna
  njega, socijalna zaštita i razna roba i usluge" — ranije spojene u "Ostala
  dobra i usluge". `KOSARICA` u kodu mora imati svih 13 skupina.
- **`KOSARICA` (težine i stope po skupinama) ažurira se ZAJEDNO s naslovnom
  stopom**, ne zasebno. Izvor: prilog priopćenja
  (`cij-2026-1-1_N_tablice-hr.xlsx`, list T1), stupac "Ponderi" (DZS ih
  objavljuje u PROMILIMA — podijeliti s 10 za %) i stupac s godišnjom stopom
  promjene za zadnji mjesec.
- **Zbroj doprinosa po skupinama (Σ w·r / 100) NIJE jednak naslovnoj stopi, i
  to NIJE greška.** Za srpanj 2026: zbroj doprinosa = 3,77 %, naslovna stopa =
  3,9 %. CPI se agregira preko indeksa i ulančavanja, ne kao ponderirani
  prosjek zaokruženih stopa po skupinama — isto "odstupanje" (3,76) postoji i
  u samom priopćenju, u zbroju objavljenih doprinosa. Portal to eksplicitno
  objašnjava korisniku (kartica "Od čega se sastoji potrošačka košarica").
  Prijašnja verzija `KOSARICA` (12 skupina, ver. 1) imala je stope koje se
  NISU poklapale ni s jednom stvarnom DZS objavom — bile su obrnuto izvedene
  da zbroj ispadne točno jednak naslovnoj stopi, i pogrešno pripisane DZS-u.
  Ne vraćati taj pristup: unositi isključivo objavljene brojke.

## Plaće

- Izvor: DZS, priopćenja "Prosječne mjesečne neto i bruto plaće"
- Pregled: https://podaci.dzs.hr/hr/podaci/trziste-rada/
- Zadnje korišteno: svibanj 2026. — https://podaci.dzs.hr/2026/hr/121467
- Ritam: mjesečno, s ~2 mjeseca zaostatka (zato ZADNJE_PLACE kasni za CPI-om)
- Provjereno 18.8.2026: neto 1.552 €, bruto 2.178 €, medijalna neto 1.324 € — poklapa se.
- Minimalna bruto plaća: Uredba Vlade RH, NN 132/2025 → 1.050,00 € za 2026.
  https://mrosp.gov.hr/vijesti/minimalna-placa-za-2026-godinu-1-050-eura-bruto/13826
  Mijenja se jednom godišnje, uredbom u listopadu za sljedeću godinu.
- Napomena: od siječnja 2026. podaci se iskazuju prema NKD-u 2025.

## Kamatne stope i iznosi kredita

- Izvor: HNB, **Tablica G2** — Kamatne stope kreditnih institucija na kredite
  kućanstvima (novi poslovi), vagani mjesečni prosjeci
- Stranica: https://www.hnb.hr/statistika/statisticki-podaci/financijski-sektor/druge-monetarne-financijske-institucije/kreditne-institucije/kamatne-stope
- Lokalna kopija tablice: `h-g2-2.xlsx` (nije u repozitoriju)
- Zadnje korišteno: lipanj 2026.
- Ritam: mjesečno
- Provjereno 18.8.2026: stambeni 2,90 %, gotovinski nenamjenski 5,42 %,
  novi stambeni krediti 316,59 mil € — poklapa se s kodom u decimalu.
- **ODLUKA (18.8.2026): portal prikazuje NOMINALNU stopu i mora je tako
  označiti** ("prosječna nominalna kamatna stopa, HNB"). Nominalna se
  zadržava jer je to glavna serija koju HNB objavljuje i na kojoj stoji
  povijesni niz od 175 mjeseci. **EKS se dodaje kao druga brojka uz nju**
  (stambeni EKS lipanj 2026: 3,25 %), jer je to ono što banka po zakonu
  oglašava. EKS NE zamjenjuje nominalnu — inače bi se graf i naslov razišli.
  Izmjena u index.html još nije provedena.
- **HNB tiho revidira već objavljene mjesece — nema oznake koja bi to trajno
  pamtila.** Ažuriranje datoteke od 4.8.2026. bilo je opisano kao "ispravak
  EKS-a travanj i lipanj 2026.", što znači da je **3,25 % (stambeni EKS,
  lipanj 2026.) koje portal prikazuje samo revidirana vrijednost**, ne
  izvorno objavljena. `?version=` na URL-u datoteke vraća 404 (nema povijesti
  verzija), a marker koji HNB ponekad stavlja uz revidirane brojke u samoj
  tablici se naknadno briše. Praktična posljedica: ne pretpostavljati da je
  jednom pročitana brojka za prošli mjesec i dalje ista — kod svake provjere
  pročitati cijeli zadnji objavljeni mjesec iznova, ne samo najnoviji.
- Napomena: od siječnja 2023. svi podaci se odnose samo na kredite u eurima;
  povijesni redci uključuju kune s valutnom klauzulom.

## Mirovine (1. stup)

- Izvor: HZMO, "Aktualna statistika za <mjesec> — isplata u <mjesec+1>"
- Pregled: https://www.mirovinsko.hr/hr/statistika/860
- Pregled osnovnih podataka: https://www.mirovinsko.hr/hr/statistika/3757
- Zadnje korišteno: lipanj 2026. (isplata u srpnju)
  https://www.mirovinsko.hr/hr/aktualna-statistika-za-lipanj-2026-isplata-u-srpnju-2026/148
- Ritam: mjesečno; URL sadrži naziv mjeseca pa se mijenja svaki mjesec
- Provjereno 18.8.2026: 721,73 € i 46,50 % i 1:1,46 — poklapa se u decimalu.
- **Definicija koju portal prikazuje, ne mijenjati bez odluke:**
  prosječna UKUPNA starosna mirovina, ZOMO, BEZ međunarodnih ugovora
  (lipanj 2026: 530.471 korisnika). HZMO objavljuje i druge brojke za
  "prosječnu mirovinu" (npr. 879,28 € za 40+ godina staža) — nisu istog obuhvata.
- Udio u plaći se računa prema neto plaći za svibanj 2026. (1.552 €), dakle
  mirovina i plaća NISU iz istog mjeseca. Tako to radi i HZMO.
- **`ZADNJE_HZMO` i `ZADNJE_HANFA` su ODVOJENE konstante i moraju ostati
  odvojene.** HZMO (1. stup, ovaj odjeljak) i HANFA (2./3. stup, odjeljak
  ispod) su različite institucije s vlastitim kalendarima objave. Da danas
  obje nose "lipanj 2026." je slučajnost dvaju trenutno usklađenih ciklusa,
  ne strukturno jamstvo — sutra HZMO može objaviti novi mjesec dok je HANFA
  još na starom, ili obrnuto. Spajanje u jednu konstantu bilo bi tiho
  pogrešno točno onog dana kad se ciklusi razmaknu.
- `STUP1.mirovina40Mjesec` je **treća**, neovisna vrijednost (danas svibanj
  2026., mjesec iza `ZADNJE_HZMO`): razrada za 40+ godina staža unutar ISTE
  HZMO objave kasni jedan mjesec za glavnom brojkom. Ne spajati ni s
  `ZADNJE_HZMO` — dokazana druga vintage, ne nepažnja.

## Mirovinski fondovi (2. i 3. stup)

- Izvor: HANFA, mjesečno izvješće
- Pregled svih mjesečnih izvješća: https://www.hanfa.hr/statistika/mjesecna-izvjesca/
- RSS (globalan, sve HANFA vijesti, ne samo statistika): https://hanfa.hr/rss
- Zadnje korišteno: lipanj 2026. — https://hanfa.hr/vijesti/mjesecno-izvjesce-za-lipanj-2026
- Ritam: mjesečno
- Provjereno 18.8.2026: kategorija B 73,73 % (A 23,16 %, C 3,11 %),
  neto imovina OMF-ova 28,7 mlrd € — poklapa se.

## Nekretnine — indeks cijena

- Izvor: DZS, priopćenja "Indeksi cijena stambenih objekata"
- Pregled: https://podaci.dzs.hr/hr/podaci/cijene/indeksi-cijena-stambenih-objekata/
- Zadnje objavljeno: I. tromjesečje 2026. — https://podaci.dzs.hr/2026/hr/121605
- Tablice: https://podaci.dzs.hr/media/4i3ntich/cij-2026-2-1_1_tablice-hr.xlsx
- Cijeli niz (PC-Axis): https://web.dzs.hr/PX-Web.asp?url=%22Hrv/Archive/stat_databases.htm%22
- Alternativni izvori istog podatka (oba obična preuzimanja, bez PC-Axisa):
  - HNB, **Tablica J3 "Indeksi cijena stambenih objekata"**:
    https://www.hnb.hr/documents/20182/840f0cd0-8480-4b7b-aeaf-40042a456ff9
    (nalazi se na https://hnb.hr/statistika/statisticki-podaci/odabrane-nefinancijske-statistike/indeksi-cijena)
    URL je trajan — HNB mijenja sadržaj datoteke, ne adresu.
    Danas nosi Q1 2026. (zadnja izmjena 21.7.2026., NAKON DZS revizije od
    2.7.2026.) — prijašnja tvrdnja da J3 kasni za DZS-om (zadnja izmjena bila
    21.4.2026., prije revizije) više ne vrijedi, provjereno 19.8.2026.
  - Eurostat, skup podataka `prc_hpi_q`:
    https://ec.europa.eu/eurostat/databrowser/view/prc_hpi_q/default/table?lang=en
    Filtrirati Croatia, preuzeti CSV. **Eurostat je na bazi 2015 = 100**, drži
    svoju referentnu godinu neovisno od DZS-a — neće dati DZS-ovu novu bazu.
- Ritam: tromjesečno. Objave: 2.7.2026 (Q1), 1.10.2026 (Q2),
  8.1.2027 (Q3), 5.4.2027 (Q4)
- Provjereno 18.8.2026: godišnji rast **14,3 %** za Q1 2026. Ispravljeno u
  kodu (`1d74c37`), prikazuje se na sva tri mjesta s istim brojem decimala.
- Novi ukupni indeks za Q1 2026. na bazi 2025 = 100 iznosi **108,36**
  (korisno kao provjera kad se niz jednom zamijeni).
- **ODLUKA (18.8.2026): `HPI_GOD` niz se NE mijenja prije lansiranja.**
  Ispravlja se samo prikazana brojka rasta (11,0 % → 14,3 %), koja je ono što
  korisnik čita i koja je potvrđena iz DZS priopćenja.
  Obrazloženje: za graf trenda bazna godina je nebitna — oblik krivulje je
  isti na 2015 = 100 i na 2025 = 100, bitno je samo da su sve točke na ISTOJ
  bazi, što postojeći niz jest. Zamjena cijelog niza (revizija 2002.–2025. +
  nova baza) ide **poslije lansiranja**, zajedno s migracijom i živim
  podacima. Zapisano u NOTES.md §6.
- **ODLUKA (18.8.2026): banner za Nekretnine ne kaže više "Zadnje ažuriranje"
  nego "Indeks cijena: prvo tromjesečje 2026."** — kategorija ima tri
  razdoblja (HPI Q1 2026., dozvole lipanj 2026., kupoprodaje 2025.) pa jedan
  datum ne može stajati za sve. Nova formulacija tvrdi samo ono što jest.
  Izmjena u index.html još nije provedena.
- **ODLUKA (19.8.2026): `HPI_GOD` sadrži GODIŠNJE PROSJEKE. Zadnji redak
  (2026.) je tromjesečno očitanje Q1 2026. i NE ulazi u izračune rasta**
  (`hpiGod()`, `nkRast`, `nkProsjekGod`, omjer za kuće-ikone, "kupiš X m²")
  jer bi ti izračuni dijelili dvije različite mjere — tromjesečno očitanje s
  godišnjim prosjekom. To je davalo **10,9 %** umjesto **14,3 %** na tooltipu
  zadnjeg stupca grafa, i kontaminiralo je ZADANI prikaz (`nekOd: 2015,
  nekDo: 2026`), ne rubni slučaj. U kodu: konstanta `HPI_GOD_NEPUNA`
  označava koju godinu (danas 2026) treba isključiti, a `HPI_PUNE` je
  filtrirani niz koji sva aritmetika koristi umjesto `HPI_GOD` izravno. Redak
  se NE briše iz `HPI_GOD` — ostaje kao podatak, samo se ne računa s njim.
  **Prava godišnja vrijednost za 2026. smije se vratiti u niz (postaviti
  `HPI_GOD_NEPUNA = null`) tek kad je DZS objavi** (očekivano početkom
  2027., uz reviziju), ne pri sljedećim tromjesečnim objavama (npr.
  1.10.2026., Q2). **14,3 % ({HPI_RAST}, kartica, ticker, bluf) ostaje
  netaknuto** — postoji samo kao ručno unesena `TRZISTE` vrijednost i
  strukturno je neizvediva iz `HPI_GOD`, jer niz nema tromjesečnu vrijednost
  za Q1 2025 s kojom bi se Q1 2026 mogao usporediti tromjesečje-na-
  tromjesečje.
- Napomena: DZS od Q1 2026. objavljuje i stope promjene broja i vrijednosti
  prodanih objekata. Q1 2026: broj −42,2 %, vrijednost −35,4 % godišnje.

## Nekretnine — cijena po gradu

- **ODLUKA (18.8.2026): portal NE prikazuje cijene po gradu.** Tablica
  `NEK_GRAD` uklonjena je u cijelosti (`4ffd793`). Razlog: brojke nisu imale
  potvrdiv primarni izvor (od 25 gradova samo se Split poklapao s MPGI
  tablicom), a MPGI za Grad Zagreb objavljuje cijene po katastarskim općinama
  pa jedna vrijednost za Zagreb ne postoji. Bez Zagreba tablica nema smisla.
- Na njeno mjesto ide kartica s objašnjenjem i linkom na izvor.
- Izvor na koji portal upućuje: **MPGI** (Ministarstvo prostornoga uređenja),
  podatke izračunava Ekonomski institut Zagreb iz sustava eNekretnine.
  https://mpgi.gov.hr/prosjecne-cijene-stanova-za-primjenu-u-2026/18577
- **URL sadrži godinu i mijenja se svake godine** — provjeriti i ažurirati
  link u `index.html` pri svakoj novoj objavi (početak godine).
- Ako se ikad odluči vratiti prikaz cijena: vrijednosti moraju biti iz MPGI
  tablice, uz obaveznu napomenu da su to administrativne referentne cijene za
  izračun poticaja, ne tržišni prosjek, i da je iz novogradnje izuzet PDV.
  Za Zagreb treba urednička odluka (raspon, jedna općina, ili izostavljanje).

## JLS stope poreza na dohodak (kalkulator plaće)

- Izvor: Ministarstvo financija / Porezna uprava, službena zbirna tablica
  "Porezne stope godišnjeg poreza na dohodak" — svaka JLS donosi vlastitu
  odluku, Porezna uprava ih sažima u jednu tablicu za cijelu državu.
- Pregled: https://porezna-uprava.gov.hr/hr/porezne-stope-godisnjeg-poreza-na-dohodak/4764
- Zadnje korišteno: tablica za 2026. —
  https://porezna-uprava.gov.hr/hr/stope-godisnjeg-poreza-na-dohodak-za-2026-godinu/8166
- Ritam: godišnje. Odluke JLS-ova moraju biti objavljene u Narodnim novinama
  do 15.12. za sljedeću godinu; Porezna uprava objavljuje zbirnu tablicu
  nakon toga, obično u prosincu.
- Konstanta u kodu: `GRADOVI` (index.html, uz `const JLS_GODINA`), 556
  unosa `'Naziv JLS-a': [niža stopa, viša stopa]`. `JLS_GODINA` nosi samo
  godinu za prikaz — GRADOVI se pri godišnjem ažuriranju prepisuje ručno u
  cijelosti, ne izvodi se iz JLS_GODINA.
- `GRAD_ALIAS` (uz GRADOVI) prevodi nazive koje korisnik stvarno upiše u
  službeni ključ tablice (npr. "Pula" → "Pula - Pola"). **Mora se ažurirati
  pri svakom preimenovanju ili spajanju JLS-a** — inače stari alias ostaje
  mrtav, a novi službeni naziv nema alias, pa korisnik koji je prije uspio
  dobiva "grad nije prepoznat" za isto ime.
- Otok, Privlaka, Sveta Nedelja i Novigrad postoje dvaput (dvije JLS s istim
  imenom, različita županija) — tablica nema stupac županije pa su ručno
  razdvojeni prema pojedinačnim odlukama, ključ nosi županiju u zagradi
  (npr. "Otok (Splitsko-dalmatinska)"). Bare ime se NAMJERNO ne pogađa u
  aliasu za te četiri JLS — korisnik mora dobiti signal i sam odabrati
  županiju, jer bi tiho pogađanje jedne od dvije različite stope bilo
  neprovjerljivo. Vidi komentar uz GRAD_ALIAS u kodu.
- Provjereno 19.8.2026: svih 556 unosa uspoređeno red-po-red s xlsx tablicom
  za 2026. (skriptom, ne ručno) — poklapaju se.
- **Oroslavje, riješeno (`1b7d82c`):** službena tablica ima `OROSLAVJE*`,
  jedini naziv sa zvjezdicom bez legende u svih 592 retka; NN 152/2023
  (odluka Grada Oroslavja) navodi nižu stopu 18,0 %, a zbirna tablica i
  dalje 20,0 %, uz spornu proceduru odluke (v. NOTES.md §5). Zadržano 20/30
  i uklonjena zvjezdica iz naziva — portal slijedi zbirnu tablicu Porezne
  uprave kao propisani izvor i ne ispravlja je vlastitim čitanjem NN-a, isti
  princip kao kod HNB revizija. Obrazloženje uz sam unos u `GRADOVI`.

---

## Postupak ažuriranja

1. Otvori izvor iz ovog filea. Nikad Google, nikad portal.
2. Prepiši brojku i razdoblje.
3. Ažuriraj konstantu u `index.html` I odgovarajući `ZADNJE_*`.
4. Provjeri prikazuje li se ista brojka na više mjesta (ticker, kartica,
   sažetak) — vidi NOTES.md §3 o broju decimala.
5. Zapiši datum provjere u ovaj file.
