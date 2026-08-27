// Kategoriální paleta pro grafy s jednou barvou na návrh (scatter, podlažní profil).
// Vede s reálnými brand tokeny appky (primary/accent/warning z tailwind.config.js) a rozšiřuje
// je jen tam, kde je potřeba odlišit víc než 3 návrhy najednou – jinak by barvy splývaly.
export const CHART_PALETTE = [
  '#4BB349', // primary (brand – ověřeno vzorkováním loga 4ct.eu)
  '#0066A4', // accent (brand)
  '#F59E0B', // warning (brand) – zde jen jako kategoriální barva, ne stavový význam
  '#8B5CF6',
  '#06B6D4',
  '#EC4899',
  '#64748B',
  '#F97316',
];

export function colorForIndex(index) {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}
