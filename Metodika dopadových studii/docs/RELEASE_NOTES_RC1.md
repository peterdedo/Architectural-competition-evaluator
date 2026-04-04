# Release Notes — MHDSI MVP 1.0.0-rc.1

**Datum:** 2026-04-04  
**Typ:** Release Candidate 1  
**Větev:** `release/rc-1`

---

## Přehled

Tato verze uzavírá první produkčně způsobilý milestone aplikace **MHDSI — Metodika dopadových studií strategických investic**. Zahrnuje kompletní výpočetní jádro (M3–M6), M7 konsolidaci scénářů, M8 report completeness a auditní vrstvu.

---

## Co je v RC1

### P1 — Pipeline derivace vstupů

- Derivace P1 vrstev z wizard stavu: `LayerM0Project`, `LayerM1Territory`, `LayerM2AsIsBaseline`.
- `P1PipelineBridgeFlags` pro řízení přemostění chybějících vstupů.
- Migrace starých `WizardState` verzí (`wizard-state-migration.ts`).

### EPIC 1 — M3 Zaměstnanost

- Výpočet přímých a přenesených pracovních míst.
- Fallback `util_RZPS` s viditelným varováním.
- Strukturovaná varování `EngineWarning` (code, message, field).

### EPIC 2 — M4 Bydlení

- Výpočet bytových jednotek, PRUD, relokace.
- Centralizované implicitní fallbacky (`implicit-fallbacks.ts`).

### EPIC 3 — M5 Občanská vybavenost

- Výpočet FTE sekundárního občanského sektoru.
- OQ-07 pro neimplementovaný leisure deficit (viditelné varování).

### EPIC 4 — M6 Ekonomika a fiskální dopady

- Výpočet ΔHDP, fiskálních toků, multiplikátorů.
- OQ-10 (θ_rud) a OQ-11 (NPV) jako viditelné ASSUMPTION_FALLBACK / OPEN_QUESTION varování.
- Trace kroků v `intermediateValues`.

### M7 — Konsolidace scénářů

- `buildM7ScenarioConsolidation`: řádky srovnávací tabulky přes všechny scénáře.
- Přímý odkaz ze `section11` snapshot → M7 data (single source of truth).

### EPIC 5 — M8 Report Completeness

- `MethodologyReportSnapshot` verze **1.4.0**.
- `m8_report_completeness`: osnova 10 bodů + 4 přílohy + content layer index (inputs, baseline, module_results, scenarios, assumptions_oq_fallback).
- `LayerBadge` + `M8OutlineBlock` v rendereru (screen + print varianta).
- Přílohy (sekce 11–14) standardizovány s viditelným oddělovačem.
- Exporty (`serializeReportSnapshot`, `downloadAllReportExports`) zahrnují M8 metadata; `downloadAllReportExports` přijímá volitelný `preBuiltSnapshot` pro garanci konzistence UUID/timestamp.

### Auditní vrstva

- `section12_openQuestions`: všechny OQ z pipeline viditelné v reportu.
- `section13_auditSnapshot`: JSON výpis snapshotu (sbalený na obrazovce, zkrácený v tisku).
- `section14_assumptions`: přehled platných předpokladů s rozlišením fallback / override.

---

## Změny schématu

| Verze | Datum | Změna |
|-------|-------|-------|
| 1.4.0 | 2026-04-04 | Přidáno `m8_report_completeness` (EPIC 5) |
| 1.3.0 | 2026-04-02 | Přidáno `m7_scenario_consolidation`, `section11_comparison` |
| 1.2.0 | 2026-04-01 | Strukturovaná varování, OQ sekce, assumpt sekce |
| 1.1.0 | 2026-03-30 | Přidán P1 layer bridge |
| 1.0.0 | 2026-03-28 | Počáteční snapshot |

---

## Testovací pokrytí RC1

| Testovací sada | Počet testů | Výsledek |
|----------------|-------------|----------|
| Vitest unit (M3–M6, pipeline, warnings, P1) | ~90 | ✓ PASS |
| Golden snapshot `MethodologyReportSnapshot` | 1 | ✓ PASS |
| M7 scenario consolidation | ~20 | ✓ PASS |
| M8 report completeness | 19 | ✓ PASS |
| M6 consistency (report–engine bridge) | ~15 | ✓ PASS |
| Playwright e2e (happy path wizard → report → print) | ~5 | ✓ PASS |

---

## Spuštění kontrol před RC tagem

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium  # pouze při prvním běhu
npm run test:e2e
```

Viz `RELEASE_CHECKLIST.md` pro kompletní kroky.

---

## Known Limitations

Viz [`docs/KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md) pro úplný seznam. Klíčové:

1. Persistence výsledků: pouze `localStorage` pro `WizardState`; výsledky se ztrácí po F5.
2. PDF: pouze tisk prohlížeče, žádný server-side renderer.
3. M5 leisure deficit: neimplementováno (OQ-07).
4. OQ-10, OQ-11: vždy fallback hodnoty.
5. Jazyk: pouze čeština.

---

## Co není součástí RC1

- GIS mapové vrstvy.
- PPTX export.
- Server-side PDF.
- Vícejazyčnost.
- CI/CD konfigurace.
- Nová metodika mimo PDF spec.
