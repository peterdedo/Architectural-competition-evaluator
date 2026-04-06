"use client";

import type { ReactNode } from "react";

/** Tematický podblok ve wizardu — bez změny logiky polí, jen vizuální hierarchie. */
export function WizardFieldGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border/30 bg-muted/[0.02] p-4">
      <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/75">
        {title}
      </h4>
      {children}
    </div>
  );
}
