import { createRecommendedP1PipelineBridgeFlags } from "@/domain/methodology/p1-pipeline-bridge";
import {
  createDefaultLayerM0,
  createDefaultLayerM1,
  createDefaultLayerM2,
} from "@/domain/methodology/p1-layers";
import type { LayerM2AsIsBaseline } from "@/domain/methodology/p1-layers";
import type { WizardState } from "./wizard-types";

function nbDemo(value: number) {
  return { value, kind: "reference_baseline" as const, note: "" };
}

/**
 * Realistická demo data — sklad logistický záměr, ČR (čísla ilustrativní).
 * Projde pipeline při vývoji UI.
 */
export function createDemoWizardState(): WizardState {
  const layerM0 = {
    ...createDefaultLayerM0(),
    projectCode: "DEMO-KOL-LOG-01",
    investorDisplayName: "Logistická skupina (demo)",
    secondaryNace: "52.24; 53.20",
    capacityNarrative:
      "Skladové haly, manipulační plochy a zázemí pro řidiče; plný provoz po stabilizaci náboru.",
    scopeCapacity: {
      floorAreaM2: 38_000,
      siteAreaM2: 120_000,
      throughputNote: "Přepravní kapacity orientačně v tisících paletových míst ročně (ilustrace).",
    },
    schedule: {
      constructionStart: "2026-Q2",
      fullOperationPlanned: "2028",
    },
    pmjPortfolio: {
      shiftsDescription: "Směnnost 2–3 směny; administrativa jednosměnně.",
      fteEquivalent: 0.92,
      peakLoadNote: "Špička v sezóně (Q4) — přesčasy řešeny agenturou.",
    },
    strategicDocuments: [
      {
        title: "Zásady územního rozvoje kraje (orientačně)",
        relevance: "Soulad s polohou logistické zóny.",
      },
    ],
  };

  const layerM1 = {
    ...createDefaultLayerM1(),
    definitionPointLabel: "Střed areálu u napojení na silnici II/ třídy",
    cadastralArea: "Kolín",
    municipality: "Kolín",
    region: "Středočeský kraj",
    boundaryNote: "Záměr v rámci stávající průmyslové zóny; přesné hranice dle PD.",
    aoiUnitsLabel: "ORP Kolín, ZÚ Kolín (ilustrativní)",
    isochronesMode: "manual_same_as_diad" as const,
    isochronesManualNote:
      "Isochrony zatím nepočítány — pro vstup do modelu používáme DIAD níže (stejné čísla jako dostupnost).",
  };

  const layerM2: LayerM2AsIsBaseline = {
    ...createDefaultLayerM2(),
    demographics: {
      population: { value: 63_000, kind: "reference_baseline", note: "ORP přibližně (demo)" },
      year: 2024,
    },
    ageShares: {
      age014: { value: 0.16, kind: "reference_baseline", note: "" },
      age1564: { value: 0.62, kind: "reference_baseline", note: "" },
      age65Plus: { value: 0.22, kind: "reference_baseline", note: "" },
    },
    migration: {
      netPerYear: { value: 120, kind: "raw_input", note: "Saldo migrace — ruční odhad." },
    },
    laborMarket: {
      unemploymentRate: { value: 0.035, kind: "reference_baseline", note: "" },
      employmentRate: { value: 0.78, kind: "reference_baseline", note: "" },
      avgWageCzk: { value: 38_000, kind: "reference_baseline", note: "Hrubá mzda, ilustrace." },
    },
    economicProfile: {
      regionalHdpPerCapitaCzk: nbDemo(620_000),
    },
    housing: {
      vacantUnits: { value: 850, kind: "raw_input", note: "Bytové jednotky + RD, hrubý odhad." },
      avgRentCzk: { value: 280, kind: "raw_input", note: "Orientační měsíční nájem za m² (ilustrace)." },
    },
    civic: {
      gpPer1000: { value: 0.85, kind: "raw_input", note: "Kapacita PLDD / 1000 obyvatel (demo)." },
    },
    publicFinance: {
      municipalBudgetPerCapitaCzk: { value: 38_000, kind: "raw_input", note: "Obecní rozpočet / obyvatel (ilustrace)." },
      fiscalNote: "Veřejné finance — ruční baseline; propojení na HDP modul v další epice.",
    },
    trends: {
      notes: "Růst zalidnění v okrajové části ORP; dojížďka zintermediovaná přes D11.",
    },
  };

  return {
    layerM0,
    layerM1,
    layerM2,
    p1PipelineBridge: createRecommendedP1PipelineBridgeFlags(),
    projectName: "Skladová a logistická zóna — ukázkový záměr",
    locationDescription: "Okres Kolín, k. ú. Kolín, pozemek u exitu z D11",
    czNace: "52.10",
    capexTotalCzk: 850_000_000,
    nInv: 420,
    investorProfile:
      "Strategický investor v logistice, skupina s evropskou působností.",
    legalForm: "Akciová společnost",
    strategicLinks:
      "Záměr je v souladu s krajskou polohou v dokumentu územního plánování (orientačně).",
    dLastMileKm: 4.2,
    diadPrMinutes: 30,
    diadAkMinutes: 60,
    tinfrMinutes: 5,
    t0: "2026",
    rampYearsGlobal: 5,
    sharedAssumptions: {
      KH: 1.34,
      market_coverage: 0.8,
      gamma: 0.3,
      delta: 0.15,
      alpha_elast: 0.5,
      std_MS_per_1000: 34,
      std_ZS_per_1000: 96,
      free_cap_factor: 0.9,
      beds_per_1000: 2.5,
      MPC: 0.8,
      M_spotreba: 1.8,
      r_retence: 0.65,
      p_stat: 0.33,
      p_kraj: 0.33,
      p_obec: 0.34,
      alpha_obec: 0.05,
      Rp_RUD: 1.34,
      v_RUD_per_cap: 16500,
      T_ref_years: 10,
    },
    scenarioAssumptionDelta: {
      optimistic: {
        util_RZPS: 0.7,
        k_inv: 0.15,
        p_pendler: 0.05,
        theta: 0.32,
        M_i: 0.12,
      },
      baseline: {
        util_RZPS: 0.5,
        k_inv: 0.22,
        p_pendler: 0.065,
        theta: 0.34,
        M_i: 0.1,
      },
      pessimistic: {
        util_RZPS: 0.1,
        k_inv: 0.35,
        p_pendler: 0.09,
        theta: 0.4,
        M_i: 0.08,
      },
    },
    kInv: 0.22,
    aUp: 45,
    bUp: 12,
    cUp: 6,
    mNew: 38_000,
    mRegion: 32_000,
    npVm: 120,
    npTotal: 800,
    zI: 180,
    mI: 0.1,
    nSub: 25,
    employmentRampYears: 4,
    situation: "A",
    nKmen: 95,
    nAgentura: 40,
    nPendler: 60,
    nRelokace: 0,
    shareByt: 0.45,
    shareRodinny: 0.55,
    occByt: 2.1,
    occRodinny: 3.2,
    lMarketByt: 18,
    lMarketRodinny: 12,
    vTVacant: 40,
    housingRampYears: 4,
    ou: 210,
    capRegMs: 120,
    capRegZs: 480,
    enrolledMs: 95,
    enrolledZs: 410,
    /** OQ-08: NX = OU/PX — kladné měřítko, ne podíl 0–1 (viz civic.ts). */
    pxSpecialistsAggregate: 180,
    kstandardLeisure: 2.4,
    nCelkemM3: 420,
    nAgentCizinci: 35,
    fteSecurityPer1000: 0.45,
    acuteBedsCapacity: 4,
    leisureCapacityUnits: 8,
    civicRampYears: 4,
    mvpManualDeltaHdpCzk: 120_000_000,
    sStavbyM2: 42_000,
    sPlochyM2: 28_000,
    sStavbyKcPerM2: 12,
    sPlochyKcPerM2: 5,
    kMistni: 1,
    kZakladni: 1,
    nNovaForPrud: 18,
  };
}
