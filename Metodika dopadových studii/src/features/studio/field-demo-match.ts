import type { LabeledBaselineNumber } from "@/domain/methodology/p1-layers";

/**
 * Porovná text v inputu s ukázkovou hodnotou (trim, tolerantně čísla).
 * Prázdný current se považuje za odlišný od nenulového dema.
 */
export function valuesMatchDemoDisplay(
  current: string,
  demo?: string,
): boolean {
  if (demo === undefined) return false;
  const a = current.trim();
  const b = demo.trim();
  if (a === b) return true;
  const na = Number(a.replace(",", "."));
  const nb = Number(b.replace(",", "."));
  if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
  if (a === "" || b === "") return false;
  const scale = Math.max(1, Math.abs(nb));
  return Math.abs(na - nb) <= 1e-9 * scale;
}

export function numbersMatchDemo(
  current: number | "",
  demo?: number,
): boolean {
  if (demo === undefined) return false;
  if (current === "") return false;
  const scale = Math.max(1, Math.abs(demo));
  return Math.abs(current - demo) <= 1e-9 * scale;
}

export function labeledBaselineMatchesDemo(
  field: LabeledBaselineNumber,
  demo?: LabeledBaselineNumber,
): boolean {
  if (!demo) return false;
  if (field.kind !== demo.kind) return false;
  if (field.note.trim() !== demo.note.trim()) return false;
  const a = field.value;
  const b = demo.value;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return a === b;
  const scale = Math.max(1, Math.abs(b));
  return Math.abs(a - b) <= 1e-9 * scale;
}
