# Technická specifikace MHDSI pro implementaci webové aplikace

**Zdroj:** Metodika hodnocení dopadů strategických investic (MHDSI), *MHDSI_ReportMain1.7_red.pdf* (SIRS, QIII–2025).  
**Umístění PDF v workspace:** kořen projektu (`MHDSI_ReportMain1.7_red.pdf`), ne `docs/`.

**Účel:** Návrh datového modelu, výpočtových modulů, scénářů a rozhraní bez UI ani produkčního kódu.

**Pravidlo věrohodnosti:** Žádné ekonomické ani právní závěry mimo PDF. Kde PDF nedává jednoznačný postup, je položka klasifikována jako **OPEN_QUESTION**.

---

## Klasifikační klíč pravidel a proměnných

| Označení | Význam |
|----------|--------|
| **EXPLICIT_IN_METHODOLOGY** | Text PDF přímo předepisuje vzorec, povinný postup, strukturu nebo závaznou osnovu (včetně konkrétních čísel uvedených jako součást výpočtu v příkladu). |
| **CONFIGURABLE_ASSUMPTION** | PDF uvádí doporučené / empirické / legislativně měnné hodnoty, rozpětí, nebo „orientačně“ – implementace je parametr s verzí a zdrojem. |
| **OPEN_QUESTION** | Kontradikce v PDF, neúplný vzorec, volba mezi ekvivalentními interpretacemi, nebo záležitost vyžadující rozhodnutí mimo doslovný text metodiky. |

*Poznámka:* Jedna položka může mít **smíšenou** klasifikaci (např. struktura vzorce = explicitní, konkrétní čísla = CONFIGURABLE_ASSUMPTION).

---

## Přehled oddělení vrstev

| Vrstva | Obsah |
|--------|--------|
| **Explicitní pravidla** | Povinná struktura dopadové studie; definice AS-IS / TO-BE; základní vzorce VYP bloků tam, kde jsou v PDF uzavřené; závazné kroky (např. min. 3 scénáře). |
| **Assumptions-driven** | Koeficienty γ, δ, MPC, multiplikátory, DIAD, portfolio bydlení, θ, RUD podíly k datu, sazby daní – vždy s konfigurací a odkazem na PDF stranu. |
| **Otevřené nejasnosti** | Seznam **OPEN QUESTION** (kapitola níže); nesmí být maskovány jako fakta. |

---

## Seznam výpočtových modulů (VYP + agregační M*)

Identifikátory **VYP_x.y_z** odpovídají blokům „výpočetní postup“ v PDF. **M*** jsou softwarové agregace pro implementaci.

| ID | Název | Oblast PDF | Poznámka |
|----|--------|--------------|----------|
| **M0** | Projekt, metadata, časová osa | § 1.3 | T0, milníky, investor, CZ-NACE, struktura PMJ |
| **M1** | Vymezení území, isochrony | § 1.4, **VYP_1.4_1** | AOIVuz, AOIDadm, AOISiadpr/ak, části obcí, JSON |
| **M2** | Výchozí stav a trendy | § 1.5, **VYP_1.5_1** | Demografie, migrace, odvětví, globální trendy |
| **M3** | Zaměstnanost | § 2.1, **VYP_2.1_1**–**VYP_2.1_5** | RZPS, substituce, mezera, pendleři, agentura |
| **M4** | Bydlení | § 2.2, **VYP_2.2_1**–**VYP_2.2_5** | OU, ZU, KPN, bilance nabídky |
| **M5** | Občanská vybavenost | § 2.3, **VYP_2.3_1**–**VYP_2.3_4** | Školy, zdraví, volný čas, bezpečnost |
| **M6** | Přínosy | § 2.4, **VYP_2.4_1**–**VYP_2.4_5** | HDP, finance, lokální ekonomika, obec, kvalita |
| **M7** | Scénáře a konsolidace | § 1.5, § 2.4, § 7 osnovy | Min. 3 scénáře; srovnání variant |
| **M8** | Report a přílohy | § 3.1 | Osnova DS, exporty, PPTX |

---

## Tabulka vstupních proměnných

*Sloupce: **ID** (interní), symbol, popis, jednotka, zdroj dat dle PDF, klasifikace.*

### Projekt a záměr (M0)

| ID | Symbol | Popis | Jednotka | Zdroj (PDF) | Klasifikace |
|----|--------|--------|----------|-------------|-------------|
| INP-001 | `project_name` | Název / pracovní název záměru | text | § 1.3 min. otázky | EXPLICIT_IN_METHODOLOGY |
| INP-002 | `location_description` | Lokalita (BSJ, katastr, obec) | text | § 1.3 | EXPLICIT_IN_METHODOLOGY |
| INP-003 | `AOIVuz_geom` | Polygon / definiční bod záměru | WGS84 nebo polygon | § 1.3.3 | EXPLICIT_IN_METHODOLOGY |
| INP-004 | `scope_capacity` | Rozsah (kapacity, plochy, produkce) | mixed | § 1.3 | EXPLICIT_IN_METHODOLOGY |
| INP-005 | `CZ_NACE` | Odvětvová klasifikace | kód | § 1.3 | EXPLICIT_IN_METHODOLOGY |
| INP-006 | `CAPEX_total` | Celkové investiční náklady | Kč | § 1.3 | EXPLICIT_IN_METHODOLOGY |
| INP-007 | `schedule_phases` | Harmonogram (příprava, výstavba, provoz) | časová řada | § 1.3.2 | EXPLICIT_IN_METHODOLOGY |
| INP-008 | `T0` | Rozhodný okamžik | datum / rok | § 1.3.2 | EXPLICIT_IN_METHODOLOGY |
| INP-009 | `N_inv` | Plánovaný počet pracovních míst (plný provoz) | počet | § 1.3.3, 2.1 | EXPLICIT_IN_METHODOLOGY |
| INP-010 | `employment_structure` | Rozdělení PMJ (profese, mzdy, směny) | tabulka | § 1.3.3 | EXPLICIT_IN_METHODOLOGY |
| INP-011 | `investor_profile` | Investor, právní forma | text | § 1.3 | EXPLICIT_IN_METHODOLOGY |
| INP-012 | `strategic_links` | Vazby na strategické dokumenty | text | § 1.3 | CONFIGURABLE_ASSUMPTION |

### Území (M1)

| ID | Symbol | Popis | Jednotka | Zdroj (PDF) | Klasifikace |
|----|--------|--------|----------|-------------|-------------|
| INP-101 | `entry_point_lon_lat` | Vstupní bod na síť (WGS84) | °, 4 des. místa | § 1.4 VYP (snap) | EXPLICIT_IN_METHODOLOGY |
| INP-102 | `d_last_mile` | Euklidovská vzdálenost „poslední míle“ | km | § 1.4 | EXPLICIT_IN_METHODOLOGY |
| INP-103 | `DIADpr` | Preferovaná doba dojezdu IAD | min | § 1.4 (typ. 30) | CONFIGURABLE_ASSUMPTION |
| INP-104 | `DIADak` | Akceptovaná doba dojezdu IAD | min | § 1.4 (typ. 60) | CONFIGURABLE_ASSUMPTION |
| INP-105 | `Tinfr` | Korekce budoucí infrastruktury (čas) | min | § 1.4 | CONFIGURABLE_ASSUMPTION |
| INP-106 | `isochrone_engine` | Nástroj (ORS, ESRI, vlastní) | enum | § 1.4 | CONFIGURABLE_ASSUMPTION |
| INP-107 | `buffer_cobce_m` | Buffer významových středů částí obcí | m | 500 / 1000 / 2000 v příkladu | CONFIGURABLE_ASSUMPTION |
| INP-108 | `admin_boundaries` | Hranice obcí/částí (RÚIAN) | GIS | § 1.4 zdroje | EXPLICIT_IN_METHODOLOGY |

### Trendy AS-IS (M2)

| ID | Symbol | Popis | Jednotka | Zdroj (PDF) | Klasifikace |
|----|--------|--------|----------|-------------|-------------|
| INP-201 | `pop_t0` | Obyvatelstvo v T0 | osoby | § 1.5 | EXPLICIT_IN_METHODOLOGY |
| INP-202 | `age_groups` | Věkové skupiny 0–14, 15–64, 65+ | osoby | § 1.5 | EXPLICIT_IN_METHODOLOGY |
| INP-203 | `migration_balance` | Migrační saldo (5 let) | osoby/rok | § 1.5 | EXPLICIT_IN_METHODOLOGY |
| INP-204 | `NACE_shares` | Podíly odvětví na zaměstnanosti | podíl | § 1.5 | CONFIGURABLE_ASSUMPTION |
| INP-205 | `V0_Vk_n_trend` | Hodnoty pro výpočet změny v čase | různé | § 1.5 | OPEN_QUESTION (vzorec) |

### Zaměstnanost (M3)

| ID | Symbol | Popis | Jednotka | Zdroj (PDF) | Klasifikace |
|----|--------|--------|----------|-------------|-------------|
| INP-301 | `k_inv` | Podíl kmenových zaměstnanců s investor | 0–1 | § 2.1 VYP_2.1_1 | CONFIGURABLE_ASSUMPTION |
| INP-302 | `A_UP` | Skupina A ÚP (s podporou) | osoby | § 2.1 VYP_2.1_2 | EXPLICIT_IN_METHODOLOGY |
| INP-303 | `B_UP` | Skupina B ÚP (>12 měsíců) | osoby | § 2.1 | EXPLICIT_IN_METHODOLOGY |
| INP-304 | `C_UP` | Skupina C (bariéry) | osoby | § 2.1 | EXPLICIT_IN_METHODOLOGY |
| INP-305 | `gamma` | Koef. aktivace dlouhodobě nezam. | 0,3 v PDF | § 2.1 | CONFIGURABLE_ASSUMPTION |
| INP-306 | `delta` | Koef. aktivace s bariérami | 0,15 v PDF | § 2.1 | CONFIGURABLE_ASSUMPTION |
| INP-307 | `util_RZPS` | Využitelnost RZPS po korekci | 50/70/10 % scénáře | § 2.1 | CONFIGURABLE_ASSUMPTION |
| INP-308 | `M_new` | Plánovaná mzda investora | Kč | § 2.1 VYP_2.1_3 | EXPLICIT_IN_METHODOLOGY |
| INP-309 | `M_region` | Medián mzdy profese v regionu | Kč | § 2.1 | EXPLICIT_IN_METHODOLOGY |
| INP-310 | `alpha_elast` | α elasticita mobility | 0–1 | § 2.1 příklad 0,5 | CONFIGURABLE_ASSUMPTION |
| INP-311 | `NP_vm` | Nabídka práce nad mediánem | počet | § 2.1 | EXPLICIT_IN_METHODOLOGY |
| INP-312 | `NP_total` | Nabídka práce celkem | počet | § 2.1 | EXPLICIT_IN_METHODOLOGY |
| INP-313 | `Z_i` | Počet pracovníků v oboru v regionu | počet | § 2.1 | EXPLICIT_IN_METHODOLOGY |
| INP-314 | `M_i` | Podíl ochotných dojíždět v oboru | 0–1 | § 2.1 | CONFIGURABLE_ASSUMPTION |
| INP-315 | `N_sub` | Počet získaných substitucí (agregát) | počet | § 2.1 | EXPLICIT_IN_METHODOLOGY |
| INP-316 | `p_pendler` | Podíl dlouhé dojížďky na Ncelkem | 0,065 v příkladu | § 2.1 | CONFIGURABLE_ASSUMPTION |

### Bydlení (M4)

| ID | Symbol | Popis | Jednotka | Zdroj (PDF) | Klasifikace |
|----|--------|--------|----------|-------------|-------------|
| INP-401 | `KH` | Koef. domácnosti přistěhovalých | 1,34 v PDF | § 2.2 | CONFIGURABLE_ASSUMPTION |
| INP-402 | `N_kmen` | Počet kmenových (po alokaci M3) | počet | § 2.2 | EXPLICIT_IN_METHODOLOGY |
| INP-403 | `N_agentura` | Počet agenturních | počet | § 2.2 | EXPLICIT_IN_METHODOLOGY |
| INP-404 | `N_pendler` | Počet pendlerů | počet | § 2.2 | EXPLICIT_IN_METHODOLOGY |
| INP-405 | `N_relokace` | Relokovaní (Sit. B) | počet | § 2.2 | EXPLICIT_IN_METHODOLOGY |
| INP-406 | `share_housing_type` | Podíly typů bydlení (20/20/30/30) | podíly | § 2.2 | CONFIGURABLE_ASSUMPTION |
| INP-407 | `occ_by_type` | Obsazenost osob/jednotku dle typu | osoby/j. | § 2.2 tabulka | CONFIGURABLE_ASSUMPTION |
| INP-408 | `L_t_market` | Průměr inzerce z portálů po typech | počet | § 2.2 VYP_2.2_4 | EXPLICIT_IN_METHODOLOGY |
| INP-409 | `V_t_vacant` | Neobydlené jednotky (ČSÚ) | počet | § 2.2 | EXPLICIT_IN_METHODOLOGY |
| INP-410 | `B_beds` | Lůžka ubytoven v jádru | lůžka | § 2.2 | EXPLICIT_IN_METHODOLOGY |
| INP-411 | `market_coverage` | Korekce pokrytí trhu portály | 80 % v PDF | § 2.2 | CONFIGURABLE_ASSUMPTION |
| INP-412 | `situation_AB` | Volba situace A nebo B | enum | § 2.2 | OPEN_QUESTION (odvození) |

### Občanská vybavenost (M5)

| ID | Symbol | Popis | Jednotka | Zdroj (PDF) | Klasifikace |
|----|--------|--------|----------|-------------|-------------|
| INP-501 | `OU` | Nově usazení obyvatelé (z M4) | osoby | § 2.3 | EXPLICIT_IN_METHODOLOGY |
| INP-502 | `cap_reg_MS_ZS` | Rejstříkové kapacity MŠ, ZŠ | místa | § 2.3 | EXPLICIT_IN_METHODOLOGY |
| INP-503 | `enrolled_MS_ZS` | Aktuálně zapsaní | žáci/děti | § 2.3 | EXPLICIT_IN_METHODOLOGY |
| INP-504 | `std_MS_per_1000` | Standard MŠ / 1000 obyv. | 34 „cca“ | § 2.3 | CONFIGURABLE_ASSUMPTION |
| INP-505 | `std_ZS_per_1000` | Standard ZŠ / 1000 obyv. | 96 „cca“ | § 2.3 | CONFIGURABLE_ASSUMPTION |
| INP-506 | `free_cap_factor` | Faktor 0,90 na volnou kapacitu | 0,90 | § 2.3 | CONFIGURABLE_ASSUMPTION |
| INP-507 | `beds_per_1000` | Akutní lůžka / 1000 obyv. | 2,5 | § 2.3 | CONFIGURABLE_ASSUMPTION |
| INP-508 | `PX_specialists` | Obyvatelé na ordinaci dle typu | tabulka | § 2.3 | CONFIGURABLE_ASSUMPTION |
| INP-509 | `Kstandard_leisure` | Koeficienty volnočasu / 100 obyv. | tabulka | § 2.3 | CONFIGURABLE_ASSUMPTION |
| INP-510 | `N_celkem_M3` | Celková potřeba PMJ (bezpečnost) | počet | § 2.3 | EXPLICIT_IN_METHODOLOGY |
| INP-511 | `N_agent_cizinci` | Agenturní jako cizinci (bezpečnost) | počet | § 2.3 příklad | EXPLICIT_IN_METHODOLOGY |

### Přínosy (M6)

| ID | Symbol | Popis | Jednotka | Zdroj (PDF) | Klasifikace |
|----|--------|--------|----------|-------------|-------------|
| INP-601 | `MPC` | Mezní sklon ke spotřebě | 0,8 typicky | § 2.4 | CONFIGURABLE_ASSUMPTION |
| INP-602 | `M_spotreba` | Multiplikátor spotřeby | příklad 1,8 | § 2.4 | CONFIGURABLE_ASSUMPTION |
| INP-603 | `M_mista` | Multiplikátor pracovních míst | 1,6–1,8 | § 2.4 | CONFIGURABLE_ASSUMPTION |
| INP-604 | `M_investice` | Investiční multiplikátor | příklad 1,6–1,8 | § 2.4 | CONFIGURABLE_ASSUMPTION |
| INP-605 | `M_vlada` | Multiplikátor vládních výdajů | příklad 1,7–1,8 | § 2.4 | CONFIGURABLE_ASSUMPTION |
| INP-606 | `T_ref_years` | Referenční horizont přínosů | léta (10) | § 2.4 | CONFIGURABLE_ASSUMPTION |
| INP-607 | `theta` | Složená daňová kvóta | 0,32–0,40, dop. 0,34 | § 2.4 | CONFIGURABLE_ASSUMPTION |
| INP-608 | `p_stat_p_kraj_p_obec` | Podíly rozpočtů z výnosu daní | 2025 v PDF | § 2.4 | CONFIGURABLE_ASSUMPTION |
| INP-609 | `r_retence` | Retenční koeficient spotřeby | 0,5–0,75 | § 2.4 | CONFIGURABLE_ASSUMPTION |
| INP-610 | `S_stavby` | Zastavěná plocha staveb k podnikání | m² | § 2.4 | EXPLICIT_IN_METHODOLOGY |
| INP-611 | `S_plochy` | Zpevněné plochy | m² | § 2.4 | EXPLICIT_IN_METHODOLOGY |
| INP-612 | `s_stavby_s_plochy` | Zákonné sazby DzNM | Kč/m² | zákon v PDF | CONFIGURABLE_ASSUMPTION |
| INP-613 | `k_mistni_k_zakladni` | Koeficienty daně z nemovitostí | dle zákona | § 2.4 | CONFIGURABLE_ASSUMPTION |
| INP-614 | `alpha_obec` | Podíl PMJ s přistěhováním do obce | 5 % v příkladu | § 2.4 | CONFIGURABLE_ASSUMPTION |
| INP-615 | `Rp_RUD` | Koef. rodin pro RUD | 1,34 | § 2.4 | CONFIGURABLE_ASSUMPTION |
| INP-616 | `v_RUD_per_cap` | Příspěvek RUD na obyvatele | 16 500 v příkladu | § 2.4 | CONFIGURABLE_ASSUMPTION |

---

## Tabulka odvozených proměnných

| ID | Symbol | Popis | Vzorec / logika (PDF) | Modul | Klasifikace |
|----|--------|--------|------------------------|-------|-------------|
| DRV-001 | `T_posm` | Čas poslední míle | d × 2 min/km (text); pozor na jednotku v PDF | M1 | EXPLICIT + OPEN_QUESTION (jednotka) |
| DRV-002 | `DIADpr_kor` | Korigovaná preferovaná doba | max(0, DIADpr − Tposm − Tinfr) | M1 | EXPLICIT_IN_METHODOLOGY |
| DRV-003 | `DIADak_kor` | Korigovaná akceptovaná doba | max(0, DIADak − Tposm + Tinfr) | M1 | OPEN_QUESTION (znaménko Tinfr) |
| DRV-004 | `AOIS_polygons` | Polygony isochron | service area, disky ne rings | M1 | EXPLICIT_IN_METHODOLOGY |
| DRV-005 | `R_zap` | Podíl obyvatel obce v isochroně | O_co_AOIS / O_mun | M1 | EXPLICIT_IN_METHODOLOGY |
| DRV-006 | `index_age` | Index stáří | (65+)/(0–14) | M2 | EXPLICIT_IN_METHODOLOGY |
| DRV-007 | `N_celkem` | Potřeba PMJ po odečtu kmenových | (1 − k_inv) × N_inv | M3 | EXPLICIT_IN_METHODOLOGY |
| DRV-008 | `RZPS_raw` | HR ubalance před % | A + γB + δC | M3 | EXPLICIT_IN_METHODOLOGY |
| DRV-009 | `RZPS` | Po využitelnosti | RZPS_raw × util_RZPS | M3 | EXPLICIT_IN_METHODOLOGY |
| DRV-010 | `S_m` | Základní substituční podíl | α × [(M_new − M_reg)/M_reg] | M3 | EXPLICIT_IN_METHODOLOGY |
| DRV-011 | `S_t` | Korekce konkurencí | [1 − NP_vm/NP_tot] × S_m | M3 | EXPLICIT_IN_METHODOLOGY |
| DRV-012 | `Z_ztrata` | Ztráty u stávajících | Z_i × M_i × S_t | M3 | EXPLICIT_IN_METHODOLOGY |
| DRV-013 | `N_mezera` | Mezera PS | N_celkem − RZPS − N_sub | M3 | EXPLICIT_IN_METHODOLOGY |
| DRV-014 | `N_pendler_calc` | Pendleři | p × N_celkem | M3 | EXPLICIT_IN_METHODOLOGY |
| DRV-015 | `N_agentura_calc` | Agentura | N_mezera − N_pendler | M3 | EXPLICIT_IN_METHODOLOGY |
| DRV-016 | `OU_A` | Obyvatelé k usazení Sit. A | N_agent + N_kmen × KH | M4 | EXPLICIT_IN_METHODOLOGY |
| DRV-017 | `OU_B` | Obyvatelé Sit. B | N_agent + (N_kmen + N_relok) × KH | M4 | EXPLICIT_IN_METHODOLOGY |
| DRV-018 | `ZU` | Zaměstnanci k usazení (bydlení) | dle § 2.2 příklad | M4 | EXPLICIT_IN_METHODOLOGY |
| DRV-019 | `ZU_t` | Rozpad ZU do typu t | ZU × p_t | M4 | EXPLICIT_IN_METHODOLOGY |
| DRV-020 | `units_t` | Počet jednotek typu | ZU_t / occ_t | M4 | EXPLICIT_IN_METHODOLOGY |
| DRV-021 | `KPN` | Prostorová náročnost | vážený průměr z typů | M4 | CONFIGURABLE_ASSUMPTION |
| DRV-022 | `E_t` | Efektivní nabídka typu | kroky A–C § 2.2.4 | M4 | EXPLICIT_IN_METHODOLOGY |
| DRV-023 | `demand_MS` | Poptávka MŠ | OU × std_MS/1000 | M5 | CONFIGURABLE_ASSUMPTION („cca“) |
| DRV-024 | `demand_ZS` | Poptávka ZŠ | OU × std_ZS/1000 | M5 | CONFIGURABLE_ASSUMPTION |
| DRV-025 | `free_MS_ZS` | Volná kapacita | 0,9×rejstřík − zapsaní | M5 | EXPLICIT_IN_METHODOLOGY |
| DRV-026 | `beds_need` | Potřeba akutních lůžek | OU/1000 × 2,5 | M5 | CONFIGURABLE_ASSUMPTION |
| DRV-027 | `N_zarizeni` | Volnočasová zařízení | (OU/100)×K_standard | M5 | EXPLICIT_IN_METHODOLOGY |
| DRV-028 | `delta_HDP` | Příspěvek k HDP | součet C+I+G+(X−M) dle profilu | M6 | EXPLICIT_IN_METHODOLOGY |
| DRV-029 | `tax_yield` | Výnos daní | θ × ΔHDP | M6 | EXPLICIT_IN_METHODOLOGY |
| DRV-030 | `C_r` | Spotřeba po retenci | C × r | M6 | EXPLICIT_IN_METHODOLOGY |
| DRV-031 | `DzNM` | Daň z nemovitostí ročně | [(S_s×s_s + S_p×s_p)]×k_m×k_z | M6 | EXPLICIT_IN_METHODOLOGY |
| DRV-032 | `PRUD` | Příspěvek RUD obce | N_nová × α × Rp × v_RUD | M6 | EXPLICIT_IN_METHODOLOGY |

---

## Seznam scénářových parametrů

*Parametry, které se typicky mění mezi **optimistickým / středním / pesimistickým** nebo mezi **variantami citlivosti**.*

| Parametr | Typický význam ve scénářích | PDF | Klasifikace |
|----------|---------------------------|-----|-------------|
| `scenario_id` | opt / střed / pes | § 1.5, 2.4 | EXPLICIT_IN_METHODOLOGY (min. 3) |
| `DIADpr`, `DIADak` | Rurální vs metropolitní korekce | § 1.4 | CONFIGURABLE_ASSUMPTION |
| `Tinfr` | Více/méně budoucí infrastruktury | § 1.4 | CONFIGURABLE_ASSUMPTION |
| `util_RZPS` | 70 % / 50 % / 10 % | § 2.1 | CONFIGURABLE_ASSUMPTION |
| `k_inv` | High-tech vs smíšený provoz | § 2.1 | CONFIGURABLE_ASSUMPTION |
| `alpha_elast`, `M_i` | Mobilita a ochota dojíždět | § 2.1 | CONFIGURABLE_ASSUMPTION |
| `p_pendler` | Intenzita pendlingu | § 2.1 | CONFIGURABLE_ASSUMPTION |
| `situation_AB` | Situce bydlení A vs B | § 2.2 | OPEN_QUESTION |
| `N_relokace` | Podíl relokace (13,5 % v příkladu B) | § 2.2 | CONFIGURABLE_ASSUMPTION |
| `share_housing`, `occ_by_type` | Portfolio bydlení | § 2.2 | CONFIGURABLE_ASSUMPTION |
| `theta` | 0,32 / 0,34 / 0,40 | § 2.4 | CONFIGURABLE_ASSUMPTION |
| `p_stat`, `p_kraj`, `p_obec` | Rozdělení výnosu (RUD) | § 2.4 | CONFIGURABLE_ASSUMPTION |
| `MPC`, `M_mista`, `M_spotreba`, … | Multiplikátory | § 2.4 | CONFIGURABLE_ASSUMPTION |
| `r_retence` | 0,5–0,75 | § 2.4 | CONFIGURABLE_ASSUMPTION |
| `include_XM` | Zapnout obchodní bilanci | § 2.4 | CONFIGURABLE_ASSUMPTION |
| `NPV_discount` | Diskontování víceletých toků | zmínka NPV | OPEN_QUESTION |

---

## Katalog pravidel s klasifikací (shrnutí podle oblasti)

| Oblast | Pravidlo (shrnutí) | Klasifikace |
|--------|-------------------|-------------|
| Struktura DS | Osnova 10 bodů + přílohy; AS-IS před TO-BE | EXPLICIT_IN_METHODOLOGY |
| Scénáře | Minimálně 3 (optimistický, střední, pesimistický) | EXPLICIT_IN_METHODOLOGY |
| Isochrony | Výpočet bez aktuálního provozu; výstup „disks“ ne „rings“ | EXPLICIT_IN_METHODOLOGY |
| T_posm | 2 min/km z d | EXPLICIT_IN_METHODOLOGY (+ OQ jednotky) |
| DIAD_kor | Vzorce s max(0,…) | EXPLICIT + OQ (akceptovaná) |
| N_celkem | (1−k_inv)×N_inv | EXPLICIT_IN_METHODOLOGY |
| RZPS | A+γB+δC, pak × util | EXPLICIT + CONFIGURABLE |
| Substituce | S_m, S_t, Z_ztráta | EXPLICIT_IN_METHODOLOGY |
| Mezera / pendler / agentura | N_mezera, p×N, rozdíl; prahy 30 %, 5 % | EXPLICIT_IN_METHODOLOGY |
| OU | Vzorce Sit. A a B s KH | EXPLICIT + CONFIGURABLE (KH) |
| ZU, jednotky | ZU_t, dělení obsazeností | EXPLICIT_IN_METHODOLOGY |
| Nabídka | 80 % pokrytí portály | CONFIGURABLE_ASSUMPTION |
| Školy | 34/96 na 1000; volná = 0,9 rejstř. − zapsaní | CONFIGURABLE + EXPLICIT |
| Zdraví | 2,5 lůžka/1000; PX na ordinaci | CONFIGURABLE_ASSUMPTION |
| Volný čas | N_zařízení = (OU/100)×K | EXPLICIT + CONFIGURABLE |
| Bezpečnost | Tabulky FTE / 1000 obyv. | CONFIGURABLE_ASSUMPTION |
| HDP | C+I+G+(X−M); příklad C = DD×MPC×M_spotř | EXPLICIT_IN_METHODOLOGY |
| Veřejné finance | Výnos = θ×ΔHDP; rozpad p_stat… | EXPLICIT + CONFIGURABLE |
| Obec | DzNM, PRUD | EXPLICIT + CONFIGURABLE |
| Kvalita | Škála 1–5 | EXPLICIT_IN_METHODOLOGY |

---

## Kompletní seznam OPEN QUESTION

| # | Téma | Důvod |
|---|------|--------|
| OQ-01 | **DIADak_kor:** znaménko u `Tinfr` (+ vs − oproti DIADpr) | PDF str. ~1344–1345 |
| OQ-02 | **T_posm:** konzistence jednotek (min/km vs výskyt min/km²) | PDF str. ~1330 |
| OQ-03 | **Průměrná roční změna** trendu: jeden uznaný vzorec (V0, Vk, n) | § 1.5 |
| OQ-04 | **Agregace substituce** napříč více profesemi najednou | § 2.1 |
| OQ-05 | **Nepřímá a indukovaná PMJ** mimo uzavřený vzorec (kromě kontextu HDP) | § 2.1, 2.4 |
| OQ-06 | **Automatické určení Situce A vs B** | § 2.2 |
| OQ-07 | **Sekce 0.6** „Seznam výpočtů a indikátorů“ – plný obsah v aktuálním extraktu | obsah PDF |
| OQ-08 | **NX = OU / PX** pro zdravotnictví – úplná číselná řada v tabulce | § 2.3.2 |
| OQ-09 | **Šablona textu** mitigace § 2.4.3 vs obsah zaměstnanosti | PDF (konzistence dokumentu) |
| OQ-10 | **Legislativní přesnost** θ a RUD pro budoucí roky – pouze odkaz na aktuální novelu | § 2.4 |

---

## MVP vs. v2 (implementační rozsah specifikace)

### MVP

| Oblast | Moduly / data | Poznámka |
|--------|----------------|----------|
| Konfigurace | Soubor parametrů MHDSI 1.7 (všechny CONFIGURABLE) | Verzovatelný |
| M0 | Plný vstupní formulář dle INP-001–012 | EXPLICIT vstupy |
| M1 | Ruční polygon AOIS **nebo** seznam obcí; ruční `d`; výpočet T_posm, DIAD_kor dle vzorce | Bez povinného ORS |
| M3 | VYP_2.1_1–2.1_4 end-to-end | Tabulka 2.1_5 |
| M4 | OU pro Sit. A i B (uživatelská volba OQ-06); ZU, jednotky; bez scrapingu realit | Bilance ručně nebo zjednodušeně |
| M6 | VYP_2.4_2 (θ×ΔHDP) s ručním ΔHDP; VYP_2.4_4 DzNM + PRUD | Částečný HDP |
| M7 | Uložení 3 scénářů jako sad parametrů | Ne nutně všechny moduly |
| M8 | Export JSON/CSV + textová osnova § 3.1 | Bez PPTX povinně |

### v2

| Oblast | Moduly / data |
|--------|----------------|
| M1 | ORS/ESRI, overlay částí obcí, export JSON jako v PDF |
| M2 | Plná napojení na ČSÚ/Eurostat feedy (kde dostupné) |
| M4 | Automatizovaná rešerše + 80 % korekce; ÚP rezervy |
| M5 | Plné VYP_2.3_* + registry MŠMT, ÚZIS |
| M6 | Plný VYP_2.4_1 s ročními profily, (X−M), IO/TiVA; NPV |
| M7 | Konsolidované porovnání všech modulů napříč scénáři |
| M8 | Generování PPTX, mapové přílohy, audit trail VYP + parametrů |

---

## Výstupní report (bez změny oproti PDF)

Závazná osnova § 3.1 (body 1–10), manažerské shrnutí, vizualizace, PPTX – **EXPLICIT_IN_METHODOLOGY** (str. 5095–5194 PDF).

---

## Rejstřík VYP bloků

| VYP | Klasifikace dominantního obsahu |
|-----|-----------------------------------|
| VYP_1.4_1 | EXPLICIT (geometrie, korekce) + OQ na DIADak |
| VYP_1.5_1 | EXPLICIT (struktura analýz) + OQ trend vzorec |
| VYP_2.1_1 – 2.1_4 | EXPLICIT vzorce + CONFIGURABLE koeficienty |
| VYP_2.1_5 | EXPLICIT (tabulkový výstup) |
| VYP_2.2_1 – 2.2_5 | EXPLICIT vzorce + CONFIGURABLE portfolio |
| VYP_2.3_1 – 2.3_4 | EXPLICIT postupy + CONFIGURABLE standardy |
| VYP_2.4_1 – 2.4_5 | EXPLICIT rámec + CONFIGURABLE multiplikátory |

### Mapování VYP → strany PDF (pro implementační detail)

| Blok PDF | Přibližné strany (166 str. dokument) |
|----------|----------------------------------------|
| VYP_1.4_1 | cca 38–46 |
| VYP_1.5_1 | cca 50–55 |
| VYP_2.1_1 | cca 64–67 |
| VYP_2.1_2 | cca 66–67 |
| VYP_2.1_3 | cca 68–69 |
| VYP_2.1_4 | cca 70–71 |
| VYP_2.1_5 | cca 72–73 |
| VYP_2.2_1 – 2.2_2 | cca 86–90 |
| VYP_2.2_3 | cca 91–94 |
| VYP_2.2_4 – 2.2_5 | cca 95–99 |
| VYP_2.3_1 | cca 112–115 |
| VYP_2.3_2 | cca 116–118 |
| VYP_2.3_3 | cca 119–121 |
| VYP_2.3_4 | cca 122–125 |
| VYP_2.4_1 | cca 134–138 |
| VYP_2.4_2 | cca 139–140 |
| VYP_2.4_3 | cca 141–142 |
| VYP_2.4_4 | cca 143–144 |
| VYP_2.4_5 | cca 145–146 |

*(Čísla stran odpovídají vyznačení „-- X of 166 --“ v textové vrstvě PDF; při jiné paginaci tisku ověřit.)*

---

*Verze dokumentu: 1.1. Datum: 2026-04-02.*
