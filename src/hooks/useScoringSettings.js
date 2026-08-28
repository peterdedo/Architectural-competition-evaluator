import { useState, useEffect, useRef, useCallback } from 'react';

// Nezávislé hodnocení KAŽDÉHO porotce (směr/váha) – server ukládá pod přihlášeným uživatelem
// (api/scoring), navrhy zůstávají sdílené (viz useNavrhy). Návratová hodnota nahrazuje dvě
// dřívější useLocalStorage volání v StepProposalComparison.jsx / StepDataViews.jsx.
const SAVE_DEBOUNCE_MS = 600;

export function useScoringSettings() {
  const [directions, setDirectionsState] = useState({});
  const [weights, setWeightsState] = useState({});
  const latest = useRef({ directions: {}, weights: {} });
  const saveTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/scoring', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('failed to load scoring settings'))))
      .then((data) => {
        if (cancelled) return;
        const d = data?.directions && typeof data.directions === 'object' ? data.directions : {};
        const w = data?.weights && typeof data.weights === 'object' ? data.weights : {};
        latest.current = { directions: d, weights: w };
        setDirectionsState(d);
        setWeightsState(w);
      })
      .catch((e) => console.error('Nepodařilo se načíst nastavení hodnocení ze serveru:', e));
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch('/api/scoring', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(latest.current),
      }).catch((e) => console.error('Uložení nastavení hodnocení selhalo:', e));
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const setDirections = useCallback(
    (value) => {
      setDirectionsState((current) => {
        const next = typeof value === 'function' ? value(current) : value;
        latest.current = { ...latest.current, directions: next };
        scheduleSave();
        return next;
      });
    },
    [scheduleSave]
  );

  const setWeights = useCallback(
    (value) => {
      setWeightsState((current) => {
        const next = typeof value === 'function' ? value(current) : value;
        latest.current = { ...latest.current, weights: next };
        scheduleSave();
        return next;
      });
    },
    [scheduleSave]
  );

  return { directions, setDirections, weights, setWeights };
}
