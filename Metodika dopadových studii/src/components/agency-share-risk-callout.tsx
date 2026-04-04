import { Badge } from "@/components/ui/badge";
import { agencyShareRiskCs } from "@/content/agency-share-risk-cs";
import { cn } from "@/lib/utils";

type Density = "default" | "compact";

/**
 * Výrazný, nefatální callout — stejná sémantika na obrazovce výsledků, v reportu i při tisku.
 */
export function AgencyShareRiskCallout({
  density = "default",
  isPrint = false,
  className,
}: {
  density?: Density;
  isPrint?: boolean;
  className?: string;
}) {
  const compact = density === "compact";
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-lg border-l-4 border-orange-500 bg-orange-50/95 shadow-sm dark:border-orange-400 dark:bg-orange-950/40",
        isPrint && "print-box-risk border-black bg-white",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            "border-orange-600/60 text-orange-900 dark:border-orange-400/60 dark:text-orange-100",
            isPrint && "border-black text-black",
          )}
        >
          {agencyShareRiskCs.badge}
        </Badge>
        <h4
          className={cn(
            "text-sm font-semibold",
            isPrint ? "text-black" : "text-orange-950 dark:text-orange-50",
          )}
        >
          {agencyShareRiskCs.title}
        </h4>
      </div>
      <ul
        className={cn(
          "mt-2 list-disc space-y-1.5 pl-4",
          compact ? "text-[11px] leading-snug" : "text-sm leading-relaxed",
          isPrint ? "text-black" : "text-foreground/90",
        )}
      >
        <li>
          <span className="font-medium">Co to znamená: </span>
          {agencyShareRiskCs.problem}
        </li>
        <li>
          <span className="font-medium">Proč je to rizikové: </span>
          {agencyShareRiskCs.whyRisky}
        </li>
        <li>
          <span className="font-medium">Jak číst výsledky: </span>
          {agencyShareRiskCs.interpretation}
        </li>
        <li>
          <span className="font-medium">Doporučený postup: </span>
          {agencyShareRiskCs.recommendation}
        </li>
      </ul>
      <p
        className={cn(
          "mt-2 border-t border-orange-200/80 pt-2 text-xs italic dark:border-orange-800/60",
          isPrint ? "text-black" : "text-muted-foreground",
        )}
      >
        Jedná se o interpretační signál z výpočtu podle metodiky, nikoli o chybu aplikace.
      </p>
    </div>
  );
}
