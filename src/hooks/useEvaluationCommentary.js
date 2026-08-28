import { useCallback, useState } from 'react';
import {
  computeDerivedField,
  floorsTotal,
  roomsGrandTotal,
  offerPriceTotal,
  safeNum,
  asPercent,
} from '../utils/balanceCalculations.js';
import { callOpenAiChatJson } from '../utils/aiChat.js';

// AI evaluační komentář: odborné ČTENÍ bilančních dat očima zkušeného architekta kulturních
// staveb — co čísla naznačují o prostorovém a provozním charakteru návrhů, jaká napětí a
// kompromisy z nich plynou a na co se má porota při posuzování výkresů a modelů zaměřit.
//
// HRANICE, KTERÁ SE NESMÍ PŘEKROČIT: appka ani model NEROZHODUJE o kvalitě architektonického
// / urbanistického návrhu ani o pořadí — to je dle soutěžních podmínek výhradně v kompetenci
// poroty. Model proto formuluje HYPOTÉZY a OTÁZKY k ověření, ne verdikty, a nikdy si nedomýšlí
// čísla, která nedostal.

/** Kompaktní, ale bohatý číselný profil jednoho návrhu pro model (jen reálně vyplněné hodnoty). */
function summarizeProposal(p, scored) {
  const d = p.data || {};

  const zastavena = safeNum(d.bilance_zastavena);
  const zpevnena = safeNum(d.bilance_zpevnena);
  const nezpevnena = safeNum(d.bilance_nezpevnena);
  const bilance = computeDerivedField('bilance_celkem', d);
  const zastavenaPodil = bilance && zastavena !== null ? asPercent(zastavena / bilance) : null;
  const zelenPodil = bilance && nezpevnena !== null ? asPercent(nezpevnena / bilance) : null;

  const demolice = computeDerivedField('demolice_celkem', d);
  const obestavenyPod = safeNum(d.obestaveny_podzemni);
  const obestavenyNad = safeNum(d.obestaveny_nadzemni);
  const obestaveny = computeDerivedField('obestaveny_celkem', d);
  const obalka = computeDerivedField('obalka_celkem', d);
  const prosklaniPodil = asPercent(computeDerivedField('proskleni_podil', d));

  const hpp = floorsTotal(d.hpp);
  const uzitna = floorsTotal(d.uzitna);
  const mistnosti = roomsGrandTotal(d.mistnosti);
  const hppUzitna = hpp && uzitna ? asPercent(uzitna / hpp) : null;

  const cena = offerPriceTotal(d.nabidkovaCena);
  const cenaZaM2Hpp = cena !== null && hpp ? Math.round(cena / hpp) : null;
  const cenaZaM2Uzitna = cena !== null && uzitna ? Math.round(cena / uzitna) : null;

  // Podlažní profil (HPP po patrech) – naznačuje hmotu a rozvržení; jen vyplněná patra.
  const floorProfile = Array.isArray(d.hpp?.floors)
    ? d.hpp.floors
        .map((f) => ({ label: f.label, value: safeNum(f.value) }))
        .filter((f) => f.value !== null)
    : [];

  const lines = [`NÁVRH „${p.nazev}"`];
  lines.push('· Bilance ploch pozemku:');
  lines.push(`  – zastavěná ${zastavena ?? '—'} m², zpevněná ${zpevnena ?? '—'} m², nezpevněná ${nezpevnena ?? '—'} m², celkem ${bilance ?? '—'} m²`);
  if (zastavenaPodil !== null || zelenPodil !== null) {
    lines.push(`  – podíl zastavění ${zastavenaPodil ?? '—'} %, podíl nezpevněných (zeleň/vsak) ${zelenPodil ?? '—'} %`);
  }
  if (demolice !== null) lines.push(`· Demolice stávající stavby: ${demolice} m³`);
  if (obestaveny !== null) {
    lines.push(`· Obestavěný prostor: podzemní ${obestavenyPod ?? '—'} m³, nadzemní ${obestavenyNad ?? '—'} m³, celkem ${obestaveny} m³`);
  }
  if (obalka !== null || prosklaniPodil !== null) {
    lines.push(`· Obálka budovy celkem ${obalka ?? '—'} m², podíl prosklení ${prosklaniPodil ?? '—'} %`);
  }
  lines.push(`· Plochy: HPP celkem ${hpp ?? '—'} m², užitná celkem ${uzitna ?? '—'} m²${hppUzitna !== null ? ` (užitná/HPP ${hppUzitna} %)` : ''}, bilance místností ${mistnosti ?? '—'} m²`);
  if (floorProfile.length > 0) {
    lines.push(`· Podlažní profil HPP: ${floorProfile.map((f) => `${f.label} ${f.value} m²`).join(', ')}`);
  }
  lines.push(`· Nabídková cena: ${cena ?? '—'} Kč${cenaZaM2Hpp ? ` (≈ ${cenaZaM2Hpp} Kč/m² HPP` : ''}${cenaZaM2Uzitna ? `, ≈ ${cenaZaM2Uzitna} Kč/m² užitná)` : cenaZaM2Hpp ? ')' : ''}`);

  if (scored && scored.indicatorScores.length > 0) {
    lines.push(`· Vážené skóre dle porotou zvolených ukazatelů: ${scored.weightedScore?.toFixed(1) ?? '—'} b. (${scored.indicatorScores.length} ukazatelů)`);
    scored.indicatorScores.forEach((s) => {
      lines.push(`    – ${s.nazev}: ${s.value} ${s.jednotka} (normalizováno ${s.normalized.toFixed(0)} %, směr ${s.direction === 'lower' ? 'nižší lepší' : 'vyšší lepší'}, váha ${s.weight})`);
    });
  }
  return lines.join('\n');
}

function buildPrompt(scoredProposals) {
  const summaries = scoredProposals.map((p) => summarizeProposal(p, p)).join('\n\n');
  const nazvy = scoredProposals.map((p) => p.nazev);

  const system = `Jsi mezinárodně uznávaný architekt a porotce se specializací na KULTURNÍ A OBČANSKÉ STAVBY — kulturní domy, víceúčelové a koncertní sály, základní umělecké školy (ZUŠ), knihovny a komunitní centra. Máš za sebou realizace i porotování desítek soutěží na tento typ budov. Posuzuješ podklady k soutěži na kulturní dům a ZUŠ (lokalita Ostrůvek, Brandýs nad Labem — nábřežní, městotvorný kontext).

TVOJE ROLE: nabídnout porotě HLUBOKÉ ODBORNÉ ČTENÍ bilančních dat — co čísla naznačují o prostorovém, provozním a městotvorném charakteru každého návrhu — a zaostřit její pozornost na to podstatné. NEJSI náhrada poroty a NEURČUJEŠ pořadí ani kvalitu architektury.

ODBORNÉ OPTIKY, kterými čti čísla (a spojuj je do souvislostí, ne odděleně):
- Duální program: kulturní dům (společenský provoz, foyer, velký sál, flexibilita) vs. ZUŠ (učebny, akustické oddělení hudebních oborů, denní světlo pro výtvarné obory). Poměr užitné/HPP a bilance místností naznačují velkorysost obslužných a společných prostor vs. čistý objem učeben.
- Městotvornost a partie k řece: podíl zastavění vs. nezpevněných ploch — kolik z pozemku zůstává jako veřejný prostor, předprostor, zeleň a vsak; jak stavba drží nábřeží.
- Hmota a silueta: obestavěný prostor (podzemní vs. nadzemní) a podlažní profil HPP — kompaktní blok vs. rozčleněná hmota; kolik provozu jde do podzemí (technika, sály, parking) a co to znamená pro náklady a světlo.
- Obálka a energetika: poměr obálka/HPP a podíl prosklení — velkorysost a prosvětlení vs. tepelná a akustická zátěž u kulturní stavby s dlouhou životností a veřejným provozem.
- Ekonomika životního cyklu: Kč/m² HPP i Kč/m² užitná jako signál efektivity investice obce; demolice jako signál míry zásahu do místa a udržitelnosti (co se bourá vs. co se zachovává).

JAK PSÁT:
1. Vycházej VÝHRADNĚ z předaných čísel. Chybí-li údaj, výslovně to řekni ("bez údaje o X nelze posoudit Y") a nedomýšlej.
2. Reasonuj od čísla k architektonickému důsledku, pojmenovávej NAPĚTÍ a KOMPROMISY (např. "vysoký podíl zastavění při štědré HPP naznačuje kompaktní, ale k nábřeží možná uzavřenou hmotu — ověřit na situaci a řezech").
3. Vše formuluj jako HYPOTÉZU K OVĚŘENÍ na výkresech, řezech a modelu, ne jako hotový soud. Kde je to možné, řekni, čím konkrétně by porota hypotézu potvrdila nebo vyvrátila.
4. Buď konkrétní a srovnávej návrhy mezi sebou jménem (${nazvy.join(', ')}), ne obecně. Žádné klišé, žádná vata.
5. Piš kultivovanou, přesnou odbornou češtinou — hlas zkušeného porotce-architekta.
6. NEHODNOŤ výslednou kvalitu ani pořadí; to je výhradně na porotě. Skóre ber jen jako porotou zvolený početní pomocník, ne jako pravdu.

Vrať POUZE JSON přesně v tomto tvaru (bez markdownu okolo):
{
  "synteza": "2–4 věty: jak se pole návrhů čte jako celek — jaké odlišné strategie k tématu kulturní dům + ZUŠ na tomto místě reprezentují.",
  "navrhy": [
    {
      "nazev": "název návrhu",
      "charakter": "3–5 vět odborného čtení: jaký prostorový/provozní/městotvorný charakter čísla naznačují.",
      "prilezitosti": "1–3 věty: co je na základě dat slibné a stojí za ověření.",
      "otazky": "1–3 věty: konkrétní napětí/rizika, na která se má porota u tohoto návrhu zaměřit na výkresech a modelu."
    }
  ],
  "napeti": ["2–4 klíčové kompromisy/napětí napříč polem návrhů, každý jako jedna konkrétní věta srovnávající návrhy jménem."],
  "ekonomika": "2–4 věty: čtení nabídkových cen a Kč/m² v kontextu životního cyklu obecní kulturní stavby; pokud data chybí, řekni to.",
  "otazkyProPorotu": ["3–5 ostrých, konkrétních otázek, které by měla porota položit nad výkresy/modely — navazují na čísla, ale míří k architektuře a provozu."],
  "zaver": "jedna věta: tohle je odborný podklad ke čtení dat, konečné posouzení kvality i pořadí je výhradně na porotě."
}`;

  const user = `Bilanční a ekonomická data porovnávaných návrhů:\n\n${summaries}\n\nZpracuj odborné čtení dle instrukcí.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/** Normalizuje odpověď modelu do stabilního tvaru, ať UI nemusí řešit chybějící klíče. */
function normalizeCommentary(raw) {
  const asText = (v) => (typeof v === 'string' ? v.trim() : '');
  const asList = (v) => (Array.isArray(v) ? v.map(asText).filter(Boolean) : []);
  const navrhy = Array.isArray(raw?.navrhy)
    ? raw.navrhy
        .map((n) => ({
          nazev: asText(n?.nazev),
          charakter: asText(n?.charakter),
          prilezitosti: asText(n?.prilezitosti),
          otazky: asText(n?.otazky),
        }))
        .filter((n) => n.nazev || n.charakter)
    : [];

  const result = {
    synteza: asText(raw?.synteza),
    navrhy,
    napeti: asList(raw?.napeti),
    ekonomika: asText(raw?.ekonomika),
    otazkyProPorotu: asList(raw?.otazkyProPorotu),
    zaver: asText(raw?.zaver),
  };

  const hasContent =
    result.synteza || result.navrhy.length > 0 || result.napeti.length > 0 ||
    result.ekonomika || result.otazkyProPorotu.length > 0;
  if (!hasContent) throw new Error('Model nevrátil použitelný obsah komentáře.');
  return result;
}

export const useEvaluationCommentary = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async (scoredProposals) => {
    setIsLoading(true);
    setError(null);
    try {
      const messages = buildPrompt(scoredProposals);
      // Bohatší strukturovaný výstup → víc tokenů; reasoning model temperature stejně ignoruje.
      const raw = await callOpenAiChatJson({ messages, maxTokens: 4000 });
      const komentar = normalizeCommentary(raw);
      return { success: true, komentar };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Evaluation commentary error:', err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generate, isLoading, error };
};
