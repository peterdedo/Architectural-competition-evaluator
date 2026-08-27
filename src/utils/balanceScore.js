// Vážené hodnocení bilančních ukazatelů (P03) – nastavuje si ho porota v UI, appka nic
// nevymýšlí: bez explicitně zvoleného směru (viz utils/scoringSettings.js) se ukazatel
// do skóre nezapočítává. Cena (P06) do tohoto skóre nevstupuje (samostatné kritérium
// „ekonomická efektivita" dle soutěžních podmínek – viz StepResults.jsx).
//
// Normalizace: poměr k nejlepšímu návrhu napříč porovnávanými návrhy (ne min-max) – nejlepší
// hodnota vždy = 100 %, ostatní = kolik % z ní dosahují. Pro direction: 'higher' je to
// value/nejlepší; pro 'lower' (méně je lépe) nejlepší/value, protože nejlepší je tam
// nejnižší hodnota. Celkové skóre = vážený průměr normalizovaných hodnot (0–100), nikdy
// surový součet.

export const DIRECTIONS = { HIGHER: 'higher', LOWER: 'lower' };

const DEFAULT_WEIGHT = 10;

/** Pro každý ukazatel spočítá pozorovaný rozsah (min/max) napříč zadanými návrhy. */
export function computeIndicatorRanges(proposals, indicators) {
  const ranges = {};
  (indicators || []).forEach((ind) => {
    const values = (proposals || [])
      .map((p) => ind.getValue(p?.data || {}))
      .filter((v) => v !== null && Number.isFinite(v));
    ranges[ind.id] = values.length > 0 ? { min: Math.min(...values), max: Math.max(...values) } : { min: null, max: null };
  });
  return ranges;
}

/**
 * Skóre jednoho návrhu.
 * @param {Object} project - návrh (project.data = bilanční data)
 * @param {Array} indicators - SCORING_INDICATORS (případně obohacené o observedMin/observedMax)
 * @param {Object} directions - { [indicatorId]: 'higher' | 'lower' } – chybí-li klíč, ukazatel se nezapočítá
 * @param {Object} weights - { [indicatorId]: number } – výchozí váha DEFAULT_WEIGHT
 */
export function scoreProject(project, indicators, directions = {}, weights = {}) {
  const safeIndicators = Array.isArray(indicators) ? indicators : [];
  let totalWeighted = 0;
  let totalWeight = 0;
  const indicatorScores = [];

  safeIndicators.forEach((ind) => {
    const direction = directions[ind.id];
    if (direction !== DIRECTIONS.HIGHER && direction !== DIRECTIONS.LOWER) return; // porota nevybrala → mimo skóre

    const value = ind.getValue(project?.data || {});
    if (value === null || !Number.isFinite(value)) return; // chybějící hodnota → vynech, neboduj nulou

    // Nejlepší pozorovaná hodnota napříč porovnávanými návrhy – pro "vyšší lepší" nejvyšší,
    // pro "nižší lepší" nejnižší. Ta vždy dostane 100 %, ostatní poměrem k ní.
    const best = direction === DIRECTIONS.HIGHER ? ind.observedMax : ind.observedMin;
    let normalized;
    if (!Number.isFinite(best)) {
      normalized = 100; // žádný návrh nemá hodnotu – nelze rozlišit, bere se jako splněno
    } else if (best === 0) {
      // Poměr k nule je nedefinovaný (dělení nulou) – náhradou lineární pozice mezi nejhorší
      // a nejlepší (0) pozorovanou hodnotou, aby „napůl k nejhoršímu" dalo 50 %, ne rovnou 0.
      const worst = direction === DIRECTIONS.HIGHER ? ind.observedMin : ind.observedMax;
      if (!Number.isFinite(worst) || worst === best) {
        normalized = 100; // všichni na nule – nelze rozlišit
      } else {
        normalized =
          direction === DIRECTIONS.HIGHER
            ? ((value - worst) / (best - worst)) * 100
            : ((worst - value) / (worst - best)) * 100;
      }
    } else {
      normalized = direction === DIRECTIONS.HIGHER ? (value / best) * 100 : (best / value) * 100;
    }
    normalized = Math.min(Math.max(normalized, 0), 100);

    const weight = Number.isFinite(weights[ind.id]) ? weights[ind.id] : DEFAULT_WEIGHT;
    totalWeighted += normalized * weight;
    totalWeight += weight;

    indicatorScores.push({
      id: ind.id,
      nazev: ind.nazev,
      sectionCode: ind.sectionCode,
      jednotka: ind.jednotka,
      value,
      direction,
      weight,
      normalized,
    });
  });

  const weightedScore = totalWeight > 0 ? totalWeighted / totalWeight : null; // null = nic se nehodnotí, ne 0

  return {
    ...project,
    weightedScore: weightedScore === null ? null : Number(weightedScore.toFixed(2)),
    scoredIndicatorCount: indicatorScores.length,
    indicatorScores,
  };
}

/** Obalí scoreProject pro celou sadu: nejprve spočítá rozsahy napříč všemi návrhy, pak skóruje. Seřadí sestupně. */
export function scoreProjects(projects, indicators, directions = {}, weights = {}) {
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeIndicators = Array.isArray(indicators) ? indicators : [];

  const ranges = computeIndicatorRanges(safeProjects, safeIndicators);
  const enriched = safeIndicators.map((ind) => ({
    ...ind,
    observedMin: ranges[ind.id]?.min,
    observedMax: ranges[ind.id]?.max,
  }));

  return safeProjects
    .map((p) => scoreProject(p, enriched, directions, weights))
    .sort((a, b) => (b.weightedScore ?? -Infinity) - (a.weightedScore ?? -Infinity));
}
