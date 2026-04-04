import Link from "next/link";
import { Button } from "@/components/ui/button";
import { reportCs } from "../report-copy-cs";

type Variant = "screen" | "print";

export function ReportEmptyState({ variant }: { variant: Variant }) {
  return (
    <main className="mx-auto max-w-lg space-y-6 p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {reportCs.noDataTitle}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {reportCs.noDataLead}
        </p>
      </div>
      <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground">
        <p className="font-medium text-foreground">{reportCs.noDataWhatToDo}</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted-foreground">
          <li>{reportCs.noDataStep1}</li>
          <li>{reportCs.noDataStep2}</li>
          <li>{reportCs.noDataStep3}</li>
        </ol>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/studio">{reportCs.linkStudio}</Link>
        </Button>
        {variant === "screen" ? (
          <Button variant="outline" asChild>
            <Link href="/">{reportCs.linkHome}</Link>
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link href="/report">{reportCs.print.backToScreenReport}</Link>
          </Button>
        )}
      </div>
    </main>
  );
}
