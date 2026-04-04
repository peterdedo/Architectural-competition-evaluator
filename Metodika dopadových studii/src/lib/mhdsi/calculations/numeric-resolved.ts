import { ImplicitNumericFallbacks } from "./implicit-fallbacks";
import { getNumeric } from "./resolve-assumptions";
import { pushWarning } from "./warnings";
import type { EngineWarning } from "./types";

/**
 * Číslo z `resolved`; pokud chybí, použije `ImplicitNumericFallbacks` a přidá varování
 * (transparentní pro UI — není skrytá „jistota“).
 */
export function getNumericResolved(
  resolved: Record<string, number | string | boolean>,
  symbol: string,
  implicitKey: keyof typeof ImplicitNumericFallbacks,
  warnings: EngineWarning[],
): number {
  const v = getNumeric(resolved, symbol);
  if (v !== undefined) return v;
  const raw = ImplicitNumericFallbacks[implicitKey];
  const n = typeof raw === "number" ? raw : Number(raw);
  pushWarning(
    warnings,
    "ASSUMPTION_FALLBACK",
    `Parametr „${symbol}“ doplněn z implicit-fallbacks (${implicitKey}) — ověřte vůči studii.`,
    symbol,
  );
  return n;
}
