# Tisk a PDF (MVP) — MHDSI report

## Zdroj dat

- Jediný kanonický vstup: **`MethodologyReportSnapshot`** (`src/features/report/types.ts`).
- Sestavení: **`buildMethodologyReportSnapshot(state, results)`** — stejné jako na stránce `/report`.
- **Žádné přepočty** v tiskové / PDF vrstvě: komponenty pouze vykreslí existující snapshot.

## Tisková route

- **`/report/print`** — tiskem přívětivé jednosloupcové rozložení, bez exportního toolbaru z `/report`.
- Obsah: **`ReportSnapshotRenderer`** s `variant="print"` (`src/features/report/components/ReportSnapshotRenderer.tsx`).
- Obal stránky: třída **`print-report-root`** (tiskové CSS: typografie, okraje obsahu).

## Jak vytvořit PDF (MVP)

1. Otevřete **`/report`** nebo přímo **`/report/print`** (vyžaduje nejdříve přepočet v průvodci).
2. Na `/report/print` klikněte **„Tisk nebo uložit jako PDF“** (nebo systémové Ctrl+P).
3. V dialogu tisku zvolte **„Uložit jako PDF“** / **Microsoft Print to PDF** apod.

Tím vznikne PDF z **stejného HTML** jako tisková verze — žádný druhý paralelní renderer.

## Styly

- **`src/features/report/print/report-print.css`** — importováno v `src/app/report/print/layout.tsx`.
- **`@media print`**: okraje A4, skrytí prvku s třídou **`print-no-print`**, styly pro **`print-report-root`** (typografie, černobílé boxy; bez globálního maskování `body`).
- **Page breaks**: Tailwind **`print:break-before-page`** na skupinách sekcí (viz `PrintBreak` v `ReportSnapshotRenderer`).
- **Černobílé zvýraznění**: třídy **`print-box-warn`**, **`print-box-assum`**, **`print-box-oq`** (ohraničení, nejen barva pozadí).

## Auditní příloha (sekce 13)

- Na obrazovce zůstává sbalená (collapsible).
- V **tisku** je výpis **zkrácený** přibližně na 12 000 znaků; doplněna poznámka odkazující na plný JSON export.

## Omezení MVP

- Závislost na **prohlížeči** (rozložení stránek, fonty, tiskové okraje).
- **Není** serverový headless Chrome / Puppeteer — lze doplnit v pozdější verzi bez změny `MethodologyReportSnapshot`.
- Vícejazyčnost: pouze **čeština** v uživatelské vrstvě.

## Co není součástí této vrstvy

- Přepis výpočetního jádra ani report snapshot modelu.
- Samostatný „PDF renderer“ mimo HTML → tisk.

## Související

- Kořenový [`README.md`](../../../README.md): instalace, všechny npm skripty, **Release checklist**, **Known MVP limitations**.
