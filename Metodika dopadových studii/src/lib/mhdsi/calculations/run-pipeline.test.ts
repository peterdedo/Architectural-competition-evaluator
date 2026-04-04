import { describe, expect, it } from "vitest";
import { computeOuSituationA } from "./housing";
import { runFullCalculationPipeline } from "./run-pipeline";
import { runEmploymentCalculation } from "./employment";

describe("runFullCalculationPipeline", () => {
  it("aggregates four modules and warnings", () => {
    const out = runFullCalculationPipeline({
      employment: {
        nInv: 50,
        kInv: 0,
        aUp: 10,
        bUp: 0,
        cUp: 0,
        mNew: 1,
        mRegion: 1,
        npVm: 0,
        npTotal: 10,
        zI: 0,
        nSub: 0,
        assumptionOverrides: {
          gamma: 0.3,
          delta: 0.15,
          util_RZPS: 0.5,
          p_pendler: 0.05,
        },
      },
      housing: {
        situation: "A",
        nKmen: 5,
        nAgentura: 2,
        nPendler: 0,
        nRelokace: 0,
        shareHousingType: { t1: 1 },
        occByType: { t1: 2 },
        lTMarketByType: { t1: 1 },
        vTVacant: 0,
        assumptionOverrides: { KH: 1.34, market_coverage: 0.8 },
      },
      civic: {
        ou: 10,
        capRegMs: 10,
        capRegZs: 10,
        enrolledMs: 0,
        enrolledZs: 0,
        kstandardLeisure: 1,
        nCelkemM3: 5,
        nAgentCizinci: 0,
        pxSpecialistsAggregate: 100,
        assumptionOverrides: {
          std_MS_per_1000: 34,
          std_ZS_per_1000: 96,
          free_cap_factor: 0.9,
          beds_per_1000: 2.5,
        },
      },
      economic: {
        mvpManualDeltaHdpCzk: 1e6,
        sStavbyM2: 100,
        sPlochyM2: 0,
        sStavbyKcPerM2: 10,
        sPlochyKcPerM2: 0,
        kMistni: 1,
        kZakladni: 1,
        nNovaForPrud: 2,
        assumptionOverrides: {
          theta: 0.34,
          MPC: 0.8,
          M_spotreba: 1.8,
          r_retence: 0.65,
          p_stat: 0.33,
          p_kraj: 0.33,
          p_obec: 0.34,
          alpha_obec: 0.05,
          Rp_RUD: 1.34,
          v_RUD_per_cap: 16500,
          T_ref_years: 5,
        },
      },
    });

    expect(out.employment.result.nCelkem).toBe(50);
    expect(out.housing.result.ou).toBeGreaterThan(0);
    expect(out.civic.result.kindergarten).toBeDefined();
    expect(out.economic.result.taxYield).toBeGreaterThan(0);
    expect(out.economic.result.deltaHdpSource).toBe("manual_mvp");
    expect(out.allWarnings.length).toBeGreaterThanOrEqual(0);
    expect(out.allOpenQuestions.length).toBeGreaterThanOrEqual(1);
    expect(out.allWarnings.every((w) => typeof w.code === "string")).toBe(true);
  });

  it("při linkToEmploymentM3 předá do M4 N_agentura a N_pendler z výstupu M3", () => {
    const employmentIn = {
      nInv: 50,
      kInv: 0,
      aUp: 20,
      bUp: 0,
      cUp: 0,
      mNew: 1,
      mRegion: 1,
      npVm: 0,
      npTotal: 10,
      zI: 0,
      nSub: 0,
      assumptionOverrides: {
        gamma: 0,
        delta: 0,
        util_RZPS: 0.5,
        p_pendler: 0.1,
        alpha_elast: 0,
      },
    } as const;
    const emp = runEmploymentCalculation(employmentIn);
    const expectedOu = computeOuSituationA(
      emp.result.nAgenturaCalc,
      5,
      1.34,
    );

    const out = runFullCalculationPipeline({
      employment: employmentIn,
      housing: {
        situation: "A",
        nKmen: 5,
        nAgentura: 9999,
        nPendler: 9999,
        nRelokace: 0,
        shareHousingType: { t1: 1 },
        occByType: { t1: 2 },
        lTMarketByType: { t1: 1 },
        vTVacant: 0,
        assumptionOverrides: { KH: 1.34, market_coverage: 0.8 },
        linkToEmploymentM3: true,
        p1Bridge: {
          vTVacantMvp: 0,
          nKmenMvp: 5,
          migrationAdjustment: 0,
          m2VacantUsed: false,
          m3EmploymentLink: { nAgenturaMvp: 9999, nPendlerMvp: 9999 },
        },
      },
      civic: {
        ou: 10,
        capRegMs: 10,
        capRegZs: 10,
        enrolledMs: 0,
        enrolledZs: 0,
        kstandardLeisure: 1,
        nCelkemM3: 5,
        nAgentCizinci: 0,
        pxSpecialistsAggregate: 100,
        assumptionOverrides: {
          std_MS_per_1000: 34,
          std_ZS_per_1000: 96,
          free_cap_factor: 0.9,
          beds_per_1000: 2.5,
        },
      },
      economic: {
        mvpManualDeltaHdpCzk: 1e6,
        sStavbyM2: 100,
        sPlochyM2: 0,
        sStavbyKcPerM2: 10,
        sPlochyKcPerM2: 0,
        kMistni: 1,
        kZakladni: 1,
        nNovaForPrud: 2,
        assumptionOverrides: {
          theta: 0.34,
          MPC: 0.8,
          M_spotreba: 1.8,
          r_retence: 0.65,
          p_stat: 0.33,
          p_kraj: 0.33,
          p_obec: 0.34,
          alpha_obec: 0.05,
          Rp_RUD: 1.34,
          v_RUD_per_cap: 16500,
          T_ref_years: 5,
        },
      },
    });

    expect(out.housing.result.ou).toBeCloseTo(expectedOu, 5);
    expect(out.housing.trace.some((t) => t.id === "P1-M3-M4")).toBe(true);
  });

  it("M6: e6Bridge doplňuje N_celkem z M3 a počítá profil ΔHDP", () => {
    const out = runFullCalculationPipeline({
      employment: {
        nInv: 50,
        kInv: 0,
        aUp: 10,
        bUp: 0,
        cUp: 0,
        mNew: 1,
        mRegion: 20_000,
        npVm: 0,
        npTotal: 10,
        zI: 0,
        nSub: 0,
        rampYears: 1,
        assumptionOverrides: {
          gamma: 0.3,
          delta: 0.15,
          util_RZPS: 0.5,
          p_pendler: 0.05,
        },
      },
      housing: {
        situation: "A",
        nKmen: 5,
        nAgentura: 2,
        nPendler: 0,
        nRelokace: 0,
        shareHousingType: { t1: 1 },
        occByType: { t1: 2 },
        lTMarketByType: { t1: 1 },
        vTVacant: 0,
        rampYears: 1,
        assumptionOverrides: { KH: 1.34, market_coverage: 0.8 },
      },
      civic: {
        ou: 10,
        capRegMs: 10,
        capRegZs: 10,
        enrolledMs: 0,
        enrolledZs: 0,
        kstandardLeisure: 1,
        nCelkemM3: 5,
        nAgentCizinci: 0,
        pxSpecialistsAggregate: 100,
        assumptionOverrides: {
          std_MS_per_1000: 34,
          std_ZS_per_1000: 96,
          free_cap_factor: 0.9,
          beds_per_1000: 2.5,
        },
      },
      economic: {
        mvpManualDeltaHdpCzk: 1,
        sStavbyM2: 0,
        sPlochyM2: 0,
        sStavbyKcPerM2: 0,
        sPlochyKcPerM2: 0,
        kMistni: 1,
        kZakladni: 1,
        nNovaForPrud: 0,
        e6Bridge: {
          useComputedDeltaHdp: true,
          capexTotalCzk: 1_000_000,
          constructionRampYears: 1,
          mRegionMonthlyCzk: 20_000,
        },
        assumptionOverrides: {
          theta: 0.34,
          MPC: 0.8,
          M_spotreba: 1.8,
          M_investice: 1,
          M_mista: 1,
          M_vlada: 1,
          r_retence: 0.65,
          p_stat: 0.33,
          p_kraj: 0.33,
          p_obec: 0.34,
          alpha_obec: 0.05,
          Rp_RUD: 1.34,
          v_RUD_per_cap: 16500,
          T_ref_years: 5,
        },
      },
    });

    expect(out.economic.result.deltaHdpSource).toBe("computed_profile");
    expect(out.economic.trace.some((t) => t.id === "M6-SOURCE-MIX")).toBe(true);
    expect(out.economic.trace.some((t) => t.id === "M6-PHASE-INVEST")).toBe(true);
    expect(out.economic.trace.some((t) => t.id === "M6-PHASE-OPER")).toBe(true);
    expect(out.economic.trace.some((t) => t.id === "M6-FISCAL-BUDGET-SPLIT")).toBe(
      true,
    );
    expect(out.economic.result.householdConsumptionSource).toBe("payroll_proxy");
    expect(out.economic.result.deltaHdp).toBeGreaterThan(1);
  });
});
