"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FullCalculationPipelineResult } from "@/lib/mhdsi/calculations/run-pipeline";
import { createDemoWizardState } from "./demo-seed";
import type { ScenarioKind, StudioStore, WizardState } from "./wizard-types";
import { normalizeWizardState } from "./wizard-state-migration";

function emptyResults(): Record<
  ScenarioKind,
  FullCalculationPipelineResult | null
> {
  return {
    optimistic: null,
    baseline: null,
    pessimistic: null,
  };
}

/** Musí odpovídat `name` v persist níže — pro čtení v UI (obnovení vstupů). */
export const STUDIO_WIZARD_STORAGE_KEY = "mhdsi-studio-wizard-v1" as const;

/** Verze persisted snapshotu (partialize). Při změně struktury přidej migrate a zvedni číslo. */
export const WIZARD_PERSIST_VERSION = 3 as const;

type PersistedWizardSlice = { state: WizardState };

/** Z legacy partialu (v0 mohl obsahovat i `currentStep`) vždy vrátí jen `{ state }` pro merge / migrate. */
function persistedPartialWithoutStep(
  persistedState: unknown,
): PersistedWizardSlice {
  const p = persistedState as Partial<{
    state: WizardState;
    currentStep?: number;
  }>;
  if (p.state && typeof p.state === "object") {
    return { state: normalizeWizardState(p.state as WizardState) };
  }
  return { state: createDemoWizardState() };
}

/**
 * Vrací true, pokud v localStorage existuje uložený stav průvodce (vstupy).
 * Použití: po rehydrataci zobrazit nenápadnou zprávu, že se začíná od kroku 1.
 */
export function hasPersistedWizardStateInBrowserStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STUDIO_WIZARD_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as {
      state?: { state?: unknown } | null;
    };
    const partial = parsed?.state;
    return (
      partial !== null &&
      typeof partial === "object" &&
      "state" in partial &&
      typeof (partial as { state: unknown }).state === "object" &&
      (partial as { state: object | null }).state !== null
    );
  } catch {
    return false;
  }
}

export const useWizardStore = create<StudioStore>()(
  persist(
    (set) => ({
      currentStep: 0,
      state: createDemoWizardState(),
      results: emptyResults(),
      resultsMayBeStale: false,
      setStep: (n) => set({ currentStep: Math.max(0, Math.min(9, n)) }),
      patchState: (partial) =>
        set((s) => ({
          state: { ...s.state, ...partial },
          resultsMayBeStale: s.results.baseline != null,
        })),
      setScenarioDelta: (kind, delta) =>
        set((s) => ({
          state: {
            ...s.state,
            scenarioAssumptionDelta: {
              ...s.state.scenarioAssumptionDelta,
              [kind]: delta,
            },
          },
          resultsMayBeStale: s.results.baseline != null,
        })),
      setResults: (r) => set({ results: r, resultsMayBeStale: false }),
      resetDemo: () =>
        set({
          state: createDemoWizardState(),
          results: emptyResults(),
          currentStep: 0,
          resultsMayBeStale: false,
        }),
    }),
    {
      name: STUDIO_WIZARD_STORAGE_KEY,
      version: WIZARD_PERSIST_VERSION,
      /**
       * Migrace z v0 → v1: starý partialize ukládal i `currentStep`. Při merge se ten klíč
       * propsal na kořen store a mohl přepsat krok (race s „Další“) nebo obnovit špatný krok po F5.
       * migrate běží při `storedVersion !== WIZARD_PERSIST_VERSION` (typicky 0 → 1).
       *
       * Záznamy bez pole `version` v JSON merge neprojdou migrate (viz zustand persist) —
       * proto vlastní `merge` bere z partialu jen `state`, nikdy neaplikuje `currentStep`.
       */
      migrate: (persistedState, fromVersion) => {
        void fromVersion;
        return persistedPartialWithoutStep(persistedState);
      },
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return currentState;
        }
        const { state } = persistedPartialWithoutStep(persistedState);
        return { ...currentState, state };
      },
      /**
       * Proč se `currentStep` záměrně nepersistuje
       * -------------------------------------------
       * Zustand persist po načtení z úložiště volá merge jako
       * `{ ...currentState, ...persistedState }` (viz zustand/middleware persist).
       * Rehydratace z localStorage je asynchronní. Uložený `currentStep` v persisted
       * tak mohl po dokončení rehydratace přepsat aktuální krok v paměti — např. uživatel
       * stihl „Další“ (krok 1), ale starší hodnota z úložiště vrátila krok zpět na 0;
       * průvodce pak vypadal jako nefunkční navigace.
       *
       * Persistujeme jen `state` (vstupy). Po F5 je `currentStep` vždy 0, ale pole
       * zůstanou z merge; UX copy k tomu je ve StudioWizard. Verze + migrate + merge výše
       * čistí legacy zápisy s `currentStep` v partialu.
       */
      partialize: (s) => ({ state: s.state }),
    },
  ),
);
