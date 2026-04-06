/**
 * Jednotná terminologie: ruční vstup vs. efektivní vstup vs. výstup engine.
 * Sdíleno průvodcem, výsledky, reportem (bez druhé pravdy o výpočtu).
 */
export const explainabilityFramingCs = {
  glossaryTitle: "Slovník pro čtení čísel",
  rawInput:
    "Ruční vstup — hodnota v poli průvodce (nebo výchozí předpoklad), jak ji uživatel vidí před přepočtem.",
  effectiveInput:
    "Efektivní vstup — číslo, které engine skutečně dosadil do modulu po mostech P1 (M2, M3→M4, M4→M5, …).",
  derivedOutput:
    "Výstup výpočtu — výsledek vzorce (např. OU, N_celkem), nelze ho přímo „přepsat“ bez změny vstupů nebo předpokladů.",
  bridgeNote:
    "Rozdíl mezi ručním a efektivním vstupem není chyba aplikace — jde o metodické odvození nebo zapnutý most mezi moduly.",
  panelTitle: "Jak aplikace došla k číslům (efektivní vstupy)",
  panelSubtitle:
    "Srovnání polí průvodce s hodnotami použitými v posledním přepočtu. Základní scénář v reportu odpovídá „střední“ variantě.",
  reportSectionTitle: "Ověřitelnost výpočtu — efektivní vstupy (baseline)",
  whyMigration: "Úprava N_kmen podle migračního mostu M2 → M4 (P1).",
  whyM3toM4:
    "Zapnuté propojení M3→M4: N_agentura a N_pendler berou výstupy DRV-014/015 z modulu zaměstnanosti.",
  whyVacant:
    "Most M2 → volné jednotky: efektivní nabídka je max. z AS-IS a pole průvodce.",
  whyOuM4:
    "Zapnutý most M4→M5: do občanské vybavenosti jde OU z modulu bydlení, ne číslo v poli výše.",
  whyNCelkemM3:
    "Zapnutý most M3→M5: pro bezpečnostní FTE se použije N_celkem z M3.",
  deltaHdpComputed:
    "Δ roční HDP je odvozeno z profilu investice a M3 (automatický výpočet M6).",
  deltaHdpManualMvp: "Δ roční HDP je převzato z manuálního pole v průvodci.",
  deltaHdpManualFallback: "Δ roční HDP — záložní manuální hodnota (M6).",
} as const;
