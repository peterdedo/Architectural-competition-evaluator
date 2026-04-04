import { z } from "zod";

/**
 * Oddíl 3.1 ve spec — osnova reportu (10 bodů), EXPLICIT_IN_METHODOLOGY.
 * Stored snapshot for M8 export (JSON/CSV MVP; PPTX v2).
 *
 * **Není** kanonický model aplikační reportové vrstvy po Promptu 5.
 * Pro HTML report, JSON export a budoucí PDF použijte **`MethodologyReportSnapshot`**
 * z `@/features/report/types` (sestavení přes `buildMethodologyReportSnapshot`).
 */
export const reportSectionOutlineSchema = z.object({
  sectionNumber: z.number().int().min(1).max(10),
  title: z.string(),
  contentMarkdown: z.string().optional(),
  annexRefs: z.array(z.string()).optional(),
});

export type ReportSectionOutline = z.infer<typeof reportSectionOutlineSchema>;

export const reportSnapshotSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  /** Which calculation results are frozen into this report */
  calculationRunId: z.string().uuid(),

  generatedAt: z.string().datetime(),
  /** Struktura oddílu 3.1 ve spec */
  outlineSections: z.array(reportSectionOutlineSchema).min(1),
  /** Manager summary — explicit in PDF */
  executiveSummary: z.string().optional(),

  /** MVP: JSON/CSV export metadata */
  exportFormats: z.array(z.enum(["json", "csv"])).default(["json", "csv"]),
  /** v2: pptx, map annexes */
  extension: z.record(z.unknown()).optional(),
});

export type ReportSnapshot = z.infer<typeof reportSnapshotSchema>;
