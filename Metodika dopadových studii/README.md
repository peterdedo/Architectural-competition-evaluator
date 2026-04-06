# MHDSI — studie dopadů strategických investic (MVP)

**Verze:** 1.0.0 · **Stav:** vydaná MVP / metodická aplikace (omezení viz `docs/KNOWN_LIMITATIONS.md`)

České rozhraní nad výpočetním jádrem, průvodce vstupy, výstupní report a tisková verze (PDF přes prohlížeč).  
Výpočetní jádro pokrývá moduly M3 (Zaměstnanost), M4 (Bydlení), M5 (Občanská vybavenost), M6 (Ekonomika), M7 (Scénáře) a M8 (Report completeness).

## Požadavky

- Node.js 18+ (doporučeno LTS)
- npm

## Instalace a vývoj

```bash
npm install
npm run dev
```

Aplikace běží na [http://localhost:3000](http://localhost:3000). Výchozí stránka přesměruje na průvodce (`/studio`).

## Build a produkční režim

```bash
npm run build
npm run start
```

## Příkazy npm (přehled)

| Příkaz | Popis |
|--------|--------|
| `npm run dev` | Vývojový server Next.js |
| `npm run build` | Produkční build |
| `npm run start` | Produkční server (po `build`) |
| `npm run lint` | ESLint (`next lint`) |
| `npm run typecheck` | TypeScript bez emit (`tsc --noEmit`) |
| `npm run test` | Vitest — unit testy jádra, mapování varování, golden snapshot reportu, smoke rout |
| `npm run test:watch` | Vitest v režimu sledování souborů |
| `npm run test:e2e` | Playwright — happy path průvodce → report → tisk; před prvním během: `npx playwright install chromium` |

## Testy

**Vitest:** jádro výpočtů, `resolveWarningFieldNavigation`, golden snapshot `MethodologyReportSnapshot` pro demo data, smoke existence stránek `/report` a `/report/print` ve zdroji.

**Playwright:** `playwright.config.ts` při běhu spouští `npm run build && npm run start` a testuje `http://127.0.0.1:3000`. Lokálně při již běžícím `npm run start` lze využít `reuseExistingServer` (bez `CI=true`).

## Dokumentace

- **Tisk a PDF (MVP):** [src/features/report/PRINT_PDF.md](src/features/report/PRINT_PDF.md) — zdroj dat, `/report/print`, uložení jako PDF, omezení tiskové vrstvy.
- **Known Limitations:** [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) — úplný seznam záměrně otevřených omezení z finálního auditu.
- **Release Notes RC1:** [docs/RELEASE_NOTES_RC1.md](docs/RELEASE_NOTES_RC1.md) — co je v RC1, schéma changelog, testovací pokrytí.
- **System spec:** [docs/mhdsi-system-spec.md](docs/mhdsi-system-spec.md) — zdrojová metodika (PDF § 3.1 apod.).

## Known MVP limitations (přehled)

Klíčové body — úplný seznam viz **[docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md)**:

- **Persistence výsledků:** výsledky pipeline po přepočtu **nejsou** trvale uloženy (v `localStorage` je stav průvodce, ne výsledky). Po obnovení stránky (`F5`) může být `/report` bez dat — znovu dokončete krok „Výsledky a srovnání scénářů" v průvodci a případně přejděte na report.
- **PDF:** žádný serverový generátor PDF — export je přes **tisk prohlížeče** (viz PRINT_PDF.md). Rozložení stránek a fonty závisí na prohlížeči a ovladači tiskárny.
- **Jazyk:** uživatelské texty jsou **pouze v češtině**.
- **Tisk auditní přílohy:** v tiskové verzi může být JSON zkrácen; plný obsah je v elektronickém JSON exportu z `/report` (viz PRINT_PDF.md).
- **M5 leisure deficit, OQ-10, OQ-11:** neimplementováno / vždy fallback — viditelná varování v reportu.

## Release checklist

Detailní kontrolní seznam s checkboxy: **[RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)**.

Stručně před release candidate:

1. `npm install` → `npm run lint` → `npm run typecheck` → `npm run test` → `npm run build`
2. `npx playwright install chromium` (dle potřeby) → `npm run test:e2e`
3. Ruční smoke: `npm run start` → průvodce → přepočet → `/report` → `/report/print` → tisk/PDF dle potřeby

CI/CD není součástí tohoto repozitáře.
