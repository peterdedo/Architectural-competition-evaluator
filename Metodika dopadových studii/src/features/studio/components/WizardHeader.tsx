"use client";

import Link from "next/link";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cs } from "../studio-copy";
import { useWizardStore } from "../wizard-store";

export const WizardHeader = memo(function WizardHeader() {
  const projectName = useWizardStore((s) => s.state.projectName);
  const resetDemo = useWizardStore((s) => s.resetDemo);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {cs.wizard.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {projectName?.trim()
            ? projectName
            : "Název záměru doplníte v prvním kroku průvodce"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" type="button" asChild>
          <Link href="/report">{cs.wizard.linkReport}</Link>
        </Button>
        <Button variant="outline" type="button" onClick={() => resetDemo()}>
          {cs.wizard.resetDemo}
        </Button>
      </div>
    </div>
  );
});
