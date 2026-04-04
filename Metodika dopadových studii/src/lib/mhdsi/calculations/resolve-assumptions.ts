import {
  DefaultAssumptionValues,
  type AssumptionKey,
} from "../../../domain/assumptions-registry";

export type AssumptionOverrides = Partial<
  Record<AssumptionKey | string, number | string | boolean>
>;

/**
 * Resolves by **PDF symbol** (e.g. `gamma`, `k_inv`): overrides first, then `DefaultAssumptionValues`.
 */
export function resolveAssumptions(
  overrides: AssumptionOverrides | undefined,
  symbols: readonly string[],
): {
  resolved: Record<string, number | string | boolean>;
  assumptionsUsed: Record<string, number | string | boolean>;
} {
  const resolved: Record<string, number | string | boolean> = {};
  const assumptionsUsed: Record<string, number | string | boolean> = {};

  const defaults = DefaultAssumptionValues as Readonly<
    Partial<Record<string, number | string>>
  >;

  for (const sym of symbols) {
    const fromOverride = overrides?.[sym];
    if (
      fromOverride !== undefined &&
      (typeof fromOverride === "number" ||
        typeof fromOverride === "string" ||
        typeof fromOverride === "boolean")
    ) {
      resolved[sym] = fromOverride;
      assumptionsUsed[sym] = fromOverride;
      continue;
    }
    const d = defaults[sym];
    if (d !== undefined) {
      resolved[sym] = d;
      assumptionsUsed[sym] = d;
    }
  }

  if (overrides) {
    for (const [k, v] of Object.entries(overrides)) {
      if (
        v !== undefined &&
        (typeof v === "number" ||
          typeof v === "string" ||
          typeof v === "boolean")
      ) {
        if (resolved[k] === undefined) {
          resolved[k] = v;
          assumptionsUsed[k] = v;
        }
      }
    }
  }

  return { resolved, assumptionsUsed };
}

export function getNumeric(
  resolved: Record<string, number | string | boolean>,
  symbol: string,
  fallback?: number,
): number | undefined {
  const v = resolved[symbol];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}
