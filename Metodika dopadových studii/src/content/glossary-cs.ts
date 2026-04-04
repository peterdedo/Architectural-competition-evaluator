/**
 * Stručné vysvětlení zkratek a metodických pojmů (cs).
 * Pro report / průvodce — max. 2–3 věty, neutrální tón.
 */
export const glossaryCs = {
  PMJ: "PMJ (plánovaná pracovní místa u investora) — počet míst v plném provozu, který vstupuje do modulu zaměstnanosti (M3). Liší se např. od FTE nebo směnnosti; ty doplňte v popisu záměru.",
  RZPS: "RZPS — regionální zdroj pracovní síly: v modelu jde o odhad toho, kolik práce lze reálně pokrýt z území. Koeficient „využitelnost RZPS“ (util_RZPS) mění, jak silně se tento zdroj uplatní ve výpočtu.",
  RUD: "RUD — rozpočtové určení daní: mechanismus přerozdělení podílu některých daní mezi obce. V aplikaci jde o orientační odhad příspěvku obci v Kč/rok podle modelových vstupů, ne o právní jistotu výpočtu.",
  gamma: "Koeficient γ v metodice váže dostupnost pracovní síly v rámci RZPS (doplňkový člen ve vzorci).",
  util_RZPS: "Využitelnost regionální pracovní síly — číslo mezi 0 a 1, které v modelu škáluje, nakolik se uplatní lokální/RZPS zdroj při odhadu obsazitelnosti pracovních míst.",
  Rp_RUD: "Základní koeficient přepočtu pro vstupy RUD v ekonomickém modulu (M6) — technický parametr metodiky.",
  v_RUD_per_cap: "Výše RUD připadající na jednoho obyvatele v modelu — vstup pro orientační výpočet příspěvku obci.",
  alpha_obec: "Koeficient α_obec v části RUD — váha vlivu obce v modelu příspěvku z rozpočtového určení daní (orientační parametr).",
  agencyShareRisk:
    "Rizikový signál agenturních pracovníků — pokud podíl práce přes agentury vůči potřebě PMJ (N_celkem) překročí metodickou hranici (> 5 %), metodika MHDSI to označuje jako zvýšené riziko stability náboru a integrace; v aplikaci jde o interpretační signál ze stejného výpočtu M3, ne o chybu programu.",
} as const;

export type GlossaryKey = keyof typeof glossaryCs;

/** Anglické znění — stejné klíče jako glossaryCs. */
export const glossaryEn: Record<GlossaryKey, string> = {
  PMJ: "Planned jobs at the investor (PMJ) — headcount in full operation feeding the employment module (M3). Differs from FTE or shift patterns; describe those in the project narrative.",
  RZPS: "Regional labour supply (RZPS): how much work the model assumes can be covered locally. The util_RZPS factor scales how strongly this source applies.",
  RUD: "Budgetary determination of taxes (RUD): how some tax shares are redistributed to municipalities. The app shows an indicative annual amount in CZK, not legal certainty.",
  gamma: "Coefficient γ links labour availability within the RZPS framework (additive term in the methodology).",
  util_RZPS: "Regional labour utilisation — a 0–1 scalar scaling how much local/RZPS supply counts toward filling jobs in the model.",
  Rp_RUD: "Base conversion coefficient for RUD inputs in the economic module (M6).",
  v_RUD_per_cap: "Modelled RUD amount per inhabitant — input for indicative municipal contribution.",
  alpha_obec: "Municipal α coefficient in the RUD slice — weighting in the indicative municipal contribution model.",
  agencyShareRisk:
    "Agency-worker risk signal — if agency-filled work as a share of total PMJ need (N_celkem) exceeds the methodology threshold (> 5 %), MHDSI flags higher recruitment/integration risk; in the app this is an interpretive signal from the same M3 calculation, not a software error.",
};
