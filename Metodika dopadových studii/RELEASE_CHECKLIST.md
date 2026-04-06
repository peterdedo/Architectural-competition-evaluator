# Release checklist — MHDSI MVP 1.0.0

Použijte před označením buildu za **vydanou verzi 1.0.0** (nebo interní go-live). CI/CD není v tomto podadresáři — spouštějte kontroly lokálně (`npm run lint` až `build`) nebo ve vlastní pipeline s `working-directory` na tento projekt.

## Stav EPIC (uzavřeno před vydáním 1.0)

| EPIC | Popis | Stav |
|------|-------|------|
| P1 | Pipeline derivace vstupů (LayerM0–M2, P1BridgeFlags) | ✓ Uzavřeno |
| EPIC 1 — M3 | Zaměstnanost | ✓ Uzavřeno |
| EPIC 2 — M4 | Bydlení | ✓ Uzavřeno |
| EPIC 3 — M5 | Občanská vybavenost | ✓ Uzavřeno |
| EPIC 4 — M6 | Ekonomika a fiskální dopady | ✓ Uzavřeno |
| M7 | Konsolidace scénářů | ✓ Uzavřeno |
| EPIC 5 — M8 | Report completeness (schema 1.5.0 + explainability) | ✓ Uzavřeno |

## Automatizované kontroly

- [ ] `npm install`
- [ ] `npm run lint` (Next `next lint`; ESLint 8 + `eslint-config-next` ve verzi Next 14 — musí skončit bez chyb)
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build` (očekávejte čistý log; `next.config.mjs` nastavuje `NEXT_IGNORE_INCORRECT_LOCKFILE` kvůli známé chybě Next 14.2.34+ při auto-patchi lockfile pro `@next/swc-*`)
- [ ] (při prvním běhu / po aktualizaci Playwright) `npx playwright install chromium`
- [ ] `npm run test:e2e`

## Ruční smoke (produkční server)

- [ ] `npm run start` (po úspěšném `npm run build`)
- [ ] Průvodce (`/studio`) — projít krok výsledků a **Přepočíst všechny scénáře**
- [ ] `/report` — report se načte (ne prázdný stav „bez dat"); viditelné sekce M3–M6, M7 srovnání, M8 osnova
- [ ] `/report/print` — tisková verze, tlačítko tisku; případně **Ctrl+P** → Uložit jako PDF
- [ ] JSON export z `/report` — stažení snapshotu obsahuje `m8_report_completeness`, `explainability_summary` a `schema_version: "1.5.0"`
- [ ] Varování a OQ viditelné v sekci 12 a 14 reportu
- [ ] Auditní příloha (sekce 13) — na obrazovce sbalená, v tisku zkrácená s poznámkou

## Poznámky

- Po **F5** mohou chybět výsledky výpočtu — znovu přepočíst v průvodci. Viz **Known MVP limitations** v [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md).
- Tisk/PDF: [`src/features/report/PRINT_PDF.md`](src/features/report/PRINT_PDF.md).
- Schéma snapshotu: `MethodologyReportSnapshot` verze **1.5.0** (`src/features/report/types.ts`).
