import type { MhdsiModuleId } from "./modules";

/** Classification from mhdsi-system-spec.md */
export type MethodologyClassification =
  | "EXPLICIT_IN_METHODOLOGY"
  | "CONFIGURABLE_ASSUMPTION"
  | "OPEN_QUESTION";

/**
 * Optional documentation for fields (not enforced at runtime; use for codegen/docs).
 */
export interface FieldMeta {
  /** Reference e.g. INP-301, DRV-007 */
  sourceId?: string;
  module: MhdsiModuleId | MhdsiModuleId[];
  mvp: boolean;
  classification: MethodologyClassification;
  /** Note when PDF is ambiguous — model stays extensible */
  openQuestionRef?: string;
}
