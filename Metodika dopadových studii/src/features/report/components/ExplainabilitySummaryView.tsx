import { cn } from "@/lib/utils";
import { explainabilityFramingCs } from "@/content/explainability-framing-cs";
import type { ReportExplainabilitySummary } from "../types";

export function ExplainabilitySummaryView({
  sections,
  isPrint,
  titleOverride,
  variant = "standalone",
}: {
  sections: ReportExplainabilitySummary;
  isPrint: boolean;
  /** Např. u výsledků včetně názvu scénáře */
  titleOverride?: string;
  /** `embedded` — bez vnějšího nadpisu (např. uvnitř rozbalovače ve výsledcích). */
  variant?: "standalone" | "embedded";
}) {
  if (!sections.length) return null;

  const showOuterTitle = variant === "standalone";

  return (
    <section
      className={cn(
        "space-y-4",
        isPrint && "print:break-inside-avoid rounded-md border border-black p-3 text-[9pt] text-black",
        !isPrint &&
          showOuterTitle &&
          "rounded-lg border border-border/60 bg-muted/15 px-4 py-4",
        !isPrint && !showOuterTitle && "rounded-md border border-border/40 bg-background/80 px-3 py-3",
      )}
    >
      {showOuterTitle ? (
        <h2
          className={cn(
            "font-semibold",
            isPrint ? "text-[10pt]" : "text-lg text-foreground",
          )}
        >
          {titleOverride ?? explainabilityFramingCs.reportSectionTitle}
        </h2>
      ) : null}
      {showOuterTitle && !isPrint ? (
        <p className="text-xs leading-snug text-muted-foreground">
          {explainabilityFramingCs.panelSubtitle}
        </p>
      ) : null}

      <div className="space-y-4">
        {sections.map((sec) => (
          <div key={sec.id} className="space-y-2">
            <h3
              className={cn(
                "font-medium",
                isPrint ? "text-[9pt]" : "text-sm text-foreground",
              )}
            >
              {sec.titleCs}
            </h3>
            {sec.introCs ? (
              <p
                className={cn(
                  "leading-snug",
                  isPrint ? "text-[8pt]" : "text-xs text-muted-foreground",
                )}
              >
                {sec.introCs}
              </p>
            ) : null}
            {sec.bulletsCs?.length ? (
              <ul
                className={cn(
                  "list-disc space-y-1 pl-4",
                  isPrint ? "text-[8pt]" : "text-xs text-muted-foreground",
                )}
              >
                {sec.bulletsCs.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : null}
            {sec.rows?.length ? (
              <div className="overflow-x-auto">
                <table
                  className={cn(
                    "w-full border-collapse text-left",
                    isPrint ? "text-[8pt]" : "text-xs",
                  )}
                >
                  <thead>
                    <tr>
                      <th
                        className={cn(
                          "border-b p-1.5 font-medium",
                          isPrint
                            ? "border-black"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        Veličina
                      </th>
                      <th
                        className={cn(
                          "border-b p-1.5 font-medium",
                          isPrint
                            ? "border-black"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        Průvodce
                      </th>
                      <th
                        className={cn(
                          "border-b p-1.5 font-medium",
                          isPrint
                            ? "border-black"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        Engine
                      </th>
                      <th
                        className={cn(
                          "border-b p-1.5 font-medium",
                          isPrint
                            ? "border-black"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        Proč
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.rows.map((row, ri) => (
                      <tr key={ri}>
                        <td
                          className={cn(
                            "p-1.5 align-top",
                            isPrint ? "border border-black" : "border-border/60",
                          )}
                        >
                          {row.metric}
                        </td>
                        <td
                          className={cn(
                            "p-1.5 align-top tabular-nums",
                            isPrint ? "border border-black" : "border-border/60",
                          )}
                        >
                          {row.wizardValueCs ?? "—"}
                        </td>
                        <td
                          className={cn(
                            "p-1.5 align-top tabular-nums font-medium",
                            isPrint ? "border border-black" : "border-border/60",
                          )}
                        >
                          {row.engineValueCs}
                        </td>
                        <td
                          className={cn(
                            "p-1.5 align-top",
                            isPrint ? "border border-black" : "border-border/60",
                          )}
                        >
                          {row.whyCs ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
