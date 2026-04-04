/**
 * Jednotné texty pro rizikový signál „vysoký podíl agenturních pracovníků“ (MHDSI).
 * Sdílené: výsledky průvodce, report, tisk, karty varování.
 */
export const agencyShareRiskCs = {
  badge: "Rizikový signál",
  /** Hlavní nadpis — karty varování, callout */
  title: "Vysoký podíl agenturních pracovníků",
  /** Co je problém (1 věta) */
  problem:
    "Velká část potřebných pracovních míst by podle modelu měla jít přes agentury, ne přímo přes stabilní pracovní poměry v místě.",
  /** Proč je to rizikové */
  whyRisky:
    "Metodika MHDSI považuje takový stav za zvýšené riziko pro stabilitu náboru, začleňování pracovníků a udržitelnost personálního zajištění záměru.",
  /** Co to znamená pro interpretaci */
  interpretation:
    "Výsledky studie můžete dál používat jako orientační podklad, ale závěry o dopadech v území berete s větší opatrností — zejména u bydlení, občanské vybavenosti a dlouhodobých sociálních efektů.",
  /** Doporučený další krok */
  recommendation:
    "Zkontrolujte scénář zaměstnanosti (podíl dojíždějících, využitelnost RZPS, substituce) a náborový plán investora; případně připravte zmírňující opatření a přepočet.",
} as const;
