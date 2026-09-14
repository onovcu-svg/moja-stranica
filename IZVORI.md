# IZVORI.md — odakle dolazi svaki podatak u Pokazateljima

Sve brojke u `TRZISTE`, `CPI`, `KS_*`, `STUP*`, `PLACE_GOD`, `HPI_GOD`
su hardkodirane i ažuriraju se RUČNO. Ovaj file je jedini zapis o tome
odakle. Prije svake izmjene brojke: otvori izvor, prepiši, zapiši razdoblje.

**Pravilo: isključivo primarni izvor (DZS, HNB, HZMO, HANFA, APN, NN).
Nikad medijski portal, nikad agregator, nikad drugi kalkulator.**

Zadnja potpuna provjera: 21. 8. 2026. (inflacija ažurirana 19. 8. 2026. na srpanj)

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
- Zadnje korišteno: lipanj 2026. — RAD-2026-1-1/6, https://podaci.dzs.hr/2026/hr/121493
  (prethodno svibanj 2026. — https://podaci.dzs.hr/2026/hr/121467)
- Ritam: mjesečno, s ~2 mjeseca zaostatka (zato ZADNJE_PLACE kasni za CPI-om)
- Provjereno 18.8.2026: neto 1.552 €, bruto 2.178 €, medijalna neto 1.324 € — poklapa se.
- Provjereno 21.8.2026: neto 1.555 €, bruto 2.184 €, medijalna neto 1.345 €,
  medijalna bruto 1.850 € — poklapa se.
- Minimalna bruto plaća: Uredba Vlade RH, NN 132/2025 → 1.050,00 € za 2026.
  https://mrosp.gov.hr/vijesti/minimalna-placa-za-2026-godinu-1-050-eura-bruto/13826
  Mijenja se jednom godišnje, uredbom u listopadu za sljedeću godinu.
  **Od 14.9.2026. konstante `MIN_PLACA` i `MIN_PLACA_GODINA`** (prije bio
  string literal zakopan izravno u kartici) — ažurirati oba polja, ne samo iznos.
- Napomena: od siječnja 2026. podaci se iskazuju prema NKD-u 2025.
- **`PLACE_GOD` (godišnji niz 2010.-2026., graf na `/pokazatelji/place`)
  zamijenjen stvarnim DZS vrijednostima 14.9.2026., nakon što je nalaz
  8.9.2026. pokazao da je bio dijelom izveden, ne prepisan.**
  Prosjek (neto i bruto) je **godišnji prosjek**, iz DZS-ovih godišnjih
  priopćenja: Narodne novine za 2010.-2022. (kune, preračunato po fiksnom
  tečaju 7,53450 kn/€), izravno u eurima za 2023.-2025. Provjereno za svih
  16 godina, primarni izvor za svaku.
  Medijan (neto i bruto, 2016.-2025.) je **prosinačka** vrijednost te godine,
  ne godišnji prosjek — **DZS medijalnu plaću ne objavljuje kao godišnji
  prosjek, samo mjesečno.** Provjereno u svih 7 godišnjih priopćenja
  2016.-2022. (nijedno je ne spominje) i u godišnjim objavama 2023.-2025.
  (isto). Medijan je zato uzet iz DZS-ovih PROSINAČKIH mjesečnih objava,
  svih 10 godina, primarni izvor za svaku (arhiva `web.dzs.hr` za
  2016.-2022., `podaci.dzs.hr`/`dzs.gov.hr` izravno u eurima za
  2023.-2025.). Ovo je sad i eksplicitno označeno na portalu (graf, tooltip,
  kartice, FAQ), gdje je prije bilo predstavljeno kao da je iste vrste kao
  prosjek.
  Zadnji redak (2026.) ostaje zadnji objavljeni mjesec (lipanj), nedirano —
  već potvrđeno u ovom fileu iznad.
  **Prijašnje vrijednosti bile su dijelom izvedene, ne prepisane:** omjer
  neto/bruto (prosjek) bio je 0,7120-0,7126 kroz svih 17 godina niza — dok
  stvaran DZS omjer u istim tim godinama varira 0,696-0,736 (dvije porezne
  reforme). Isti potpis kod bruto medijana (omjer 0,716-0,717 naspram
  stvarnog 0,849-0,857). Zaključak: bruto stupac (prosjek i medijan) nije bio
  neovisno preuzet od DZS-a nego računat kao `neto × ~1,404`. Neto stupac je
  bio jednom prepisan pa otad zastario bez ponovne provjere — 2010. je
  gotovo točno pogodio izvor, ali odstupanje raste kroz godine i posebno
  ubrzava 2022.-2025. (2024. odstupao 53 €, 2025. čak 99 €).
  Uveden `PLACE_GOD_NEPUNA`/`PLACE_PUNE` (isti obrazac kao `HPI_GOD_NEPUNA`/
  `HPI_PUNE` kod nekretnina): zadnji redak ne ulazi u izračun "Rast
  prosjeka"/"Rast medijana", jer bi usporedio godišnji prosjek (ili
  prosinac) s jednim mjesecom. Rast prosjeka sad ide 2010.-2025.: **104,4 %**
  (bilo 119,3 %, staro poklapanje bilo je slučajno, ne metodom — oba kraja
  starog niza bila su gotovo točna pa je greška u sredini niza bila
  nevidljiva u ovom izračunu). Rast medijana ide prosinac 2016.-prosinac
  2025.: **96,0 %** (bilo 100,4 %, i miješalo je prosinac s lipnjem).
- **ODLUKA (19.8.2026): tablica SEKTORI (plaće po djelatnostima) uklonjena je
  u cijelosti.** Od 21 vrijednosti samo 2 su bile objavljene (dva ekstrema iz
  DZS vijesti), 1 je bila u izravnoj suprotnosti s izvorom (farmaceutska
  proizvodnja 4.281 € nasuprot DZS-ovom izričito navedenom maksimumu od
  2.364 € za isto razdoblje), a 18 bez ikakvog izvora. Tablica je miješala
  dvije razine NKD klasifikacije (sekcije i uže odjeljke u istom stupcu) i
  prikazivala se pod oznakom "Izvor: DZS, statistika plaća". DZS u mjesečnom
  priopćenju NE objavljuje raščlambu plaća po djelatnostima — samo najvišu i
  najnižu, u prozi vijesti, ne u tablici. Ako se prikaz ikad vrati, mora imati
  puni objavljeni raspon, ne interpolaciju između krajnosti.

## Kamatne stope i iznosi kredita

- Izvor: HNB, **Tablica G2** — Kamatne stope kreditnih institucija na kredite
  kućanstvima (novi poslovi), vagani mjesečni prosjeci
- Stranica: https://www.hnb.hr/statistika/statisticki-podaci/financijski-sektor/druge-monetarne-financijske-institucije/kreditne-institucije/kamatne-stope
- Lokalna kopija tablice: `h-g2-2.xlsx` (nije u repozitoriju)
- Zadnje korišteno: srpanj 2026.
- Ritam: mjesečno
- Provjereno 18.8.2026: stambeni 2,90 %, gotovinski nenamjenski 5,42 %,
  novi stambeni krediti 316,59 mil € — poklapa se s kodom u decimalu.
- Provjereno 1.9.2026: stambeni 2,91 %, gotovinski nenamjenski 5,39 %,
  novi stambeni krediti 370,46 mil € — poklapa se s kodom u decimalu.
  Lipanjske vrijednosti u tablici (prije ovog ažuriranja) poklapale su se s
  onim što je portal imao, mapiranje stupaca potvrđeno neovisnim
  preračunom "godišnje promjene" (ZI−12) iz postojećih nizova.
- **ODLUKA (18.8.2026, revidirana 19.8.): portal prikazuje i nominalnu i
  EKS.** Kartice na vrhu prikazuju nominalnu (2,90 % stambeni, 5,42 %
  gotovinski), a tablica niže na istoj stranici ("Prosječne kamatne stope na
  jednom mjestu") ima oba stupca — Nominalna i EKS — uz stupac Razlika u
  postotnim bodovima i uvodni tekst koji objašnjava razliku i upućuje da se
  ponude uspoređuju po EKS-u. Kod ažuriranja podataka ažurirati OBA stupca.
  (Ranija verzija ove odluke tvrdila je da EKS treba dodati i da izmjena
  "još nije provedena" — netočno, tablica je već imala oba stupca.)
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
- **UPOZORENJE (1.9.2026): "Za ostale namjene" NIJE "Gotovinski nenamjenski
  krediti".** Mediji su za srpanj 2026. navodili "gotovinski 5,29 %" — to je
  redak "Za ostale namjene" (`KS_OSTALE`), portal koristi "Gotovinski
  nenamjenski krediti" (`KS_GOTOVINSKI`, 5,39 % za srpanj). Dvije različite
  kategorije u istoj tablici G2, lako se zamijene.
- **ODLUKA (1.9.2026): svih 14 KS_* nizova ažurira se svaki mjesec**, uklj.
  `KS_PREKORACENJE`/`KS_KARTICE`/`KS_OSTALE`/`KS_EKSOSTALE`/
  `KS_IZNOSREVOLVING` koji se danas nigdje ne prikazuju (dead — nijedan se
  ne indeksira s `[ZI]` u predlošku). Odstupa od pravila "ne ažuriraj mrtvo
  polje" (vidi STUP2.imovina) jer su ovo rastući mjesečni nizovi dijeljene
  duljine (`KS_MJ`) — preskakanje bi ih ostavilo kraćima od ostalih i
  otvorilo rupu (`undefined`) ako se ikad počnu prikazivati. STUP2.imovina
  nije taj slučaj: ondje se vrijednost PREPISUJE svaki mjesec, ne dodaje.

## Mirovine (1. stup)

- Izvor: HZMO, "Aktualna statistika za <mjesec> — isplata u <mjesec+1>"
- Pregled: https://www.mirovinsko.hr/hr/statistika/860
- Pregled osnovnih podataka: https://www.mirovinsko.hr/hr/statistika/3757
- Zadnje korišteno: srpanj 2026. (isplata u kolovozu)
  https://www.mirovinsko.hr/hr/aktualna-statistika-za-srpanj-2026-isplata-u-kolovozu-2026/148
  (napomena 1.9.2026: stara URL adresa za lipanj sad preusmjerava/prikazuje isti,
  najnoviji sadržaj — HZMO očito ne drži zasebne arhivirane stranice po mjesecu,
  nego prepisuje istu adresu. Nema načina provjeriti prošlu objavu preko URL-a.)
- Ritam: mjesečno; URL sadrži naziv mjeseca pa se mijenja svaki mjesec
- Provjereno 18.8.2026: 721,73 € i 46,50 % i 1:1,46 — poklapa se u decimalu.
- **Definicija koju portal prikazuje, ne mijenjati bez odluke:**
  prosječna UKUPNA starosna mirovina, ZOMO, BEZ međunarodnih ugovora
  (srpanj 2026: 531.375 korisnika). HZMO objavljuje i druge brojke za
  "prosječnu mirovinu" (npr. 879,69 € za 40+ godina staža) — nisu istog obuhvata.
- Udio u plaći se računa prema neto plaći za lipanj 2026. (1.555 €), dakle
  mirovina i plaća NISU iz istog mjeseca. Tako to radi i HZMO.
- **Udjeli mirovine u plaći (46,50 % i 56,65 %) se PREUZIMAJU od HZMO-a, ne
  računaju iz `prosjecnaMirovina`/`prosjecnaPlaca`.** HZMO ih objavljuje
  doslovno, s izričito navedenim razdobljem plaće koje koristi u tom
  izračunu — obično mjesec starije od zadnje DZS objave, jer HZMO svoj
  izvještaj sastavlja prije nego DZS objavi noviji mjesec. Pri svakom
  ažuriranju upisati OBA broja iz izvora: i postotak i razdoblje plaće
  (`STUP1.udioPlace`/`udio40Place`/`placaMjesec`) — ne preračunavati ih sami
  niti pretpostaviti da je to razdoblje isto kao `ZADNJE_PLACE` (DZS).
- Provjereno 21.8.2026: 879,28 € (40+ godina staža), 46,50 % i 56,65 % —
  poklapa se doslovno s izvorom.
- Provjereno 1.9.2026: 722,01 € i 46,43 % i 1:1,46 — poklapa se u decimalu.
  879,69 € (40+ godina staža) i 56,57 % — poklapa se doslovno s izvorom.
- **`ZADNJE_HZMO` i `ZADNJE_HANFA` su ODVOJENE konstante i moraju ostati
  odvojene.** HZMO (1. stup, ovaj odjeljak) i HANFA (2./3. stup, odjeljak
  ispod) su različite institucije s vlastitim kalendarima objave. Da danas
  obje nose "lipanj 2026." je slučajnost dvaju trenutno usklađenih ciklusa,
  ne strukturno jamstvo — sutra HZMO može objaviti novi mjesec dok je HANFA
  još na starom, ili obrnuto. Spajanje u jednu konstantu bilo bi tiho
  pogrešno točno onog dana kad se ciklusi razmaknu.
- **ODLUKA (1.9.2026): `STUP1.mirovina40Mjesec` više NIJE zasebna vrijednost
  — izjednačena je s `ZADNJE_HZMO`** (vezana na konstantu, ne kopirana kao
  literal). Raniji zapis ("kasni jedan mjesec za glavnom brojkom ISTE HZMO
  objave") bila je naša interpretacija bez oslonca u izvoru: provjereno
  izravno u sirovom HTML-u objave za srpanj 2026, rečenica uz 879,69 € NE
  navodi zaseban mjesec za tu brojku — jedini mjesec u rečenici
  ("za lipanj 2026.") odnosi se na plaću u omjeru, isto kao i za glavnu
  mirovinu. Dok izvor ne kaže drugačije, tretira se kao dio iste srpanjske
  objave kao i ostatak stranice. **Ako se ikad pokaže da HZMO ovu brojku
  stvarno objavljuje s drugim razdobljem** (npr. eksplicitno "za svibanj
  2026." uz samu mirovinu, ne uz plaću), vratiti zaseban literal ovdje i
  ukloniti vezu na `ZADNJE_HZMO`.

## Mirovinski fondovi (2. i 3. stup)

- Izvor: HANFA, mjesečno izvješće
- Pregled svih mjesečnih izvješća: https://www.hanfa.hr/statistika/mjesecna-izvjesca/
- RSS (globalan, sve HANFA vijesti, ne samo statistika): https://hanfa.hr/rss
- Zadnje korišteno: srpanj 2026. — https://hanfa.hr/vijesti/mjesecno-izvjesce-za-srpanj-2026
- Ritam: mjesečno
- Provjereno 18.8.2026: kategorija B 73,73 % (A 23,16 %, C 3,11 %),
  neto imovina OMF-ova 28,7 mlrd € — poklapa se.
- Provjereno 21.8.2026: kategorija B 73,51 % (A 23,45 %, C 3,04 %),
  neto imovina OMF-ova 28,8 mlrd € — poklapa se.

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
  — iskorišten 14.9.2026. kao zadnji (nepuni) redak zamijenjenog `HPI_GOD`
  niza, vidi ODLUKU ispod.
- **ODLUKA (18.8.2026): `HPI_GOD` niz se NE mijenja prije lansiranja — POVUČENA
  14.9.2026.** Pretpostavka na kojoj je odluka počivala ("za graf trenda
  bazna godina je nebitna — oblik krivulje je isti na 2015 = 100 i na
  2025 = 100") vrijedi SAMO za čistu preskalaciju (množenje svake vrijednosti
  konstantom). DZS-ova promjena baze od 2.7.2026. NIJE bila čista
  preskalacija — uz novu bazu revidirane su i same vrijednosti niza.
  DZS to i izričito navodi u fusnoti tablice: "Revidirani su podaci za
  razdoblje od prvog tromjesečja 2002. do četvrtog tromjesečja 2025."
  Odstupanje svake godine od onoga što bi dala čista preskalacija kretalo se
  od −6,0 % do +10,5 %, dakle nije konstantno — dokaz da je riječ o pravoj
  metodološkoj reviziji, ne samo o promjeni baze. Portal je do 8.9.2026.
  prikazivao **115,6 %** ukupnog rasta 2015.–2025.; stvarna vrijednost po
  revidiranom nizu je **127,1 %**. Cijeli `HPI_GOD` niz zamijenjen je
  14.9.2026. revidiranim nizom (2025. = 100), zajedno sa svim hardkodiranim
  tekstovima koji su spominjali staru bazu ("2015. = 100"). Zapisano u
  NOTES.md §6.
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

## Nekretnine — aktivnost tržišta

- **ODLUKA (19.8.2026): tablica `NEK_AKT` (dozvole i kupoprodaje po
  godinama, graf "Aktivnost tržišta") uklonjena je u cijelosti.** Razlog:
  od 8 neovisno provjerenih vrijednosti (7 godina dozvola prema DZS-ovim
  godišnjim priopćenjima GRAD-*-3-2, i 2025. kupoprodaje prema MPGI/EIZ
  "Pregledu tržišta nekretnina RH 2025.") nijedna nije odgovarala izvoru.
  Kupoprodaje su bile **79–87 % previsoke** (36.400 nasuprot stvarnih 20.293
  kupoprodaja stanova; 18.900 nasuprot 10.097 kuća, 2025.), a smjer je bio
  **obrnut** — portal je prikazivao rast dok je tržište kupoprodaja stvarno
  palo 21,7 % u 2025. i 9,7 % u 2024. Dozvole su odstupale do 10,2 % uz tri
  obrnuta smjera promjene (2018., 2023., 2025.) od sedam provjerenih godina.
  Komentar uz konstantu nije nosio nikakvu ogradu (za razliku od `HPI_GOD`/
  `SEKTORI`, koji su imali "FALLBACK") — prikazivao se s punim samopouzdanjem
  kao objavljena brojka.
- **Rekonstrukcija nije moguća.** MPGI-jev prilog po JLS-ovima ima potisnute
  vrijednosti (zbroj po JLS-ovima podcjenjuje ukupni broj kupoprodaja za
  2,7–11,3 %, ovisno o godini) i nije usporediv prije 2018. jer se sustav
  eNekretnine tek punio podacima — broj JLS-ova bez ijednog zabilježenog
  podatka pada s 206 (2012.) na 14 (2018.), pa rast "kupoprodaja kuća" s
  2.112 na 10.217 u tom razdoblju odražava pokrivenost baze, ne stvarno
  tržište.
- Na mjesto uklonjenog grafa dolazi kartica "Aktivnost tržišta" sa stopama
  promjene broja i vrijednosti prodanih stambenih objekata — **iz ISTOG DZS
  priopćenja kao `HPI_RAST`** (CIJ-2026-2-1/1, vidi napomenu iznad: Q1 2026.
  broj −42,2 %, vrijednost −35,4 %). Brojke su hardkodirane i **ažuriraju se
  ZAJEDNO s HPI-jem**, ne zasebno — nema novog ritma objave za pratiti,
  period je vezan na `ZADNJE_HPI`.
- Izvori korišteni za provjeru (nisu stalni izvori portala, samo za ovu
  provjeru): DZS, "Izdane građevinske dozvole u [godini]" (GRAD-*-3-2 serija,
  https://podaci.dzs.hr/hr/podaci/gradevinarstvo/gradevinske-dozvole/); MPGI
  i Ekonomski institut Zagreb, "Pregled tržišta nekretnina Republike
  Hrvatske" (godišnja publikacija, https://www.eizg.hr/publikacije/
  serijske-publikacije/pregled-trzista-nekretnina-republike-hrvatske/4273).

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
