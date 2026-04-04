import type { MethodologyClassification, TraceStep } from "./types";

export function traceStep(
  id: string,
  classification: MethodologyClassification,
  drvId: string | undefined,
  description: string,
  value: unknown,
): TraceStep {
  return { id, classification, drvId, description, value };
}
