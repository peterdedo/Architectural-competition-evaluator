import type { FullCalculationPipelineResult } from "@/lib/mhdsi/calculations/run-pipeline";
import type {
  LayerM0Project,
  LayerM1Territory,
  LayerM2AsIsBaseline,
} from "@/domain/methodology/p1-layers";
import type { P1PipelineBridgeFlags } from "@/domain/methodology/p1-pipeline-bridge";

/** Shodné s engine / doménovým scénářem */
export type ScenarioKind = "optimistic" | "baseline" | "pessimistic";

export const SCENARIO_ORDER: ScenarioKind[] = [
  "optimistic",
  "baseline",
  "pessimistic",
];

export interface WizardState {
  /** P1 — M0 strukturovaný popis (nad rámec kořenových polí). */
  layerM0: LayerM0Project;
  /** P1 — M1 území */
  layerM1: LayerM1Territory;
  /** P1 — M2 AS-IS baseline (odděleně od TO-BE výpočtů) */
  layerM2: LayerM2AsIsBaseline;
  /** P1 → M3/M4 most (co se má odvodit z M0/M1/M2 do pipeline). */
  p1PipelineBridge: P1PipelineBridgeFlags;

  projectName: string;
  locationDescription: string;
  czNace: string;
  capexTotalCzk: number;
  nInv: number;
  investorProfile: string;
  legalForm: string;
  strategicLinks: string;
  dLastMileKm: number;
  diadPrMinutes: number;
  diadAkMinutes: number;
  tinfrMinutes: number;
  t0: string;
  rampYearsGlobal: number;
  /** Společné symboly PDF pro všechny moduly (sloučí se s deltou scénáře). */
  sharedAssumptions: Record<string, number>;
  /** Rozdíly oproti shared jen pro daný scénář (např. util_RZPS, theta). */
  scenarioAssumptionDelta: Record<ScenarioKind, Record<string, number>>;
  kInv: number;
  aUp: number;
  bUp: number;
  cUp: number;
  mNew: number;
  mRegion: number;
  npVm: number;
  npTotal: number;
  zI: number;
  mI: number;
  nSub: number;
  employmentRampYears: number;
  situation: "A" | "B";
  nKmen: number;
  nAgentura: number;
  nPendler: number;
  nRelokace: number;
  shareByt: number;
  shareRodinny: number;
  occByt: number;
  occRodinny: number;
  lMarketByt: number;
  lMarketRodinny: number;
  vTVacant: number;
  housingRampYears: number;
  ou: number;
  capRegMs: number;
  capRegZs: number;
  enrolledMs: number;
  enrolledZs: number;
  pxSpecialistsAggregate: number;
  kstandardLeisure: number;
  nCelkemM3: number;
  nAgentCizinci: number;
  fteSecurityPer1000: number;
  acuteBedsCapacity: number;
  leisureCapacityUnits: number;
  civicRampYears: number;
  mvpManualDeltaHdpCzk: number;
  sStavbyM2: number;
  sPlochyM2: number;
  sStavbyKcPerM2: number;
  sPlochyKcPerM2: number;
  kMistni: number;
  kZakladni: number;
  nNovaForPrud: number;
}

export interface StudioStore {
  currentStep: number;
  state: WizardState;
  /** Výsledky pipeline po scénářích (client-side, bez DB). */
  results: Record<ScenarioKind, FullCalculationPipelineResult | null>;
  setStep: (n: number) => void;
  patchState: (partial: Partial<WizardState>) => void;
  setScenarioDelta: (
    kind: ScenarioKind,
    delta: Record<string, number>,
  ) => void;
  setResults: (
    r: Record<ScenarioKind, FullCalculationPipelineResult | null>,
  ) => void;
  resetDemo: () => void;
}
