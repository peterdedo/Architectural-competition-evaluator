import { z } from "zod";

import { SCENARIO_DELTA_ALLOWED_KEYS } from "@/content/scenario-delta-bounds";
import { validationMessagesCs as Z } from "@/content/validation-messages-cs";

import type { WizardState } from "./wizard-types";



const positive = z.number().nonnegative(Z.nonNeg);

const positiveInt = z.number().int(Z.int).nonnegative(Z.nonNeg);



const geoJsonOptional = z.string().refine((s) => {

  if (!s.trim()) return true;

  try {

    const o = JSON.parse(s) as { type?: string };

    const t = o?.type;

    return (

      t === "Feature" ||

      t === "FeatureCollection" ||

      t === "Polygon" ||

      t === "MultiPolygon"

    );

  } catch {

    return false;

  }

}, "Zadejte platný GeoJSON (Feature, FeatureCollection, Polygon, MultiPolygon), nebo pole nechte prázdné.");



const labeledBaseline = z.object({

  value: z.number().nonnegative(Z.nonNeg),

  kind: z.enum(["raw_input", "reference_baseline"]),

  note: z.string(),

});

const labeledSignedMigration = z.object({

  value: z.number().finite().min(-5_000_000).max(5_000_000, Z.migrationRange),

  kind: z.enum(["raw_input", "reference_baseline"]),

  note: z.string(),

});



/** Krok 0 — M0 + investor + T0 (sloučeno z dřívějších kroků 0–1 a T0 z kroku 3). */

export const step0Schema = z.object({

  projectName: z.string().min(1, "Vyplňte název záměru."),

  locationDescription: z.string().min(1, "Vyplňte lokalitu."),

  czNace: z.string().min(1, "Vyplňte CZ-NACE."),

  capexTotalCzk: positive.max(1e15, Z.capexMax),

  nInv: positiveInt.max(50_000_000, Z.nInvMax),

  investorProfile: z.string().min(1, "Vyplňte profil investora."),

  legalForm: z.string().min(1, "Vyplňte právní formu."),

  strategicLinks: z.string().optional(),

  t0: z.string().min(1, "Vyplňte rozhodný okamžik T0."),

});



/** Krok 1 — M1 území + DIAD / Tinfr / poslední míle. */

export const step1Schema = z.object({

  dLastMileKm: positive.max(5000, Z.distanceKmMax),

  diadPrMinutes: positive.max(10_080, Z.minutesMax),

  diadAkMinutes: positive.max(10_080, Z.minutesMax),

  tinfrMinutes: z.number().nonnegative(Z.nonNeg).max(525_600, Z.tinfrMax),

  geoJsonText: geoJsonOptional,

});



/** Krok 2 — M2 AS-IS baseline (validace měkká; nulové řádky = „zatím nevyplněno“). */

export const step2Schema = z

  .object({

    demographics: z.object({

      population: labeledBaseline,

      year: z.number().int().min(1990).max(2100),

    }),

    ageShares: z.object({

      age014: labeledBaseline,

      age1564: labeledBaseline,

      age65Plus: labeledBaseline,

    }),

    migration: z.object({ netPerYear: labeledSignedMigration }),

    laborMarket: z.object({

      unemploymentRate: labeledBaseline,

      employmentRate: labeledBaseline,

      avgWageCzk: labeledBaseline,

    }),

    economicProfile: z.object({ regionalHdpPerCapitaCzk: labeledBaseline }),

    housing: z.object({

      vacantUnits: labeledBaseline,

      avgRentCzk: labeledBaseline,

    }),

    civic: z.object({ gpPer1000: labeledBaseline }),

    publicFinance: z.object({

      municipalBudgetPerCapitaCzk: labeledBaseline,

      fiscalNote: z.string(),

    }),

    trends: z.object({ notes: z.string() }),

  })

  .refine(

    (s) => {

      const sum =

        s.ageShares.age014.value +

        s.ageShares.age1564.value +

        s.ageShares.age65Plus.value;

      if (sum === 0) return true;

      return Math.abs(sum - 1) <= 0.05;

    },

    {

      message:

        "Součet věkových podílů má být 1 (±5 %), nebo všechny tři nechte na 0 (zatím nevyplněno).",

      path: ["ageShares"],

    },

  )

  .superRefine((data, ctx) => {
    const issue = (path: (string | number)[], message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path });
    };
    const p = data.demographics.population.value;
    if (p > 500_000_000) {
      issue(["demographics", "population", "value"], Z.populationMax);
    }
    const ur = data.laborMarket.unemploymentRate.value;
    const er = data.laborMarket.employmentRate.value;
    if (ur > 1 || ur < 0) {
      issue(["laborMarket", "unemploymentRate", "value"], Z.rate01);
    }
    if (er > 1 || er < 0) {
      issue(["laborMarket", "employmentRate", "value"], Z.rate01);
    }
    const w = data.laborMarket.avgWageCzk.value;
    if (w > 500_000) {
      issue(["laborMarket", "avgWageCzk", "value"], Z.wageMax);
    }
    const hdp = data.economicProfile.regionalHdpPerCapitaCzk.value;
    if (hdp > 5_000_000) {
      issue(
        ["economicProfile", "regionalHdpPerCapitaCzk", "value"],
        Z.hdpCapitaMax,
      );
    }
    const vac = data.housing.vacantUnits.value;
    if (vac > 50_000_000) {
      issue(["housing", "vacantUnits", "value"], Z.vacantMax);
    }
    const rent = data.housing.avgRentCzk.value;
    if (rent > 100_000) {
      issue(["housing", "avgRentCzk", "value"], Z.rentMax);
    }
    if (data.civic.gpPer1000.value > 50) {
      issue(["civic", "gpPer1000", "value"], Z.gpMax);
    }
    const bud = data.publicFinance.municipalBudgetPerCapitaCzk.value;
    if (bud > 500_000) {
      issue(
        ["publicFinance", "municipalBudgetPerCapitaCzk", "value"],
        Z.budgetCapitaMax,
      );
    }
  });



/** Jedna mapa odchylek pro scénář — jen známé klíče, každá hodnota 0–1 (podíl / kvóta v modelu). */
const scenarioDeltaRecordSchema = z
  .record(z.string(), z.number())
  .superRefine((rec, ctx) => {
    for (const [k, v] of Object.entries(rec)) {
      if (!SCENARIO_DELTA_ALLOWED_KEYS.has(k)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Neznámý scénářový parametr „${k}“. Použijte jen pole z průvodce nebo odeberte hodnotu z uloženého stavu.`,
          path: [k],
        });
        continue;
      }
      if (!Number.isFinite(v)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: Z.finite,
          path: [k],
        });
        continue;
      }
      if (v < 0 || v > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: Z.scenarioDeltaShareRange,
          path: [k],
        });
      }
    }
  });

/** Krok 3 — horizont + scénářové odchylky (sdílené meze s UI přes scenario-delta-bounds). */

export const step3Schema = z.object({

  rampYearsGlobal: z.number().int(Z.int).min(1, Z.rangeYears).max(30, Z.rangeYears),

  scenarioAssumptionDelta: z.object({

    optimistic: scenarioDeltaRecordSchema,

    baseline: scenarioDeltaRecordSchema,

    pessimistic: scenarioDeltaRecordSchema,

  }),

});



export const step4Schema = z.object({

  kInv: z.number().min(0, Z.range01).max(1, Z.range01),

  aUp: positive.max(1e12, Z.countSanity),

  bUp: positive.max(1e12, Z.countSanity),

  cUp: positive.max(1e12, Z.countSanity),

  mNew: positive.max(1e12, Z.countSanity),

  mRegion: positive.max(1e12, Z.countSanity),

  npVm: positive.max(1e12, Z.countSanity),

  npTotal: z
    .number()
    .positive("Celková nabídka práce musí být větší než 0.")
    .max(1e12, Z.countSanity),

  zI: positive.max(1e12, Z.countSanity),

  mI: z.number().min(0, Z.range01).max(1, Z.range01),

  nSub: positive.max(1e12, Z.countSanity),

  employmentRampYears: z.number().int(Z.int).min(1, Z.rangeYears).max(30, Z.rangeYears),

});



export const step5Schema = z

  .object({

    situation: z.enum(["A", "B"]),

    nKmen: positive.max(1e7, Z.countSanity),

    nAgentura: positive.max(1e7, Z.countSanity),

    nPendler: positive.max(1e7, Z.countSanity),

    nRelokace: positive.max(1e7, Z.countSanity),

    shareByt: z.number().min(0).max(1, Z.shareHousingMax),

    shareRodinny: z.number().min(0).max(1, Z.shareHousingMax),

    occByt: positive.max(50, Z.occMax),

    occRodinny: positive.max(50, Z.occMax),

    lMarketByt: positive.max(600, Z.countSanity),

    lMarketRodinny: positive.max(600, Z.countSanity),

    vTVacant: positive.max(1e9, Z.countSanity),

    housingRampYears: z.number().int().min(1).max(30),

  })

  .refine(

    (s) => Math.abs(s.shareByt + s.shareRodinny - 1) <= 0.02,

    {

      message: "Součet podílů typů bydlení má být 1 (±2 %).",

      path: ["shareByt"],

    },

  );



export const step6Schema = z.object({

  ou: positive,

  capRegMs: positive,

  capRegZs: positive,

  enrolledMs: positive,

  enrolledZs: positive,

  pxSpecialistsAggregate: positive,

  kstandardLeisure: positive,

  nCelkemM3: positive,

  nAgentCizinci: positive,

  fteSecurityPer1000: positive,

  acuteBedsCapacity: positive,

  leisureCapacityUnits: positive,

  civicRampYears: z.number().int(Z.int).min(1, Z.rangeYears).max(30, Z.rangeYears),

});



export const step7Schema = z.object({

  mvpManualDeltaHdpCzk: z
    .number()
    .finite(Z.finite)
    .min(-1e13)
    .max(1e13, Z.deltaHdpRange),

  sStavbyM2: positive.max(1e12, Z.m2Max),

  sPlochyM2: positive.max(1e12, Z.m2Max),

  sStavbyKcPerM2: positive.max(1e9, Z.pricePerM2Max),

  sPlochyKcPerM2: positive.max(1e9, Z.pricePerM2Max),

  kMistni: positive.max(1e6, Z.countSanity),

  kZakladni: positive.max(1e6, Z.countSanity),

  nNovaForPrud: positive.max(1e9, Z.countSanity),

});



const stepSchemas = [

  step0Schema,

  step1Schema,

  step2Schema,

  step3Schema,

  step4Schema,

  step5Schema,

  step6Schema,

  step7Schema,

] as const;



export type StepSlice = [

  z.infer<typeof step0Schema>,

  z.infer<typeof step1Schema>,

  z.infer<typeof step2Schema>,

  z.infer<typeof step3Schema>,

  z.infer<typeof step4Schema>,

  z.infer<typeof step5Schema>,

  z.infer<typeof step6Schema>,

  z.infer<typeof step7Schema>,

];



export function getStepSlice(

  stepIndex: number,

  state: WizardState,

): Record<string, unknown> {

  switch (stepIndex) {

    case 0:

      return {

        projectName: state.projectName,

        locationDescription: state.locationDescription,

        czNace: state.czNace,

        capexTotalCzk: state.capexTotalCzk,

        nInv: state.nInv,

        investorProfile: state.investorProfile,

        legalForm: state.legalForm,

        strategicLinks: state.strategicLinks,

        t0: state.t0,

      };

    case 1:

      return {

        dLastMileKm: state.dLastMileKm,

        diadPrMinutes: state.diadPrMinutes,

        diadAkMinutes: state.diadAkMinutes,

        tinfrMinutes: state.tinfrMinutes,

        geoJsonText: state.layerM1.geoJsonText,

      };

    case 2:

      return { ...state.layerM2 } as Record<string, unknown>;

    case 3:

      return {

        rampYearsGlobal: state.rampYearsGlobal,

        scenarioAssumptionDelta: state.scenarioAssumptionDelta,

      };

    case 4:

      return {

        kInv: state.kInv,

        aUp: state.aUp,

        bUp: state.bUp,

        cUp: state.cUp,

        mNew: state.mNew,

        mRegion: state.mRegion,

        npVm: state.npVm,

        npTotal: state.npTotal,

        zI: state.zI,

        mI: state.mI,

        nSub: state.nSub,

        employmentRampYears: state.employmentRampYears,

      };

    case 5:

      return {

        situation: state.situation,

        nKmen: state.nKmen,

        nAgentura: state.nAgentura,

        nPendler: state.nPendler,

        nRelokace: state.nRelokace,

        shareByt: state.shareByt,

        shareRodinny: state.shareRodinny,

        occByt: state.occByt,

        occRodinny: state.occRodinny,

        lMarketByt: state.lMarketByt,

        lMarketRodinny: state.lMarketRodinny,

        vTVacant: state.vTVacant,

        housingRampYears: state.housingRampYears,

      };

    case 6:

      return {

        ou: state.ou,

        capRegMs: state.capRegMs,

        capRegZs: state.capRegZs,

        enrolledMs: state.enrolledMs,

        enrolledZs: state.enrolledZs,

        pxSpecialistsAggregate: state.pxSpecialistsAggregate,

        kstandardLeisure: state.kstandardLeisure,

        nCelkemM3: state.nCelkemM3,

        nAgentCizinci: state.nAgentCizinci,

        fteSecurityPer1000: state.fteSecurityPer1000,

        acuteBedsCapacity: state.acuteBedsCapacity,

        leisureCapacityUnits: state.leisureCapacityUnits,

        civicRampYears: state.civicRampYears,

      };

    case 7:

      return {

        mvpManualDeltaHdpCzk: state.mvpManualDeltaHdpCzk,

        sStavbyM2: state.sStavbyM2,

        sPlochyM2: state.sPlochyM2,

        sStavbyKcPerM2: state.sStavbyKcPerM2,

        sPlochyKcPerM2: state.sPlochyKcPerM2,

        kMistni: state.kMistni,

        kZakladni: state.kZakladni,

        nNovaForPrud: state.nNovaForPrud,

      };

    default:

      return {};

  }

}



export function validateWizardStep(

  stepIndex: number,

  state: WizardState,

): { ok: boolean; fieldErrors: Record<string, string> } {

  if (stepIndex < 0 || stepIndex >= stepSchemas.length) {

    return { ok: true, fieldErrors: {} };

  }

  const schema = stepSchemas[stepIndex];

  const slice = getStepSlice(stepIndex, state);

  const r = schema.safeParse(slice);

  if (r.success) return { ok: true, fieldErrors: {} };

  const fieldErrors: Record<string, string> = {};

  for (const iss of r.error.issues) {

    const path = iss.path.join(".") || "_root";

    if (!fieldErrors[path]) fieldErrors[path] = iss.message;

  }

  return { ok: false, fieldErrors };

}

/** První krok 0–7 s blokující validací — navigace ze shrnutí průvodce. */
export function firstInvalidWizardStepIndex(state: WizardState): number | null {
  for (let i = 0; i < 8; i++) {
    if (!validateWizardStep(i, state).ok) return i;
  }
  return null;
}

