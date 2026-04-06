/** Formátování čísel pro report (jednotné s dřívějším `fmt` v rendereru). */
export function formatReportNumber(n: number, maxFrac = 1): string {
  return new Intl.NumberFormat("cs-CZ", {
    maximumFractionDigits: maxFrac,
  }).format(n);
}
