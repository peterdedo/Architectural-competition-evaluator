import { describe, expect, it } from "vitest";
import {
  computeBedsNeed,
  computeDemandElementary,
  computeDemandKindergarten,
  computeFreeCapacity,
  computeHealthcareDemandNx,
  runCivicAmenitiesCalculation,
} from "./civic";

describe("civic DRV", () => {
  it("DRV-023/024", () => {
    expect(computeDemandKindergarten(1000, 34)).toBe(34);
    expect(computeDemandElementary(1000, 96)).toBe(96);
  });

  it("DRV-025 free capacity", () => {
    expect(computeFreeCapacity(100, 40, 0.9)).toBe(50);
  });

  it("DRV-026 beds", () => {
    expect(computeBedsNeed(2000, 2.5)).toBe(5);
  });

  it("OQ-08 when PX missing", () => {
    const oq: string[] = [];
    const h = computeHealthcareDemandNx(100, undefined, oq);
    expect(h.demand).toBe(0);
    expect(oq.length).toBe(1);
  });
});

describe("runCivicAmenitiesCalculation", () => {
  it("OQ-08 when PX missing", () => {
    const out = runCivicAmenitiesCalculation({
      ou: 100,
      capRegMs: 100,
      capRegZs: 100,
      enrolledMs: 0,
      enrolledZs: 0,
      kstandardLeisure: 1,
      nCelkemM3: 10,
      nAgentCizinci: 1,
    });
    expect(out.openQuestionsTouched).toContain("OQ-08");
  });

  it("produces mitigations when kindergarten deficit", () => {
    const out = runCivicAmenitiesCalculation({
      ou: 500,
      capRegMs: 10,
      capRegZs: 50,
      enrolledMs: 50,
      enrolledZs: 40,
      kstandardLeisure: 2,
      nCelkemM3: 100,
      nAgentCizinci: 5,
      pxSpecialistsAggregate: 200,
    });
    expect(out.result.demandMs).toBeGreaterThan(0);
    expect(out.trace.some((t) => t.drvId === "DRV-023")).toBe(true);
    expect(out.openQuestionsTouched).not.toContain("OQ-08");
  });
});
