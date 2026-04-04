import { describe, expect, it } from "vitest";
import {
  computeDznm,
  computeHouseholdConsumptionFromPayrollProxy,
  computeHouseholdConsumptionMvpBridge,
  computePrud,
  computeTaxYield,
  runEconomicBenefitsMvpCalculation,
} from "./economic";

const baseEcon = {
  sStavbyM2: 1000,
  sPlochyM2: 500,
  sStavbyKcPerM2: 10,
  sPlochyKcPerM2: 5,
  kMistni: 1,
  kZakladni: 1,
  nNovaForPrud: 50,
};

describe("economic DRV", () => {
  it("DRV-029 tax yield", () => {
    expect(computeTaxYield(0.34, 1e9).value).toBe(3.4e8);
  });

  it("DRV-031 DzNM", () => {
    const d = computeDznm(100, 200, 10, 5, 1, 1);
    expect(d.value).toBe(100 * 10 + 200 * 5);
  });

  it("DRV-032 PRUD", () => {
    const p = computePrud(10, 0.05, 1.34, 16500);
    expect(p.value).toBe(10 * 0.05 * 1.34 * 16500);
  });
});

describe("household consumption paths", () => {
  it("MVP bridge scales with deltaHdp", () => {
    const c = computeHouseholdConsumptionMvpBridge(1e6, 0.8, 1.8);
    expect(c.value).toBeCloseTo(1_440_000);
  });

  it("payroll proxy uses N_celkem and M_region", () => {
    const c = computeHouseholdConsumptionFromPayrollProxy(100, 40_000, 0.8, 1.8);
    expect(c.value).toBeCloseTo(100 * 40_000 * 12 * 0.8 * 1.8);
  });
});

describe("runEconomicBenefitsMvpCalculation", () => {
  it("manual MVP path without e6Bridge", () => {
    const out = runEconomicBenefitsMvpCalculation({
      ...baseEcon,
      mvpManualDeltaHdpCzk: 1_000_000,
      assumptionOverrides: { T_ref_years: 5, theta: 0.34 },
    });
    expect(out.result.deltaHdpSource).toBe("manual_mvp");
    expect(out.result.deltaHdp).toBe(1_000_000);
    expect(out.result.householdConsumptionSource).toBe("delta_mvp_bridge");
    expect(out.trace.some((t) => t.id === "M6-DELTA-MANUAL")).toBe(true);
    expect(out.trace.some((t) => t.id === "HHC-MVP")).toBe(true);
    expect(out.trace.some((t) => t.id === "M6-HHC-SOURCE")).toBe(true);
    expect(out.trace.some((t) => t.id === "M6-FISCAL-BUDGET-SPLIT")).toBe(true);
    expect(out.result.cumulativeTaxYield).toBeCloseTo(out.result.taxYield * 5);
    expect(out.openQuestionsTouched).toContain("OQ-10");
  });

  it("computed profile when sum positive", () => {
    const out = runEconomicBenefitsMvpCalculation({
      ...baseEcon,
      mvpManualDeltaHdpCzk: 100,
      e6Bridge: {
        useComputedDeltaHdp: true,
        capexTotalCzk: 400,
        constructionRampYears: 2,
        mRegionMonthlyCzk: 50_000,
        nCelkemFromM3: 10,
        ouFromM4: 1,
      },
      assumptionOverrides: {
        M_investice: 2,
        M_mista: 1,
        M_vlada: 1,
        theta: 0.34,
        T_ref_years: 10,
      },
    });
    expect(out.result.deltaHdpSource).toBe("computed_profile");
    expect(out.result.deltaHdpBreakdown).toBeDefined();
    expect(out.result.householdConsumptionSource).toBe("payroll_proxy");
    expect(out.result.deltaHdp).toBeGreaterThan(100);
    const br = out.result.deltaHdpBreakdown!;
    expect(br.investmentPhaseAnnual).toBe(
      br.investmentImpulseAnnual + br.governmentInducedFromInvestmentAnnual,
    );
    expect(br.operationalPhaseAnnual).toBe(br.employmentIncomeProxyAnnual);
    expect(br.investmentPhaseAnnual + br.operationalPhaseAnnual).toBeCloseTo(
      out.result.deltaHdp,
    );
    expect(out.trace.some((t) => t.id === "M6-PHASE-INVEST")).toBe(true);
    expect(out.trace.some((t) => t.id === "M6-PHASE-OPER")).toBe(true);
    expect(out.trace.some((t) => t.id === "M6-DELTA-PROFILE")).toBe(true);
    expect(out.trace.some((t) => t.id === "M6-C-PAYROLL")).toBe(true);
    expect(out.trace.some((t) => t.id === "M6-HHC-SOURCE")).toBe(true);
    expect(out.openQuestionsTouched).toContain("OQ-05");
  });

  it("fallback to manual when profile is zero", () => {
    const out = runEconomicBenefitsMvpCalculation({
      ...baseEcon,
      mvpManualDeltaHdpCzk: 2_000_000,
      e6Bridge: {
        useComputedDeltaHdp: true,
        capexTotalCzk: 0,
        constructionRampYears: 1,
        mRegionMonthlyCzk: 0,
        nCelkemFromM3: 0,
        ouFromM4: 0,
      },
      assumptionOverrides: { theta: 0.34 },
    });
    expect(out.result.deltaHdpSource).toBe("manual_fallback");
    expect(out.result.deltaHdp).toBe(2_000_000);
    expect(out.result.householdConsumptionSource).toBe("delta_mvp_bridge");
    expect(
      out.warnings.some((w) => w.code === "ECON_M6_DELTA_FALLBACK_MANUAL"),
    ).toBe(true);
    expect(out.trace.some((t) => t.id === "M6-DELTA-FALLBACK")).toBe(true);
    const fb = out.trace.find((t) => t.id === "M6-DELTA-FALLBACK");
    expect(String(fb?.description)).toContain("Explicitní fallback");
    const hhc = out.trace.find((t) => t.id === "HHC-MVP");
    expect(String(hhc?.description)).toContain("FALLBACK");
  });

  it("trace shape: profil — pořadí klíčových kroků M6", () => {
    const out = runEconomicBenefitsMvpCalculation({
      ...baseEcon,
      mvpManualDeltaHdpCzk: 100,
      e6Bridge: {
        useComputedDeltaHdp: true,
        capexTotalCzk: 400,
        constructionRampYears: 2,
        mRegionMonthlyCzk: 50_000,
        nCelkemFromM3: 10,
        ouFromM4: 1,
      },
      assumptionOverrides: {
        M_investice: 2,
        M_mista: 1,
        M_vlada: 1,
        theta: 0.34,
        T_ref_years: 10,
      },
    });
    const ids = out.trace.map((t) => t.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "OQ-10",
        "OQ-11",
        "M6-SOURCE-MIX",
        "M6-PHASE-INVEST",
        "M6-PHASE-OPER",
        "M6-DELTA-PROFILE",
        "DRV-029",
        "M6-FISCAL-BUDGET-SPLIT",
        "M6-C-PAYROLL",
        "M6-HHC-SOURCE",
        "DRV-030",
        "DRV-031",
        "DRV-032",
      ]),
    );
    expect(ids.indexOf("M6-PHASE-INVEST")).toBeLessThan(
      ids.indexOf("M6-DELTA-PROFILE"),
    );
    expect(ids.indexOf("M6-DELTA-PROFILE")).toBeLessThan(
      ids.indexOf("DRV-029"),
    );
    expect(ids.indexOf("DRV-029")).toBeLessThan(
      ids.indexOf("M6-FISCAL-BUDGET-SPLIT"),
    );
    expect(ids.indexOf("M6-FISCAL-BUDGET-SPLIT")).toBeLessThan(
      ids.indexOf("M6-C-PAYROLL"),
    );
  });

  it("warnings on invalid delta HDP (manual path)", () => {
    const out = runEconomicBenefitsMvpCalculation({
      ...baseEcon,
      mvpManualDeltaHdpCzk: Number.NaN,
      sStavbyM2: 0,
      sPlochyM2: 0,
      sStavbyKcPerM2: 0,
      sPlochyKcPerM2: 0,
      nNovaForPrud: 0,
    });
    expect(
      out.warnings.some((w) => w.field === "mvpManualDeltaHdpCzk"),
    ).toBe(true);
    expect(out.result.deltaHdpSource).toBe("manual_mvp");
  });
});
