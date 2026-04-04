import { describe, expect, it } from "vitest";
import {
  AGENCY_SHARE_OF_N_CELKEM_RISK_THRESHOLD,
  buildLinearAnnualRamp,
  computeLaborGap,
  computeRzpsAfterUtil,
  computeRzpsRaw,
  computeSubstitutionBase,
  computeSubstitutionCompetition,
  computeWorkforceDemand,
  runEmploymentCalculation,
  splitLaborGap,
  WARNING_CODE_AGENCY_SHARE_RISK,
} from "./employment";

describe("employment pure formulas", () => {
  it("DRV-007 workforce demand", () => {
    expect(computeWorkforceDemand(100, 0.2).value).toBe(80);
  });

  it("DRV-008 RZPS raw", () => {
    expect(computeRzpsRaw(10, 20, 5, 0.3, 0.15).value).toBe(10 + 6 + 0.75);
  });

  it("DRV-009 util", () => {
    expect(computeRzpsAfterUtil(100, 0.5).value).toBe(50);
  });

  it("DRV-010 warns on M_region=0", () => {
    const r = computeSubstitutionBase(0.5, 30000, 0);
    expect(r.value).toBe(0);
    expect(r.warning).toBeDefined();
  });

  it("DRV-011 NP_tot=0", () => {
    const r = computeSubstitutionCompetition(0.1, 5, 0);
    expect(r.value).toBe(0);
  });

  it("DRV-013 gap", () => {
    expect(computeLaborGap(80, 30, 10).value).toBe(40);
  });

  it("split gap pendler + agentura", () => {
    const s = splitLaborGap(80, 40, 0.065);
    expect(s.nPendlerCalc).toBeCloseTo(5.2);
    expect(s.nAgenturaCalc).toBeCloseTo(34.8);
  });

  it("linear ramp sums to 1", () => {
    const r = buildLinearAnnualRamp(4);
    expect(r.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(r.length).toBe(4);
  });
});

describe("runEmploymentCalculation", () => {
  it("happy path trace + assumptions (nízký podíl agentury ≤ metodický práh)", () => {
    const out = runEmploymentCalculation({
      nInv: 200,
      kInv: 0.25,
      aUp: 200,
      bUp: 0,
      cUp: 0,
      mNew: 35000,
      mRegion: 30000,
      npVm: 100,
      npTotal: 500,
      zI: 200,
      mI: 0.1,
      nSub: 0,
      assumptionOverrides: {
        gamma: 0,
        delta: 0,
        util_RZPS: 0.65,
        alpha_elast: 0.5,
        p_pendler: 0.1,
      },
    });
    expect(out.result.nCelkem).toBe(150);
    const share =
      out.result.nCelkem > 0
        ? out.result.nAgenturaCalc / out.result.nCelkem
        : 0;
    expect(share).toBeLessThanOrEqual(AGENCY_SHARE_OF_N_CELKEM_RISK_THRESHOLD);
    expect(out.trace.some((t) => t.id === "M3-SOURCE-MIX")).toBe(true);
    expect(out.trace.some((t) => t.drvId === "DRV-007")).toBe(true);
    expect(Object.keys(out.assumptionsUsed).length).toBeGreaterThan(0);
    expect(out.warnings.some((w) => w.code === WARNING_CODE_AGENCY_SHARE_RISK)).toBe(
      false,
    );
  });

  it("AGENCY_SHARE_RISK při podílu agentury > metodický práh", () => {
    const out = runEmploymentCalculation({
      nInv: 100,
      kInv: 0,
      aUp: 10,
      bUp: 0,
      cUp: 0,
      mNew: 1,
      mRegion: 1,
      npVm: 0,
      npTotal: 100,
      zI: 0,
      nSub: 0,
      assumptionOverrides: {
        gamma: 0,
        delta: 0,
        util_RZPS: 0.1,
        alpha_elast: 0,
        p_pendler: 0.05,
      },
    });
    expect(out.result.nCelkem).toBe(100);
    const share = out.result.nAgenturaCalc / out.result.nCelkem;
    expect(share).toBeGreaterThan(AGENCY_SHARE_OF_N_CELKEM_RISK_THRESHOLD);
    const w = out.warnings.find((x) => x.code === WARNING_CODE_AGENCY_SHARE_RISK);
    expect(w).toBeDefined();
    expect(w?.field).toBe("p_pendler");
    expect(out.trace.some((t) => t.id === "M3-AGENCY-SHARE-SIGNAL")).toBe(true);
  });

  it("missing k_inv defaults 0 with warning", () => {
    const out = runEmploymentCalculation({
      nInv: 100,
      aUp: 0,
      bUp: 0,
      cUp: 0,
      mNew: 1,
      mRegion: 1,
      npVm: 0,
      npTotal: 100,
      zI: 0,
      nSub: 0,
      assumptionOverrides: {},
    });
    expect(out.warnings.some((w) => w.field === "k_inv")).toBe(true);
    expect(out.warnings[0]?.code).toBe("MISSING_INPUT");
    expect(out.result.nCelkem).toBe(100);
  });

  it("scenario difference via util_RZPS", () => {
    const low = runEmploymentCalculation({
      nInv: 100,
      kInv: 0,
      aUp: 50,
      bUp: 0,
      cUp: 0,
      mNew: 1,
      mRegion: 1,
      npVm: 0,
      npTotal: 100,
      zI: 0,
      nSub: 0,
      assumptionOverrides: { util_RZPS: 0.1 },
    });
    const high = runEmploymentCalculation({
      nInv: 100,
      kInv: 0,
      aUp: 50,
      bUp: 0,
      cUp: 0,
      mNew: 1,
      mRegion: 1,
      npVm: 0,
      npTotal: 100,
      zI: 0,
      nSub: 0,
      assumptionOverrides: { util_RZPS: 0.9 },
    });
    expect(high.result.rzps).toBeGreaterThan(low.result.rzps);
  });

  it("P1 M2 nezaměstnanost mění util_RZPS (trace P1-M2-U)", () => {
    const base = runEmploymentCalculation({
      nInv: 100,
      kInv: 0,
      aUp: 50,
      bUp: 0,
      cUp: 0,
      mNew: 1,
      mRegion: 1,
      npVm: 0,
      npTotal: 100,
      zI: 0,
      nSub: 0,
      assumptionOverrides: { util_RZPS: 0.5, gamma: 0, delta: 0, p_pendler: 0 },
      p1Bridge: {
        nInvMvp: 100,
        ftePmJFactor: 1,
        baselineUnemploymentRate: 0.035,
        baselineEmploymentRate: 0.65,
        applyM2UnemploymentToUtilRzps: true,
      },
    });
    expect(base.trace.some((t) => t.id === "P1-M2-U")).toBe(true);
    expect(base.trace.some((t) => t.id === "P1-M2-MKT")).toBe(true);
    expect(base.warnings.some((w) => w.code === "P1_BASELINE_BRIDGE")).toBe(true);
  });

  it("P1_BASELINE_GAP když je most M2→util zapnutý ale bez platné nezaměstnanosti", () => {
    const out = runEmploymentCalculation({
      nInv: 100,
      kInv: 0,
      aUp: 50,
      bUp: 0,
      cUp: 0,
      mNew: 1,
      mRegion: 1,
      npVm: 0,
      npTotal: 100,
      zI: 0,
      nSub: 0,
      assumptionOverrides: { util_RZPS: 0.5, gamma: 0, delta: 0, p_pendler: 0 },
      p1Bridge: {
        nInvMvp: 100,
        ftePmJFactor: 1,
        baselineUnemploymentRate: null,
        applyM2UnemploymentToUtilRzps: true,
      },
    });
    expect(out.warnings.some((w) => w.code === "P1_BASELINE_GAP")).toBe(true);
    expect(out.trace.some((t) => t.id === "P1-M2-U")).toBe(false);
  });
});
