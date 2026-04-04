# Audit konzistence: system spec ↔ doménový model (Prompt 1 vs 2)

**Datum:** 2026-04-02  
**Zdroj pravdy:** `docs/mhdsi-system-spec.md`  
**Kontrolované:** `src/domain/**/*.ts`

---

## A. Audit summary

Doménový model **v zásade pokrývá** tabulky INP (M0–M6), DRV (001–032), VYP bloky, M7 scénáře, M8 report a audit trace. **Hlavné nesoulady** jsou:

1. **Registry předpokladů** neobsahoval všechny symboly ze spec (scénářové parametry a CONFIGURABLE z INP), čímž vznikalo riziko „tichého“ vymýšlení klíčů v `overrides`.
2. **INP-011** je v PDF jedno textové pole; v modelu je rozštěpené na `investorProfile` + `legalForm` — rozumná DTO dekompozice, ale **musí být explicitně označená** jako pohled na jediný vstup spec.
3. **`mvpManualDeltaHdpCzk`** odpovídá **MVP pravidlu** (ruční ΔHDP), ale **není řádkem INP** v tabulce — označeno jako **MVP bridge** vůči plnému VYP_2.4_1 (OQ / v2).
4. **Škála kvality 1–5** je v katalogu pravidel jako EXPLICIT, ale **nemá INP-* v tabulce vstupů** — chyběl strukturovaný záznam (doplněno minimálně jako volitelný vstup / příloha reportu).
5. **`include_XM` a `NPV_discount`** jsou ve spec (CONFIGURABLE / OPEN_QUESTION); v modelu byly jen částečně — doplněno do registry / OQ.
6. **`CalculationRun.traceId`** je redundantní vůči `CalculationTrace.runId` (= id běhu) — odstraněno ve prospěch jedné vazby.
7. **M5 v MVP** podle spec není v plném rozsahu — pole modelu jsou připravena, ale **nejsou povinná pro MVP** (TOO_EARLY_FOR_MVP validace), nejedná se o nesoulad se spec, ale o rozsah implementace.

Žádný závěr metodiky nad rámec PDF nebyl přidán jako „fakt“; vše pochybné zůstává **CONFIGURABLE_ASSUMPTION** nebo **OPEN_QUESTION**.

---

## B. Tabulka nesouladů

| ID | Oblast | Problém | Kategorie | Návrh opravy |
|----|--------|---------|-----------|--------------|
| C-01 | AssumptionKeys | Chyběly `k_inv`, `alpha_elast`, `M_i`, `include_XM`, explicitní portfolio bydlení / relokace jako konfigurovatelné klíče | MISSING_FROM_MODEL | Doplnit klíče + mapování na symboly PDF |
| C-02 | AssumptionKeys | `NPV_discount` ve spec OPEN_QUESTION — nepatří do číselných defaultů | OPEN_QUESTION_NOT_MARKED | Přesun do `open-questions.ts`, ne do DefaultAssumptionValues |
| C-03 | Investor | Dvě pole místo jednoho INP-011 | INVENTED_NOT_IN_SPEC (DTO) | Zachovat, dokumentovat jako rozklad jednoho INP-011 |
| C-04 | Project | `aoivuzGeom` optional — INP-003 je EXPLICIT | OPEN_QUESTION_NOT_MARKED / MVP cesta | Ponechat optional + komentář: striktní MVP validace na aplikační vrstvě; alternativa AOIS v M1 dle MVP tabulky |
| C-05 | Economic inputs | Ruční ΔHDP není v tabulce INP | INVENTED_NOT_IN_SPEC (MVP bridge) | Pole `mvpManualDeltaHdpCzk` + JSDoc |
| C-06 | Economic inputs | `includeXm` jen zde, ve spec i jako scénářový parametr | SHOULD_BE_CONFIGURABLE | Duplicitně v registry + komentář precedence |
| C-07 | Derived | Chyběl explicitní slot pro `N_nová` (DRV-032 / PRUD) | MISSING_FROM_MODEL | Přidat volitelné `nNovaPrud` |
| C-08 | Kvalita 1–5 | Katalog EXPLICIT, žádné INP-* v tabulce | MISSING_FROM_MODEL | Minimální `ImpactQualityInput` + OQ rozsahu |
| C-09 | CalculationRun | `traceId` | INVENTED_NOT_IN_SPEC | Odstranit; trace identifikovat `runId` = `CalculationRun.id` |
| C-10 | Territorial + AssumptionSet | DIAD/Tinfr na dvou místech | SHOULD_BE_CONFIGURABLE (nie konflikt) | Zdokumentovat pořadí: overrides scénáře > territorial |

---

## C. Opravený seznam entit (logické modely)

| Entita | Účel (proč existuje) | Spec |
|--------|----------------------|------|
| **Investor** | Nositel INP-011 | § 1.3, tabulka M0 |
| **Project** | INP-001–006, 009–010, vazby; INP-012 | M0 |
| **ProjectTimeline** | INP-007, INP-008 | M0 |
| **TerritorialDefinition** | INP-101–108 | M1 |
| **AsIsTrendInputs** | INP-201–205 | M2 (v2 plné napojení) |
| **EmploymentInputs** | INP-301–316 | M3 |
| **HousingInputs** | INP-401–412 | M4 |
| **CivicAmenityInputs** | INP-501–511 | M5 |
| **EconomicBenefitInputs** | INP-601–616 + MVP ruční ΔHDP | M6 |
| **ImpactQualityInput** | Katalog „kvalita 1–5“ bez INP-* | explicitní pravidlo v katalogu; OQ struktury |
| **AssumptionSet** | CONFIGURABLE + verze + zdroje | vrstva assumptions |
| **Scenario** | Min. 3 scénáře, `scenario_id` | M7 |
| **CalculationRun** | Jedna exekuce: vstupní snapshot → derived → výstupy | audit + engine |
| **CalculationTrace** | Kroky VYP/DRV, OQ odkazy | audit trail (v2 rozšíření dle spec) |
| **ReportSnapshot** | Osnova oddílu 3.1, export MVP | M8 |

---

## D. Opravený seznam polí pro MVP (povinná vs později)

**Povinné pro MVP** (dle tabulky MVP ve spec + INP EXPLICIT pro M0/M1/M3/M4/M6 části):

| Vrstva | Pole / balík | Poznámka |
|--------|----------------|----------|
| M0 | `projectName`, `locationDescription`, `scopeCapacity`, `czNace`, `capexTotalCzk`, `nInv`, `employmentStructure`, investor (INP-011), `projectTimeline` (`t0`, `schedulePhases`) | INP-001–010, 007–008 |
| M0 | `strategicLinks` | INP-012 CONFIGURABLE — může být prázdné, ale slot existuje |
| M0/M1 | Geometrie záměru **nebo** konzistentní s MVP M1 (ruční AOIS / obce + `d`) | INP-003 + MVP M1; striktní validace aplikace |
| M1 | `dLastMileKm` **nebo** `municipalityCodes` / `aoisPolygonsManual` | MVP tabulka |
| M1 | `DIADpr`, `DIADak`, `Tinfr` (v territorial nebo v AssumptionSet) | INP-103–105 |
| M3 | kompletní vstupy pro VYP_2.1_1–2.1_4 | MVP tabulka |
| M4 | volba Situce A/B (`situationAb`), OU větev | OQ-06 uživatelská volba |
| M6 | `theta`, ruční ΔHDP (MVP bridge), vstupy pro VYP_2.4_2 a 2.4_4 dle rozsahu | MVP tabulka |
| M7 | 3× `Scenario` + `AssumptionSet` | explicitní pravidlo |
| M8 | `ReportSnapshot.outlineSections` (1–10) | oddíl 3.1 |

**Spíše v2 / ne povinné MVP:** plné M2 feedy, ORS/ESRI, plné M5 registry, PPTX, plný VYP_2.4_1, NPV.

---

## E. Seznam assumptions (CONFIGURABLE ve spec)

Symboly a oblasti (detail v `src/domain/assumptions-registry.ts`):

- M1: `DIADpr`, `DIADak`, `Tinfr`, `buffer_cobce_m`, `isochrone_engine` (enum)
- M2: `NACE_shares`
- M3: `k_inv`, `gamma`, `delta`, `util_RZPS`, `alpha_elast`, `M_i`, `p_pendler`
- M4: `KH`, `share_housing_type`, `occ_by_type`, `market_coverage`, `N_relokace` (scénář)
- M5: `std_MS_per_1000`, `std_ZS_per_1000`, `free_cap_factor`, `beds_per_1000`, `PX_specialists`, `Kstandard_leisure`
- M6: `MPC`, `M_spotreba`, `M_mista`, `M_investice`, `M_vlada`, `T_ref_years`, `theta`, `p_stat`, `p_kraj`, `p_obec`, `r_retence`, `s_stavby_s_plochy` (sazby), `k_mistni_k_zakladni`, `alpha_obec`, `Rp_RUD`, `v_RUD_per_cap`, `include_XM`
- Technické: `DIADak_Tinfr_sign` (řešení OQ-01 v kódu)

---

## F. Seznam OPEN QUESTION (ze spec)

| ID | Téma |
|----|------|
| OQ-01 | Znaménko `Tinfr` u DIADak_kor |
| OQ-02 | Jednotky `T_posm` |
| OQ-03 | Vzorec trendu V0, Vk, n |
| OQ-04 | Agregace substituce napříč profesemi |
| OQ-05 | Nepřímá / indukovaná PMJ |
| OQ-06 | Automatické určení situace A vs B |
| OQ-07 | Sekce 0.6 seznam výpočtů |
| OQ-08 | NX = OU/PX zdravotnictví |
| OQ-09 | Konzistence textů mitigace |
| OQ-10 | Legislativní θ a RUD v čase |
| OQ-11 | NPV diskont — zmínka ve spec bez uzavřeného vzorce |

---

## G. Provedené změny souborů

Viz git diff / následující soubory: `assumptions-registry.ts`, `open-questions.ts`, `raw/investor.ts`, `raw/project.ts`, `raw/inputs-economic.ts`, `raw/inputs-impact-quality.ts`, `derived/derived-values.ts`, `audit/calculation-run.ts`, `index.ts`, aktualizace `mhdsi-domain-model.md`.
