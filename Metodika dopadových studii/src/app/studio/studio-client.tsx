"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { StudioWizard } from "@/features/studio/studio-wizard";
import { useWizardStore } from "@/features/studio/wizard-store";

/**
 * Otevření /studio?step=0…9 — skok na krok průvodce (např. z reportu).
 * Hodnota musí být celé číslo 0–9; jinak se krok nemění.
 */
function StudioStepFromQuery() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const raw = searchParams.get("step");
    if (raw === null || raw === "") return;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0 || n > 9) return;
    useWizardStore.getState().setStep(n);
  }, [searchParams]);
  return null;
}

/** Klientská hranica — žiadne next/dynamic, aby serverový bundle stránky nemal lazy chunky (stabilita dev na Windows). */
export function StudioClient() {
  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <StudioStepFromQuery />
      </Suspense>
      <section
        className="mx-auto max-w-6xl rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-4 sm:px-5"
        aria-label="Úvod do průvodce"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h2 className="text-sm font-semibold text-foreground">
              Co uděláte v tomto kroku
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Vyplníte údaje o záměru odshora. Po části o ekonomice kliknete na{" "}
              <span className="font-medium text-foreground">Další</span> — spustí
              se přehled dopadů a srovnání scénářů. Report otevřete kdykoli z
              horní lišty.
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Zpět na úvod
          </Link>
        </div>
      </section>
      <StudioWizard />
    </div>
  );
}
