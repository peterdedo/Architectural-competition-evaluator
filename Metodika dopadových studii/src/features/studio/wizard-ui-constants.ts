import type { EngineWarning } from "@/lib/mhdsi/calculations/types";

/** Stabilní reference — `?? []` v renderu by rozbíjelo `React.memo`. */
export const EMPTY_WARNINGS: EngineWarning[] = [];
