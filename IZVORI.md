# IZVORI.md — odakle dolazi svaki podatak u Pokazateljima

Sve brojke u `TRZISTE`, `SERIJE`, `CPI`, `KS_*`, `STUP*`, `HPI_GOD`, `NEK_*`
su hardkodirane i ažuriraju se RUČNO. Ovaj file je jedini zapis o tome
odakle. Prije svake izmjene brojke: otvori izvor, prepiši, zapiši razdoblje.

**Pravilo: isključivo primarni izvor (DZS, HNB, HZMO, HANFA, APN, NN).
Nikad medijski portal, nikad agregator, nikad drugi kalkulator.**

Zadnja potpuna provjera: 18. 8. 2026.

---

## Inflacija (CPI)

- Izvor: DZS, priopćenja "Indeksi potrošačkih cijena"
- Pregled: https://podaci.dzs.hr/hr/podaci/cijene/
- Zadnje korišteno: lipanj 2026. — https://podaci.dzs.hr/2026/hr/121577
- Ritam: prva procjena ~1. u mjesecu, KONAČNI podaci ~15.
- **Koristiti konačne, ne prvu procjenu.**
- Provjereno 18.8.2026: godišnje 4,5 %, mjesečno −0,4 % — poklapa se s kodom.
- Napomena: od siječnja 2026. CPI se računa po ECOICOP ver. 2, nova bazna
  godina 2025 = 100. Serije prije toga nisu na istoj bazi.

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
- **Otvoreno: URL do HNB statističke stranice još nije zapisan — dopuniti.**
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

## Mirovinski fondovi (2. i 3. stup)

- Izvor: HANFA, mjesečno izvješće
- Zadnje korišteno: lipanj 2026. — https://hanfa.hr/vijesti/mjesecno-izvjesce-za-lipanj-2026
- Ritam: mjesečno
- Provjereno 18.8.2026: kategorija B 73,73 % (A 23,16 %, C 3,11 %),
  neto imovina OMF-ova 28,7 mlrd € — poklapa se.
- **Otvoreno: URL do HANFA pregleda svih mjesečnih izvješća — dopuniti.**

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
    **Kasni za DZS-om** — zadnja izmjena 21.4.2026., prije DZS revizije od 2.7.2026.
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

---

## Postupak ažuriranja

1. Otvori izvor iz ovog filea. Nikad Google, nikad portal.
2. Prepiši brojku i razdoblje.
3. Ažuriraj konstantu u `index.html` I odgovarajući `ZADNJE_*`.
4. Provjeri prikazuje li se ista brojka na više mjesta (ticker, kartica,
   sažetak) — vidi NOTES.md §3 o broju decimala.
5. Zapiši datum provjere u ovaj file.
