/**
 * P1 metodická vrstva: M0 strukturovaný popis záměru, M1 území, M2 AS-IS baseline.
 * Oddělené od výpočetního jádra M3–M6 — slouží jako strukturovaný vstup a report.
 */

export interface StrategicDocumentLink {
  title: string;
  relevance: string;
}

/** M0 — strukturovaný popis projektu (nad rámec MVP polí v kořeni WizardState). */
export interface LayerM0Project {
  projectCode: string;
  investorDisplayName: string;
  /** Doplňkové CZ-NACE oddělené čárkou nebo středníkem */
  secondaryNace: string;
  /** Slovní popis rozsahu / kapacity záměru */
  capacityNarrative: string;
  scopeCapacity: {
    floorAreaM2: number;
    siteAreaM2: number;
    throughputNote: string;
  };
  schedule: {
    constructionStart: string;
    fullOperationPlanned: string;
  };
  pmjPortfolio: {
    shiftsDescription: string;
    fteEquivalent: number;
    peakLoadNote: string;
  };
  strategicDocuments: StrategicDocumentLink[];
}

/** M1 — územní vymezení; geografické souřadnice a GeoJSON jsou volitelné (bez externího GIS). */
export interface LayerM1Territory {
  definitionPointLabel: string;
  /** WGS84, null = nezadáno */
  lat: number | null;
  lon: number | null;
  municipality: string;
  region: string;
  cadastralArea: string;
  boundaryNote: string;
  /** GeoJSON (Feature / FeatureCollection / Polygon) — volitelný textový vstup */
  geoJsonText: string;
  /** Popis AOI / územních jednotek (textový štítek) */
  aoiUnitsLabel: string;
  /**
   * Isochrony zatím nepočítáme — uživatel buď použije stejné hodnoty jako DIAD v kroku,
   * nebo zadá ruční poznámku (transparentní fallback).
   */
  isochronesMode: "manual_same_as_diad" | "manual_custom" | "not_computed";
  isochronesManualNote: string;
}

export type BaselineValueKind = "raw_input" | "reference_baseline";

export interface LabeledBaselineNumber {
  value: number;
  kind: BaselineValueKind;
  note: string;
}

/**
 * M2 — výchozí stav území (AS-IS), odděleně od TO-BE výpočtů.
 * Vybrané položky (nezaměstnanost, migrace, volné jednotky) lze přes P1 most vstupovat do M3/M4.
 */
export interface LayerM2AsIsBaseline {
  demographics: {
    population: LabeledBaselineNumber;
    year: number;
  };
  ageShares: {
    age014: LabeledBaselineNumber;
    age1564: LabeledBaselineNumber;
    age65Plus: LabeledBaselineNumber;
  };
  migration: {
    netPerYear: LabeledBaselineNumber;
  };
  laborMarket: {
    unemploymentRate: LabeledBaselineNumber;
    employmentRate: LabeledBaselineNumber;
    avgWageCzk: LabeledBaselineNumber;
  };
  economicProfile: {
    regionalHdpPerCapitaCzk: LabeledBaselineNumber;
  };
  housing: {
    vacantUnits: LabeledBaselineNumber;
    avgRentCzk: LabeledBaselineNumber;
  };
  civic: {
    gpPer1000: LabeledBaselineNumber;
  };
  publicFinance: {
    municipalBudgetPerCapitaCzk: LabeledBaselineNumber;
    fiscalNote: string;
  };
  trends: {
    notes: string;
  };
}

function nb(
  value: number,
  kind: BaselineValueKind = "raw_input",
  note = "",
): LabeledBaselineNumber {
  return { value, kind, note };
}

export function createDefaultLayerM0(): LayerM0Project {
  return {
    projectCode: "",
    investorDisplayName: "",
    secondaryNace: "",
    capacityNarrative: "",
    scopeCapacity: {
      floorAreaM2: 0,
      siteAreaM2: 0,
      throughputNote: "",
    },
    schedule: {
      constructionStart: "",
      fullOperationPlanned: "",
    },
    pmjPortfolio: {
      shiftsDescription: "",
      fteEquivalent: 0,
      peakLoadNote: "",
    },
    strategicDocuments: [],
  };
}

export function createDefaultLayerM1(): LayerM1Territory {
  return {
    definitionPointLabel: "",
    lat: null,
    lon: null,
    municipality: "",
    region: "",
    cadastralArea: "",
    boundaryNote: "",
    geoJsonText: "",
    aoiUnitsLabel: "",
    isochronesMode: "manual_same_as_diad",
    isochronesManualNote: "",
  };
}

export function createDefaultLayerM2(): LayerM2AsIsBaseline {
  return {
    demographics: {
      population: nb(0),
      year: new Date().getFullYear() - 1,
    },
    ageShares: {
      age014: nb(0),
      age1564: nb(0),
      age65Plus: nb(0),
    },
    migration: {
      netPerYear: nb(0),
    },
    laborMarket: {
      unemploymentRate: nb(0),
      employmentRate: nb(0),
      avgWageCzk: nb(0),
    },
    economicProfile: {
      regionalHdpPerCapitaCzk: nb(0),
    },
    housing: {
      vacantUnits: nb(0),
      avgRentCzk: nb(0),
    },
    civic: {
      gpPer1000: nb(0),
    },
    publicFinance: {
      municipalBudgetPerCapitaCzk: nb(0),
      fiscalNote: "",
    },
    trends: {
      notes: "",
    },
  };
}
