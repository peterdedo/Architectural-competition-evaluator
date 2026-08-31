import { useState, useEffect, useRef, useCallback } from 'react';

// Návrhy jsou sdílené napříč celou porotou (na rozdíl od hodnocení – viz useScoringSettings).
// API je záměrně stejné jako u useLocalStorage ([hodnota, setHodnota]), aby šlo v
// WizardContext.jsx vyměnit jen jeden řádek. Uvnitř se ale místo přepsání celého pole
// posílá jen diff (POST nový / PATCH změněný / DELETE smazaný), protože víc lidí edituje
// stejná data zároveň – naivní "ulož celé pole" by mohlo smazat, co právě přidal někdo jiný.
//
// Optimistické zápisy: UI se aktualizuje hned. Když ale zápis na server SELŽE (např. mazání
// bez admin oprávnění, nebo výpadek sítě), NEZŮSTANE UI potichu rozejité s databází – provede
// se reconcile (znovunačtení pravdy ze serveru) a vyšle se událost pro toast. Tím se zavírá
// třída chyb, kdy neúspěšný POST/PATCH/DELETE tiše ztratí data.
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

function emitSyncError(message) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('archieval:navrhy-sync-error', { detail: { message } }));
  }
}

export function useNavrhy() {
  const [projects, setProjectsState] = useState([]);
  const prevRef = useRef([]);

  const loadFromServer = useCallback(async () => {
    const r = await fetch('/api/navrhy', { credentials: 'include' });
    if (!r.ok) throw new Error('failed to load navrhy');
    const data = await r.json();
    const list = Array.isArray(data?.navrhy) ? data.navrhy : [];
    prevRef.current = list;
    setProjectsState(list);
    return list;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadFromServer().catch((e) => {
      if (!cancelled) console.error('Nepodařilo se načíst návrhy ze serveru:', e);
    });
    return () => {
      cancelled = true;
    };
  }, [loadFromServer]);

  // Po selhání zápisu srovná UI s pravdou na serveru (reconcile) a upozorní uživatele.
  const reconcile = useCallback(
    (message) => {
      emitSyncError(message);
      loadFromServer().catch((e) => console.error('Reconcile návrhů selhal:', e));
    },
    [loadFromServer]
  );

  const syncDiff = useCallback(
    (prevList, nextList) => {
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
          })
            .then((r) => {
              if (!r.ok) throw new Error(`POST ${r.status}`);
            })
            .catch((e) => {
              console.error('Uložení nového návrhu selhalo:', e);
              reconcile(
                r0Status(e) === 409
                  ? `Návrh „${navrh.nazev}“ se nepodařilo uložit (kolize id) – zkuste ho nahrát znovu.`
                  : 'Uložení nového návrhu se nezdařilo – zobrazení bylo obnoveno ze serveru.'
              );
            });
        } else if (JSON.stringify(toApiPayload(prev)) !== JSON.stringify(payload)) {
          fetch(`/api/navrhy/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
            .then((r) => {
              if (!r.ok) throw new Error(`PATCH ${r.status}`);
            })
            .catch((e) => {
              console.error('Uložení návrhu selhalo:', e);
              reconcile('Uložení změny návrhu se nezdařilo – zobrazení bylo obnoveno ze serveru.');
            });
        }
      });

      prevMap.forEach((_, id) => {
        if (!nextMap.has(id)) {
          fetch(`/api/navrhy/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' })
            .then((r) => {
              if (!r.ok) throw new Error(`DELETE ${r.status}`);
            })
            .catch((e) => {
              console.error('Smazání návrhu selhalo:', e);
              reconcile(
                r0Status(e) === 403
                  ? 'Mazání návrhů může provést jen organizátor (admin). Návrh byl obnoven.'
                  : 'Smazání návrhu se nezdařilo – zobrazení bylo obnoveno ze serveru.'
              );
            });
        }
      });
    },
    [reconcile]
  );

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

// Vytáhne HTTP status z chyby "DELETE 403" apod. (jen pro hezčí hlášku, jinak fallback).
function r0Status(e) {
  const m = /(\d{3})/.exec(e instanceof Error ? e.message : String(e));
  return m ? Number(m[1]) : null;
}
