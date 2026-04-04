import type { EngineWarning } from "./types";

export function engineWarning(
  code: string,
  message: string,
  field?: string,
): EngineWarning {
  return field ? { code, message, field } : { code, message };
}

export function pushWarning(
  warnings: EngineWarning[],
  code: string,
  message: string,
  field?: string,
): void {
  warnings.push(engineWarning(code, message, field));
}

export function warnMissingInput(
  warnings: EngineWarning[],
  field: string,
  context?: string,
): void {
  pushWarning(
    warnings,
    "MISSING_INPUT",
    context ? `${field}: ${context}` : `Chybí nebo neplatná hodnota: ${field}`,
    field,
  );
}
