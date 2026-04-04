import type {
  LayerM0Project,
  LayerM1Territory,
  LayerM2AsIsBaseline,
} from "@/domain/methodology/p1-layers";
import {
  createDefaultLayerM0,
  createDefaultLayerM1,
  createDefaultLayerM2,
} from "@/domain/methodology/p1-layers";
import { createDefaultP1PipelineBridgeFlags } from "@/domain/methodology/p1-pipeline-bridge";
import type { P1PipelineBridgeFlags } from "@/domain/methodology/p1-pipeline-bridge";
import type { WizardState } from "./wizard-types";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function mergeLayerM0(partial: Partial<LayerM0Project> | undefined): LayerM0Project {
  const d = createDefaultLayerM0();
  if (!partial) return d;
  return {
    ...d,
    ...partial,
    scopeCapacity: { ...d.scopeCapacity, ...partial.scopeCapacity },
    schedule: { ...d.schedule, ...partial.schedule },
    pmjPortfolio: { ...d.pmjPortfolio, ...partial.pmjPortfolio },
    strategicDocuments: partial.strategicDocuments ?? d.strategicDocuments,
  };
}

function mergeLayerM1(partial: Partial<LayerM1Territory> | undefined): LayerM1Territory {
  const d = createDefaultLayerM1();
  if (!partial) return d;
  return { ...d, ...partial };
}

/** Sloučí výchozí P1 vrstvy a doplní chybějící vnořené klíče po načtení ze storage. */
export function normalizeWizardState(state: WizardState): WizardState {
  const raw = state as WizardState & {
    layerM0?: unknown;
    layerM1?: unknown;
    layerM2?: unknown;
  };
  const layerM0 = mergeLayerM0(
    isRecord(raw.layerM0) ? (raw.layerM0 as Partial<LayerM0Project>) : undefined,
  );
  const layerM1 = mergeLayerM1(
    isRecord(raw.layerM1) ? (raw.layerM1 as Partial<LayerM1Territory>) : undefined,
  );
  const layerM2 = mergeLayerM2(
    isRecord(raw.layerM2) ? (raw.layerM2 as Partial<LayerM2AsIsBaseline>) : undefined,
  );

  const rawBridge = (state as { p1PipelineBridge?: unknown }).p1PipelineBridge;
  const p1PipelineBridge: P1PipelineBridgeFlags = {
    ...createDefaultP1PipelineBridgeFlags(),
    ...(isRecord(rawBridge) ? (rawBridge as Partial<P1PipelineBridgeFlags>) : {}),
  };

  return {
    ...state,
    layerM0,
    layerM1,
    layerM2,
    p1PipelineBridge,
  };
}

function mergeLayerM2(
  partial: Partial<LayerM2AsIsBaseline> | undefined,
): LayerM2AsIsBaseline {
  const d = createDefaultLayerM2();
  if (!partial) return d;
  return {
    demographics: { ...d.demographics, ...partial.demographics },
    ageShares: { ...d.ageShares, ...partial.ageShares },
    migration: { ...d.migration, ...partial.migration },
    laborMarket: { ...d.laborMarket, ...partial.laborMarket },
    economicProfile: { ...d.economicProfile, ...partial.economicProfile },
    housing: { ...d.housing, ...partial.housing },
    civic: { ...d.civic, ...partial.civic },
    publicFinance: { ...d.publicFinance, ...partial.publicFinance },
    trends: { ...d.trends, ...partial.trends },
  };
}
