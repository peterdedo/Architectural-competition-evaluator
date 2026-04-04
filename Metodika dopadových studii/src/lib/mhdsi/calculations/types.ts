/**
 * Shared result envelope for MHDSI calculation engine (pure functions).
 * Aligns with audit expectations: traceability, assumptions, OQ bridges.
 */

export type MethodologyClassification =
  | "EXPLICIT_IN_METHODOLOGY"
  | "CONFIGURABLE_ASSUMPTION"
  | "OPEN_QUESTION_BRIDGE";

export interface TraceStep {
  id: string;
  classification: MethodologyClassification;
  /** DRV-xxx or formula label */
  drvId?: string;
  description?: string;
  value?: unknown;
}

/** Konzistentní varování pro UI (české texty v `message` z modulů). */
export interface EngineWarning {
  code: string;
  message: string;
  /** Volitelný klíč vstupu (pro zaměření pole ve formuláři). */
  field?: string;
}

export interface EngineResult<T> {
  result: T;
  inputsUsed: Record<string, unknown>;
  assumptionsUsed: Record<string, number | string | boolean>;
  intermediateValues: Record<string, unknown>;
  warnings: EngineWarning[];
  openQuestionsTouched: string[];
  trace: TraceStep[];
}

export function emptyEngineResult<T>(result: T): EngineResult<T> {
  return {
    result,
    inputsUsed: {},
    assumptionsUsed: {},
    intermediateValues: {},
    warnings: [],
    openQuestionsTouched: [],
    trace: [],
  };
}

export function mergeEngineResult<T>(
  base: EngineResult<T>,
  patch: Partial<Omit<EngineResult<T>, "result">> & { result?: T },
): EngineResult<T> {
  return {
    ...base,
    result: patch.result !== undefined ? patch.result : base.result,
    inputsUsed: { ...base.inputsUsed, ...patch.inputsUsed },
    assumptionsUsed: { ...base.assumptionsUsed, ...patch.assumptionsUsed },
    intermediateValues: {
      ...base.intermediateValues,
      ...patch.intermediateValues,
    },
    warnings: [...base.warnings, ...(patch.warnings ?? [])] as EngineWarning[],
    openQuestionsTouched: [
      ...new Set([
        ...base.openQuestionsTouched,
        ...(patch.openQuestionsTouched ?? []),
      ]),
    ],
    trace: [...base.trace, ...(patch.trace ?? [])],
  };
}
