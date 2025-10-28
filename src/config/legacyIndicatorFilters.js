/**
 * Konfigurovateľné pravidlá na odfiltrovanie legacy / neželaných vlastných indikátorov.
 * Namiesto hardcodu v App.jsx.
 */
export const LEGACY_CUSTOM_INDICATOR_IDS_TO_EXCLUDE = new Set(['custom_1761333530207']);

/** Malé písmená – porovnanie s názvom indikátora */
export const LEGACY_CUSTOM_INDICATOR_NAME_SUBSTRINGS = ['toalety', 'toilet', 'wc'];

/**
 * Či dané ID patrí medzi legacy vlastné indikátory, ktoré sa majú skryť z UI / výpočtov.
 * @param {string|undefined|null} id
 * @returns {boolean}
 */
export function isLegacyExcludedIndicatorId(id) {
  if (id == null || id === '') return false;
  return LEGACY_CUSTOM_INDICATOR_IDS_TO_EXCLUDE.has(String(id));
}

/**
 * Z poľa objektov s vlastnosťou `id` odstráni legacy ID (napr. indikátory pre grafy).
 * @template T extends { id: string }}
 * @param {T[]|null|undefined} items
 * @returns {T[]}
 */
export function withoutLegacyExcludedById(items) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item && !isLegacyExcludedIndicatorId(item.id));
}

export function shouldExcludeCustomIndicator(indicator) {
  if (!indicator || typeof indicator !== 'object') return false;
  if (isLegacyExcludedIndicatorId(indicator.id)) return true;
  const nazev = indicator.nazev ? String(indicator.nazev).toLowerCase() : '';
  return LEGACY_CUSTOM_INDICATOR_NAME_SUBSTRINGS.some((s) => nazev.includes(s));
}
