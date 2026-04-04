import type { EmploymentInputs, EmploymentResult } from "./employment";
import { runEmploymentCalculation } from "./employment";
import type { HousingInputs, HousingResult } from "./housing";
import { runHousingCalculation } from "./housing";
import type {
  CivicInputs,
  CivicP1BridgeResolved,
  CivicPipelineInput,
  CivicResult,
} from "./civic";
import { runCivicAmenitiesCalculation } from "./civic";
import type {
  EconomicInputs,
  EconomicPipelineInput,
  EconomicResult,
} from "./economic";
import { runEconomicBenefitsMvpCalculation } from "./economic";
import type { EngineResult, EngineWarning } from "./types";

/**
 * Jeden „full run“ pro UI: čtyři moduly v pevném pořadí M3 → M4 → M5 → M6.
 * Při `housing.linkToEmploymentM3` se do M4 před výpočtem předají N_agentura a N_pendler z výstupu M3.
 */
export interface FullCalculationPipelineInput {
  employment: EmploymentInputs;
  housing: HousingInputs;
  civic: CivicPipelineInput;
  economic: EconomicPipelineInput;
}

function resolveEconomicInput(
  economic: EconomicPipelineInput,
  employment: { result: { nCelkem: number } },
  housing: { result: { ou: number } },
): EconomicInputs {
  const pending = economic.e6Bridge;
  if (!pending?.useComputedDeltaHdp) {
    const { e6Bridge: _, ...rest } = economic;
    return { ...rest, e6Bridge: undefined };
  }
  return {
    ...economic,
    e6Bridge: {
      ...pending,
      nCelkemFromM3: employment.result.nCelkem,
      ouFromM4: housing.result.ou,
    },
  };
}

function resolveCivicInput(
  civic: CivicPipelineInput,
  employment: { result: { nCelkem: number } },
  housing: { result: { ou: number } },
): CivicInputs {
  const cin = civic.p1Bridge;
  if (!cin) {
    return { ...civic } as CivicInputs;
  }
  const resolvedBridge: CivicP1BridgeResolved = {
    ...cin,
    ouCanonical: cin.linkOuToM4 ? "m4_output" : "wizard_manual",
    nCelkemCanonical: cin.linkSafetyToM3 ? "m3_output" : "wizard_manual",
  };
  let out: CivicPipelineInput = { ...civic };
  if (cin.linkOuToM4) {
    out = { ...out, ou: housing.result.ou };
  }
  if (cin.linkSafetyToM3) {
    out = { ...out, nCelkemM3: employment.result.nCelkem };
  }
  return { ...out, p1Bridge: resolvedBridge } as CivicInputs;
}

export interface FullCalculationPipelineResult {
  employment: EngineResult<EmploymentResult>;
  housing: EngineResult<HousingResult>;
  civic: EngineResult<CivicResult>;
  economic: EngineResult<EconomicResult>;
  /** Sjednocený seznam varování (pořadí modulů M3–M6). */
  allWarnings: EngineWarning[];
  /** Sjednocené OQ z modulů */
  allOpenQuestions: string[];
}

export function runFullCalculationPipeline(
  input: FullCalculationPipelineInput,
): FullCalculationPipelineResult {
  const employment = runEmploymentCalculation(input.employment);

  let housingInput = input.housing;
  if (input.housing.linkToEmploymentM3) {
    const er = employment.result;
    const p1 = input.housing.p1Bridge;
    housingInput = {
      ...input.housing,
      nAgentura: er.nAgenturaCalc,
      nPendler: er.nPendlerCalc,
      p1Bridge: p1
        ? {
            ...p1,
            m3EmploymentLink:
              p1.m3EmploymentLink ?? {
                nAgenturaMvp: input.housing.nAgentura,
                nPendlerMvp: input.housing.nPendler,
              },
          }
        : {
            vTVacantMvp: input.housing.vTVacant,
            nKmenMvp: input.housing.nKmen,
            migrationAdjustment: 0,
            m2VacantUsed: false,
            m3EmploymentLink: {
              nAgenturaMvp: input.housing.nAgentura,
              nPendlerMvp: input.housing.nPendler,
            },
          },
    };
  }

  const housing = runHousingCalculation(housingInput);
  const civicResolved = resolveCivicInput(input.civic, employment, housing);
  const civic = runCivicAmenitiesCalculation(civicResolved);
  const economicResolved = resolveEconomicInput(
    input.economic,
    employment,
    housing,
  );
  const economic = runEconomicBenefitsMvpCalculation(economicResolved);

  const allWarnings: EngineWarning[] = [
    ...employment.warnings,
    ...housing.warnings,
    ...civic.warnings,
    ...economic.warnings,
  ];

  const allOpenQuestions = [
    ...new Set([
      ...employment.openQuestionsTouched,
      ...housing.openQuestionsTouched,
      ...civic.openQuestionsTouched,
      ...economic.openQuestionsTouched,
    ]),
  ];

  return {
    employment,
    housing,
    civic,
    economic,
    allWarnings,
    allOpenQuestions,
  };
}
