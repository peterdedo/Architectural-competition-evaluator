import { useCallback, useState } from 'react';
import { SCALAR_INPUT_FIELDS, FLOOR_COLLECTIONS, OFFER_PRICE, DEFAULT_FLOOR_LABELS } from '../data/balanceSchema.js';
import { safeNum, makeFloor, makeRoom } from '../utils/balanceCalculations.js';
import { callOpenAiChatJson, DEFAULT_AI_MODEL } from '../utils/aiChat.js';

// Extrahuje bilanční tabulku (P03) a nabídkovou cenu (P06) z obrázků stránek PDF pomocí
// vision modelu. Výstup je PŘÍMO ve tvaru navrh.data (viz balanceSchema.js) – žádný
// mezikrok/mapování na staré indikátory, appka má jen jeden datový model.

const floorFieldMeta = FLOOR_COLLECTIONS.filter((c) => c.kind === 'floors');
const roomsFieldMeta = FLOOR_COLLECTIONS.find((c) => c.kind === 'rooms');

function buildSchemaDescription() {
  const scalarLines = SCALAR_INPUT_FIELDS.map(
    (f) => `    "${f.id}": {"value": číslo_nebo_null, "source": "přesný zdroj v dokumentu (strana, tabulka)"} // ${f.nazev} [${f.jednotka}]`
  ).join('\n');

  const floorLines = floorFieldMeta
    .map(
      (c) => `  "${c.key}": {"floors": [{"label": "název podlaží", "value": číslo_nebo_null}, ...]} // ${c.nazev} [${c.jednotka}] – tolik položek, kolik podlaží dokument uvádí`
    )
    .join('\n');

  return `SCHÉMA ODPOVĚDI (vrať přesně tuto strukturu, žádný jiný text):
{
${scalarLines}
${floorLines}
  "${roomsFieldMeta.key}": {"floors": [{"label": "název podlaží", "rooms": [{"name": "název místnosti", "area": číslo_nebo_null}, ...]}, ...]} // ${roomsFieldMeta.nazev} [${roomsFieldMeta.jednotka}]
  "nabidkovaCena": {"items": [${OFFER_PRICE.items.map((it) => `{"id": "${it.id}", "price": číslo_nebo_null, "note": "krátká poznámka nebo prázdný řetězec"}`).join(', ')}]} // ${OFFER_PRICE.nazev} [${OFFER_PRICE.jednotka}, bez DPH] – POUZE pokud dokument nabídkovou cenu obsahuje, jinak nech price: null u všech položek
}`;
}

function buildSystemPrompt() {
  return `Jsi expert na analýzu podkladů architektonických soutěží. Extrahuješ POUZE skutečná číselná data z poskytnutých obrázků stránek PDF dokumentu (bilanční tabulka P03 a případně nabídková cena P06).

PRAVIDLA:
1. Hledej POUZE skutečné hodnoty explicitně uvedené v dokumentu (v tabulkách, textu).
2. Pokud hodnota v dokumentu není, použij null – nikdy nevymýšlej ani neodhaduj čísla.
3. Pole "source" u skalárních hodnot musí být konkrétní (např. "strana 3, tabulka bilance ploch").
4. U dynamických podlaží/místností vytvoř tolik položek, kolik jich dokument skutečně uvádí (klidně 0, klidně 10).
5. Jednotky si sám nepřepočítávej – hodnoty vracej tak, jak jsou v dokumentu (m², m³, Kč).
6. Vrať POUZE JSON objekt bez jakéhokoli dalšího textu, komentáře nebo markdown fence.

${buildSchemaDescription()}`;
}

// Bezpečné číslo nebo null (nikdy NaN/Infinity nepustí ven).
const num = (v) => {
  const n = safeNum(v);
  return n === null ? null : n;
};

function normalizeFloors(raw, key) {
  const list = Array.isArray(raw?.[key]?.floors) ? raw[key].floors : [];
  if (list.length === 0) {
    return { floors: DEFAULT_FLOOR_LABELS.map((label) => makeFloor(label, '')) };
  }
  return {
    floors: list.map((f) => makeFloor(String(f?.label || 'Podlaží'), num(f?.value) ?? '')),
  };
}

function normalizeRooms(raw) {
  const list = Array.isArray(raw?.mistnosti?.floors) ? raw.mistnosti.floors : [];
  if (list.length === 0) {
    return { floors: DEFAULT_FLOOR_LABELS.map((label) => ({ id: makeFloor(label).id, label, rooms: [] })) };
  }
  return {
    floors: list.map((f) => ({
      id: makeFloor().id,
      label: String(f?.label || 'Podlaží'),
      rooms: Array.isArray(f?.rooms)
        ? f.rooms.map((r) => makeRoom(String(r?.name || ''), num(r?.area) ?? ''))
        : [],
    })),
  };
}

function normalizeOfferPrice(raw) {
  const byId = new Map((Array.isArray(raw?.nabidkovaCena?.items) ? raw.nabidkovaCena.items : []).map((it) => [it?.id, it]));
  return {
    items: OFFER_PRICE.items.map((schemaItem) => {
      const found = byId.get(schemaItem.id);
      return {
        id: schemaItem.id,
        label: schemaItem.nazev,
        price: num(found?.price) ?? '',
        note: found?.note ? String(found.note) : '',
      };
    }),
  };
}

/** Validuje a normalizuje syrovou odpověď modelu do přesného tvaru navrh.data. */
export function normalizeExtractedBalance(raw) {
  const data = {};

  SCALAR_INPUT_FIELDS.forEach((f) => {
    const entry = raw?.[f.id];
    const value = entry && typeof entry === 'object' ? num(entry.value) : num(entry);
    const source = entry && typeof entry === 'object' && entry.source ? String(entry.source) : 'nenalezeno v dokumentu';
    data[f.id] = { value, source, unit: f.jednotka };
  });

  floorFieldMeta.forEach((c) => {
    data[c.key] = normalizeFloors(raw, c.key);
  });
  data.mistnosti = normalizeRooms(raw);
  data.nabidkovaCena = normalizeOfferPrice(raw);

  return data;
}

export const useBalanceExtractor = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const extractFromImages = useCallback(async (project, model = DEFAULT_AI_MODEL) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const messages = [
        { role: 'system', content: buildSystemPrompt() },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyzuj přiložené stránky dokumentu „${project.name}" a vyplň bilanční tabulku (P03) a nabídkovou cenu (P06, pokud je v dokumentu přítomna) přesně podle zadaného schématu.`,
            },
            ...project.images.map((page) => ({
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${page.imageData}`, detail: 'high' },
            })),
          ],
        },
      ];

      const raw = await callOpenAiChatJson({ model, messages, maxTokens: 6000 });
      const data = normalizeExtractedBalance(raw);

      return { success: true, data, projectName: project.name };
    } catch (err) {
      console.error('Balance extraction error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      return { success: false, error: message, projectName: project.name };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { extractFromImages, isAnalyzing, error };
};
