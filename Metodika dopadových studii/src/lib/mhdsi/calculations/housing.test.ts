import { describe, expect, it } from "vitest";
import {
  computeEffectiveSupplyType,
  computeOuSituationA,
  computeOuSituationB,
  computeUnitsForType,
  runHousingCalculation,
} from "./housing";

describe("housing OU / ZU", () => {
  it("DRV-016 Sit. A", () => {
    expect(computeOuSituationA(10, 20, 1.34)).toBeCloseTo(10 + 20 * 1.34);
  });

  it("DRV-016: KH se neaplikuje na N_agentura (regrese proti mylnému výkladu)", () => {
    const nA = 100;
    const nK = 50;
    const kh = 2;
    const ou = computeOuSituationA(nA, nK, kh);
    expect(ou).toBe(nA + nK * kh);
    const wrongIfKhOnBoth = (nA + nK) * kh;
    expect(ou).not.toBe(wrongIfKhOnBoth);
  });

  it("DRV-017 Sit. B with relokace", () => {
    expect(computeOuSituationB(10, 20, 5, 1.34)).toBeCloseTo(10 + 25 * 1.34);
  });

  it("units per type", () => {
    const u = computeUnitsForType(100, 0.5, 2);
    expect(u.zuT).toBe(50);
    expect(u.unitsRequired).toBe(25);
  });

  it("effective supply", () => {
    const e = computeEffectiveSupplyType(0.8, 10, 20, 0.5, 1);
    expect(e).toBe(0.8 * 10 + 10);
  });
});

describe("runHousingCalculation", () => {
  it("happy path + trace OPEN_QUESTION_BRIDGE for ZU default", () => {
    const out = runHousingCalculation({
      situation: "A",
      nKmen: 30,
      nAgentura: 10,
      nPendler: 0,
      nRelokace: 0,
      shareHousingType: { flat: 0.5, house: 0.5 },
      occByType: { flat: 2, house: 3 },
      lTMarketByType: { flat: 5, house: 5 },
      vTVacant: 10,
      assumptionOverrides: { KH: 1.34, market_coverage: 0.8 },
    });
    expect(out.result.ou).toBeGreaterThan(0);
    expect(out.result.zu).toBe(40);
    expect(out.trace.some((t) => t.id === "DRV-018")).toBe(true);
  });

  it("P1_M2_HOUSING_GAP když most na M2 vacant je zapnutý ale baseline má 0 jednotek", () => {
    const out = runHousingCalculation({
      situation: "A",
      nKmen: 5,
      nAgentura: 10,
      nPendler: 0,
      nRelokace: 0,
      shareHousingType: { t1: 1 },
      occByType: { t1: 2 },
      lTMarketByType: { t1: 1 },
      vTVacant: 10,
      assumptionOverrides: { KH: 1.34, market_coverage: 0.8 },
      p1Bridge: {
        vTVacantMvp: 10,
        nKmenMvp: 5,
        migrationAdjustment: 0,
        m2VacantUsed: false,
        applyM2VacantToHousingSupply: true,
        m2HousingContext: {
          population: 1000,
          avgRentCzk: 12000,
          vacantUnitsBaseline: 0,
        },
      },
    });
    expect(out.warnings.some((w) => w.code === "P1_M2_HOUSING_GAP")).toBe(true);
  });

  it("trace P1-M3-M4 při m3EmploymentLink (audit MVP vs efektivní)", () => {
    const out = runHousingCalculation({
      situation: "A",
      nKmen: 5,
      nAgentura: 35,
      nPendler: 5,
      nRelokace: 0,
      shareHousingType: { t1: 1 },
      occByType: { t1: 2 },
      lTMarketByType: { t1: 1 },
      vTVacant: 0,
      assumptionOverrides: { KH: 1.34, market_coverage: 0.8 },
      p1Bridge: {
        vTVacantMvp: 0,
        nKmenMvp: 5,
        migrationAdjustment: 0,
        m2VacantUsed: false,
        m3EmploymentLink: { nAgenturaMvp: 999, nPendlerMvp: 888 },
        applyM2VacantToHousingSupply: false,
      },
    });
    const t = out.trace.find((x) => x.id === "P1-M3-M4");
    expect(t).toBeDefined();
    expect(t?.value).toMatchObject({
      nAgenturaMvp: 999,
      nPendlerMvp: 888,
      nAgenturaEffective: 35,
      nPendlerEffective: 5,
    });
  });

  it("warns when shares do not sum to 1", () => {
    const out = runHousingCalculation({
      situation: "A",
      nKmen: 10,
      nAgentura: 10,
      nPendler: 0,
      nRelokace: 0,
      shareHousingType: { a: 0.3 },
      occByType: { a: 2 },
      lTMarketByType: { a: 1 },
      vTVacant: 0,
    });
    expect(out.warnings.length).toBeGreaterThan(0);
  });
});
