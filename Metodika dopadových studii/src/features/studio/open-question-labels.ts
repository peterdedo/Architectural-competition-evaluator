/** OQ id z engine / domain → krátký popis pro uživatele (česky). */
export const OPEN_QUESTION_LABELS_CS: Record<string, string> = {
  "OQ-01": "Korekce DIADak a znaménko u Tinfr",
  "OQ-02": "Jednotky času poslední míle (T_posm)",
  "OQ-03": "Vzorec trendu (V0, Vk, n)",
  "OQ-04": "Agregace substituce napříč profesemi",
  "OQ-05": "Nepřímá a indukovaná pracovní místa",
  "OQ-06": "Automatická volba situace bydlení A/B",
  "OQ-07": "Seznam výpočtů a indikátorů (sekce 0.6)",
  "OQ-08": "Zdravotnictví NX = OU / PX",
  "OQ-09": "Konzistence textů mitigace",
  "OQ-10": "Legislativní přesnost θ a RUD v čase",
  "OQ-11": "NPV a diskontování víceletých toků",
};

export function openQuestionLabelCs(id: string): string {
  return OPEN_QUESTION_LABELS_CS[id] ?? id;
}
