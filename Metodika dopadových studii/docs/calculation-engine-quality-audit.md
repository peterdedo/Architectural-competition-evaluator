# Audit kvality calculation engine (před UI)

**Rozsah:** `src/lib/mhdsi/calculations/**`  
**Datum:** 2026-04-02

## A. Audit summary

Implementace splňuje **scope** (pouze engine + testy), **modulární rozklad** (employment, housing, civic, economic + sdílené helpery), **čisté funkce** bez DB/UI/globálního stavu. Hlavní slabiny před úpravou: **varování jen jako volné řetězce** (špatná lokalizace a filtrování pro UI), **numerické fallbacky rozptýlené v modulech** (ekonomika, civic, housing) mimo jeden zdroj, **mrtvá proměnná** v housing, **neúplný orchestrátor** pro „full run“, **anglické mitigace** při požadavku na české UI, **část mezivýsledků** u ekonomiky mimo `intermediateValues`.

## B. Tabulka zjištění po modulech

| Oblast | Zjištění | Kategorie (před opravou) |
|--------|----------|---------------------------|
| Scope | Pouze `calculations` + testy + vitest config | OK |
| Moduly | Oddělené soubory + `index.ts` | OK |
| Čistota | Bez side effects | OK |
| Návratový tvar | `EngineResult` konzistentní | OK |
| Warnings | Pouze `string[]` | FIX_NEEDED |
| Fallbacky | economic/civic/housing numerické defaulty inline | HARDcoded_SHOULD_BE_ASSUMPTION |
| Employment | `util_RZPS` default 1 bez varování | FIX_NEEDED |
| Housing | `const oq` nepoužito | FIX_NEEDED |
| Civic | Mitigace EN, `fteSec` 0.5 natvrdo; leisure bez deficitu | FIX_NEEDED / TEST_GAP |
| Economic | Fallbacky p_stat…, T_ref; OQ-10/11 vždy | FIX_NEEDED / OPEN_QUESTION_HIDDEN (upřesnit v trace) |
| Public API | Chybí jednoznačný full pipeline | API_INCONSISTENT |
| Testy | Dobré pokrytí; chybí pipeline + structured warnings | TEST_GAP |
| Doménový model | Engine nemění `src/domain` | OK |

## C. Seznam FIX_NEEDED (provedeno v kódu)

- Strukturovaná varování (`EngineWarning`: code, message, field?).
- Centralizované implicitní fallbacky (`implicit-fallbacks.ts`) s odkazem na PDF/registry.
- Odstranění nepoužité proměnné v housing.
- Orchestrátor `runFullCalculationPipeline` + export v `index.ts`.
- České texty mitigací (šablony pro UI).
- Rozšíření `intermediateValues` u ekonomiky o všechny použité fiskální parametry.
- Trace u ekonomiky: kroky OQ-10 / OQ-11 s `OPEN_QUESTION_BRIDGE`.

## D. Assumptions-driven části (po opravě)

- `resolveAssumptions` + `DefaultAssumptionValues` ze `src/domain/assumptions-registry.ts`.
- Doplňkové hodnoty jen přes `implicit-fallbacks.ts` (kde registry nemá klíč).

## E. OPEN QUESTION bridge části

- Employment: lineární ramp (`RAMP`).
- Housing: ZU default (`DRV-018`), zjednodušená nabídka E_t.
- Civic: NX = OU/PX (`OQ-08`), mitigace jako bridge text.
- Economic: `mvpManualDeltaHdpCzk`, `HHC-MVP`, OQ-10, OQ-11 v trace.

## F. Test gap (doplněno)

- Strukturovaná varování (`EngineWarning.code`) — kontrola v `employment.test.ts`.
- Orchestrátor — `run-pipeline.test.ts` (`runFullCalculationPipeline`).

## G. Po opravě (kód)

- `types.ts`: `EngineWarning`, `warnings: EngineWarning[]`.
- `warnings.ts`, `implicit-fallbacks.ts`, `numeric-resolved.ts`.
- Úpravy modulů employment / housing / civic / economic (fallbacky, české texty, trace OQ u ekonomiky).
- `run-pipeline.ts` + export v `index.ts`.
- Testy aktualizovány; přidán `run-pipeline.test.ts`.
