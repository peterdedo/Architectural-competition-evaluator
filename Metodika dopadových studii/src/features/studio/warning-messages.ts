/**
 * Mapování stabilních kódů z engine → české texty pro UI.
 * @see EngineWarning.code
 */
const WARNING_MESSAGES_CS: Record<string, string> = {
  MISSING_INPUT: "Chybí nebo je neplatná hodnota pole.",
  ASSUMPTION_FALLBACK:
    "Použit výchozí numerický předpoklad (viz technická dokumentace).",
  AGENCY_SHARE_RISK:
    "Podíl práce přes agentury překračuje v modelu metodickou hranici rizika (> 5 % z potřeby PMJ). Jde o signál pro interpretaci, ne o chybu výpočtu.",
  SUBSTITUTION_BASE:
    "Substituce — kontext mzdy v regionu (dělení nulou ošetřeno v jádře).",
  SUBSTITUTION_COMPETITION:
    "Substituce — kontext trhu práce (dělení nulou ošetřeno v jádře).",
};

export function warningMessageCs(code: string, fallbackMessage: string): string {
  return WARNING_MESSAGES_CS[code] ?? fallbackMessage;
}
