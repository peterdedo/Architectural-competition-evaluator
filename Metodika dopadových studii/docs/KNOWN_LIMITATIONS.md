# Known Limitations — MHDSI MVP (1.0.0-rc.1)

Datum: 2026-04-04  
Zdroj: finální end-to-end systémový audit po uzavření EPIC 1–5.

Tato omezení jsou **záměrně ponechána otevřená** pro release candidate; jsou zdokumentována a nevyžadují opravu před RC.

---

## 1. Persistence výsledků výpočtu

- **Popis:** `localStorage` uchovává pouze stav průvodce (`WizardState`), nikoliv výsledky pipeline (`FullCalculationPipelineResult`). Po obnovení stránky (F5) nebo novém sezení je `/report` prázdný, dokud uživatel znovu nevyvolá přepočet v průvodci (krok „Výsledky a srovnání scénářů").
- **Dopad:** Uživatel musí po každém načtení stránky ručně přepočítat, pokud chce zobrazit report.
- **Možná cesta v2:** Serializace výsledků do `localStorage` nebo server-side sessions.

## 2. PDF: pouze tisk prohlížeče

- **Popis:** Neexistuje serverový generátor PDF (Puppeteer/headless Chrome). PDF vzniká přes `Ctrl+P → Uložit jako PDF` z route `/report/print`.
- **Dopad:** Rozložení stránek, fonty a tiskové okraje závisí na prohlížeči a OS. Výsledek nemusí být identický na různých zařízeních.
- **Možná cesta v2:** Headless Chrome endpoint — sdílí `MethodologyReportSnapshot`, žádná změna datového modelu.

## 3. Auditní příloha — zkrácený JSON v tisku

- **Popis:** V tiskové verzi (sekce 13) je JSON výpis zkrácen přibližně na 12 000 znaků; zbytek je dostupný v elektronickém JSON exportu z `/report`.
- **Dopad:** Tištěná příloha není kompletní — pouze orientační.

## 4. M5 Občanská vybavenost — neúplný rozsah

- **Popis:** Modul M5 (civic) nepokrývá plný VYP_5 ze spec — chybí výpočet deficitu volnočasové infrastruktury (leisure deficit). Implementováno je dle MVP tabulky; chybějící část je označena `OQ-07`.
- **Dopad:** Report neobsahuje deficit volnočasové infrastruktury; je generováno varování `OPEN_QUESTION` s odkazem na OQ-07.

## 5. OQ-10: θ_rud (legislativní korekce fiskálního dopadu)

- **Popis:** Parametr `theta_rud` nemá v současné metodice uzavřený vzorec dle legislativy. Engine vždy použije `ASSUMPTION_FALLBACK` (`theta_rud = 1.0`) a vygeneruje viditelné varování v reportu.
- **Dopad:** Fiskální výpočet v M6 je konzervativní odhad, nikoliv legislativně ověřená hodnota.
- **Odkaz:** `OQ-10` v `src/domain/open-questions.ts`.

## 6. OQ-11: NPV diskontní sazba

- **Popis:** NPV výpočet není součástí uzavřeného vzorce ve spec. Funkce `computeEconomicModule` neobsahuje NPV; `NPV_discount` je označen jako otevřená otázka a není součástí výstupu M6.
- **Dopad:** Report neobsahuje NPV analýzu.
- **Odkaz:** `OQ-11` v `src/domain/open-questions.ts`.

## 7. OQ-03: Trendový vzorec populace (V0, Vk, N)

- **Popis:** Extrapolace trendu využívá lineární aproximaci; alternativní vzorec ze spec (V0 × Vk^N) nebyl implementován z důvodu nejednoznačnosti zadání.
- **Dopad:** Mírná odchylka trendové projekce u silně nelineárního vývoje.
- **Odkaz:** `OQ-03`.

## 8. Jazyk: pouze čeština

- **Popis:** Všechny uživatelské texty jsou hardcoded v češtině. Neexistuje i18n vrstva.
- **Možná cesta v2:** Extrakce textů do jazykového slovníku (bez změny výpočetního jádra).

## 9. Žádná CI/CD pipeline v repozitáři

- **Popis:** Automatizované kontroly (lint, typecheck, test, build, e2e) jsou definovány v `package.json`, ale žádná CI pipeline (GitHub Actions, GitLab CI apod.) není součástí repozitáře.
- **Dopad:** Ověření před release probíhá ručně dle `RELEASE_CHECKLIST.md`.

## 10. Legační doménový model (`src/domain/raw/`, `src/domain/outputs/`, …)

- **Popis:** Složky `src/domain/raw/`, `src/domain/outputs/`, `src/domain/derived/`, `src/domain/audit/`, `src/domain/report/report-snapshot.ts`, `src/domain/common/`, `src/domain/field-meta.ts`, `src/domain/assumption-set.ts`, `src/domain/scenario.ts`, `src/domain/modules.ts` obsahují původní Zod specifikace z designové fáze. Živou aplikací jsou **nevyužívány** (viz komentář v `src/domain/index.ts`). TypeScript je zkompiluje bez chyb.
- **Dopad:** Žádný runtime dopad; zdrojový kód je delší o ~600 řádků specifikačních typů.
- **Možná cesta v2:** Přesunutí do `docs/spec-types/` nebo odstranění po stabilizaci API.

## 11. Jednoscenarový wizard vs. více-scénářový engine

- **Popis:** Průvodce (`/studio`) vždy pracuje s právě jednou sadou vstupů, ale engine (`runFullCalculationPipeline`) počítá M3–M6 pro každý scénář zvlášť. M7 provádí konsolidaci přes scénáře, ale UI zobrazuje pouze výsledky prvního (baseline) scénáře v detailu; srovnání scénářů je v sekci 11.
- **Dopad:** Pokud uživatel definuje více scénářů, nevidí jejich detail ve wizardu — pouze konsolidaci v reportu.

---

*Aktualizovat před každým release. Poslední audit: 2026-04-04.*
