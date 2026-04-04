/**
 * Domain barrel — MHDSI spec types.
 *
 * ## Aktivně používáno živou aplikací
 *
 * - `./open-questions`         — OpenQuestionIds (engine: economic.ts, civic.ts)
 * - `./assumptions-registry`   — AssumptionKey, DefaultAssumptionValues (engine: resolve-assumptions.ts)
 * - `./methodology/p1-layers`  — LayerM0Project, LayerM1Territory, LayerM2AsIsBaseline (features/studio/*, features/report/types.ts)
 * - `./methodology/p1-pipeline-bridge` — P1PipelineBridgeFlags (features/studio/*, features/report/types.ts)
 *
 * ## Legační specifikační typy (Zod schémata z designové fáze, nevyužívané živou aplikací)
 *
 * Typy níže jsou původní Zod schémata z fáze domény (Prompt 1–2).
 * Živou aplikací **nejsou importovány** — kanonickým datovým modelem je
 * `MethodologyReportSnapshot` z `@/features/report/types`.
 * Ponechány pro dokumentaci a případnou migraci v2.
 *
 * - `./raw/*`                  — INP vstupní typy (raw Zod schémata)
 * - `./outputs/*`              — výstupní typy Zod
 * - `./derived/*`              — odvozené hodnoty Zod
 * - `./audit/*`                — CalculationTrace, CalculationRun Zod
 * - `./report/report-snapshot` — starý ReportSnapshot Zod (nahrazen MethodologyReportSnapshot)
 * - `./common/geometry`        — Geometry Zod
 * - `./field-meta`             — FieldMeta Zod
 * - `./assumption-set`         — AssumptionSet Zod
 * - `./scenario`               — Scenario Zod
 * - `./modules`                — MHDSI_MODULES, VypBlockId Zod
 */

export * from "./modules";
export * from "./field-meta";
export * from "./assumptions-registry";
export * from "./open-questions";
export * from "./assumption-set";
export * from "./scenario";

export * from "./common/geometry";

export * from "./raw/investor";
export * from "./raw/project";
export * from "./raw/project-timeline";
export * from "./raw/territorial-definition";
export * from "./raw/inputs-employment";
export * from "./raw/inputs-housing";
export * from "./raw/inputs-civic";
export * from "./raw/inputs-economic";
export * from "./raw/inputs-as-is-trends";
export * from "./raw/inputs-impact-quality";

export * from "./derived/derived-values";
export * from "./outputs/calculation-outputs";

export * from "./audit/calculation-trace";
export * from "./audit/calculation-run";

export * from "./report/report-snapshot";
