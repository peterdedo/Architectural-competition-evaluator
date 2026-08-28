import { useState, useEffect, useRef, useCallback } from 'react';

// Návrhy jsou sdílené napříč celou porotou (na rozdíl od hodnocení – viz useScoringSettings).
// API je záměrně stejné jako u useLocalStorage ([hodnota, setHodnota]), aby šlo v
// WizardContext.jsx vyměnit jen jeden řádek. Uvnitř se ale místo přepsání celého pole
// posílá jen diff (POST nový / PATCH změněný / DELETE smazaný), protože víc lidí edituje
// stejná data zároveň – naivní "ulož celé pole" by mohlo smazat, co právě přidal někdo jiný.
function toApiPayload(n) {
  return {
    id: n.id,
    nazev: n.nazev,
    status: n.status,
    source: n.source ?? null,
    fileFormat: n.fileFormat ?? null,
    data: n.data ?? {},
  };
}

export function useNavrhy() {
  const [projects, setProjectsState] = useState([]);
  const prevRef = useRef([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/navrhy', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('failed to load navrhy'))))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.navrhy) ? data.navrhy : [];
        prevRef.current = list;
        setProjectsState(list);
      })
      .catch((e) => console.error('Nepodařilo se načíst návrhy ze serveru:', e));
    return () => {
      cancelled = true;
    };
  }, []);

  const syncDiff = useCallback((prevList, nextList) => {
    const prevMap = new Map(prevList.map((n) => [n.id, n]));
    const nextMap = new Map(nextList.map((n) => [n.id, n]));

    nextMap.forEach((navrh, id) => {
      const prev = prevMap.get(id);
      const payload = toApiPayload(navrh);
      if (!prev) {
        fetch('/api/navrhy', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((e) => console.error('Uložení nového návrhu selhalo:', e));
      } else if (JSON.stringify(toApiPayload(prev)) !== JSON.stringify(payload)) {
        fetch(`/api/navrhy/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((e) => console.error('Uložení návrhu selhalo:', e));
      }
    });

    prevMap.forEach((_, id) => {
      if (!nextMap.has(id)) {
        fetch(`/api/navrhy/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' }).catch((e) =>
          console.error('Smazání návrhu selhalo:', e)
        );
      }
    });
  }, []);

  const setProjects = useCallback(
    (value) => {
      setProjectsState((current) => {
        const next = typeof value === 'function' ? value(current) : value;
        const nextArray = Array.isArray(next) ? next : Object.values(next || {});
        syncDiff(prevRef.current, nextArray);
        prevRef.current = nextArray;
        return nextArray;
      });
    },
    [syncDiff]
  );

  return [projects, setProjects];
}
