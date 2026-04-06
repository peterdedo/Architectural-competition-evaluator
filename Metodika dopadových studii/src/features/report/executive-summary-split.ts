/**
 * Rozdělení generovaného `executiveSummaryCs` na formální body osnovy 9.1 a 9.2
 * bez nových výpočtů — vychází z nadpisů v `buildExecutiveSummaryCs`.
 */
const SPLIT_MARKER = "\n#### Co závisí na předpokladech";

export function splitExecutiveSummaryForOutlineCh9(text: string): {
  section91: string;
  section92: string;
} {
  const t = text.trim();
  if (!t) {
    return { section91: "", section92: "" };
  }
  const idx = t.indexOf(SPLIT_MARKER);
  if (idx === -1) {
    return { section91: t, section92: "" };
  }
  return {
    section91: t.slice(0, idx).trim(),
    section92: t.slice(idx).trim(),
  };
}
