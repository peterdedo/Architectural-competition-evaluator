/**
 * Validace vah v modalu nastavení vah (kategorie + vybrané indikátory).
 * @param {object} params
 * @param {Array<{ id: string, nazev: string }>} params.kategorieDef
 * @param {Record<string, number>} params.categoryWeights
 * @param {Record<string, number>} params.indicatorWeights
 * @param {Set<string>|string[]} params.selectedIndicatorIds
 * @param {Array<{ id: string, kategorie: string }>} params.allIndicators
 * @param {number} [params.tolerance]
 */
export function validateWeightModalState({
  kategorieDef,
  categoryWeights,
  indicatorWeights,
  selectedIndicatorIds,
  allIndicators,
  tolerance = 0.15,
}) {
  const errors = [];
  /** @type {Record<string, boolean>} */
  const fieldErrors = {};
  let firstScrollId = null;

  const selected = selectedIndicatorIds instanceof Set ? selectedIndicatorIds : new Set(selectedIndicatorIds);

  const sumCategories = kategorieDef.reduce((s, cat) => {
    const w = Number(categoryWeights[cat.id]);
    return s + (Number.isFinite(w) ? w : 0);
  }, 0);

  if (Math.abs(sumCategories - 100) > tolerance) {
    errors.push(
      `Součet vah kategorií musí být 100 % (nyní ${sumCategories.toFixed(1)} %).`
    );
    firstScrollId = firstScrollId || 'summary-categories';
  }

  for (const cat of kategorieDef) {
    const w = Number(categoryWeights[cat.id]);
    const cw = Number.isFinite(w) ? w : 0;

    const inCat = allIndicators.filter((ind) => selected.has(ind.id) && ind.kategorie === cat.id);

    if (inCat.length === 0 && cw > tolerance) {
      errors.push(
        `Kategorie „${cat.nazev}“ má nastavenou váhu, ale nemá vybraný žádný indikátor.`
      );
      fieldErrors[`cat-${cat.id}`] = true;
      if (!firstScrollId) firstScrollId = `cat:${cat.id}`;
    }

    if (inCat.length > 0) {
      let sumInd = 0;
      for (const ind of inCat) {
        const iw = Number(indicatorWeights[ind.id]);
        sumInd += Number.isFinite(iw) ? iw : 0;
      }
      if (Math.abs(sumInd - 100) > tolerance) {
        errors.push(
          `Váhy indikátorů v kategorii „${cat.nazev}“ musí dát dohromady 100 % (nyní ${sumInd.toFixed(1)} %).`
        );
        fieldErrors[`cat-ind-${cat.id}`] = true;
        inCat.forEach((ind) => {
          fieldErrors[`ind-${ind.id}`] = true;
        });
        if (!firstScrollId) firstScrollId = `cat-ind:${cat.id}`;
      }
    }
  }

  for (const ind of allIndicators) {
    if (!selected.has(ind.id)) continue;
    const iw = Number(indicatorWeights[ind.id]);
    if (!Number.isFinite(iw) || iw < 0 || iw > 100) {
      errors.push(`Indikátor „${ind.nazev || ind.id}“ má neplatnou váhu (povolený rozsah 0–100 %).`);
      fieldErrors[`ind-${ind.id}`] = true;
      if (!firstScrollId) firstScrollId = `ind:${ind.id}`;
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    fieldErrors,
    firstScrollId,
  };
}

/**
 * @param {string|number} raw
 * @returns {number|null} null = prázdné, NaN = neplatné
 */
export function parseWeightInput(raw) {
  if (raw === '' || raw == null) return null;
  const cleaned = String(raw).replace(',', '.').replace(/[^\d.-]/g, '').trim();
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return NaN;
  return Math.max(0, Math.min(100, Math.round(n * 100) / 100));
}
