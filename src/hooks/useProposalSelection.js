import { useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

// Které návrhy jsou aktuálně zahrnuté do porovnání (tabulka, heatmapa, radar, datové pohledy).
// Ukládá se seznam VYLOUČENÝCH id (ne vybraných) – nový/nahraný návrh je tak automaticky
// vidět, dokud ho porota sama nevypne. Sdíleno mezi kroky Bilanční údaje a Datové pohledy
// (stejný localStorage klíč), aby výběr při přepínání kroků nezmizel.
export function useProposalSelection(navrhy) {
  const [excludedIds, setExcludedIds] = useLocalStorage('archieval-comparison-excluded', []);
  const excludedSet = useMemo(() => new Set(excludedIds), [excludedIds]);

  const isSelected = (id) => !excludedSet.has(id);

  const toggle = (id) => {
    setExcludedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return Array.from(s);
    });
  };

  const selectAll = () => setExcludedIds([]);
  const selectNone = () => setExcludedIds(navrhy.map((n) => n.id));

  const selected = useMemo(
    () => navrhy.filter((n) => !excludedSet.has(n.id)),
    [navrhy, excludedSet]
  );

  return {
    isSelected,
    toggle,
    selectAll,
    selectNone,
    selected,
    selectedCount: selected.length,
    total: navrhy.length,
  };
}
