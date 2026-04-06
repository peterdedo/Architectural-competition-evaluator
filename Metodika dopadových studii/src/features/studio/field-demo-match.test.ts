import { describe, expect, it } from "vitest";
import {
  labeledBaselineMatchesDemo,
  numbersMatchDemo,
  valuesMatchDemoDisplay,
} from "./field-demo-match";

describe("valuesMatchDemoDisplay", () => {
  it("matches identical strings", () => {
    expect(valuesMatchDemoDisplay("  Kolín  ", "Kolín")).toBe(true);
  });

  it("matches numeric forms", () => {
    expect(valuesMatchDemoDisplay("420", "420")).toBe(true);
    expect(valuesMatchDemoDisplay("0.035", "0.035")).toBe(true);
  });

  it("returns false without demo", () => {
    expect(valuesMatchDemoDisplay("x", undefined)).toBe(false);
  });

  it("empty vs non-empty demo is not match", () => {
    expect(valuesMatchDemoDisplay("", "1")).toBe(false);
  });
});

describe("numbersMatchDemo", () => {
  it("matches finite numbers", () => {
    expect(numbersMatchDemo(0.34, 0.34)).toBe(true);
    expect(numbersMatchDemo("", 0.34)).toBe(false);
  });
});

describe("labeledBaselineMatchesDemo", () => {
  it("requires kind, value and note", () => {
    const demo = { value: 100, kind: "raw_input" as const, note: "x" };
    expect(
      labeledBaselineMatchesDemo(
        { value: 100, kind: "raw_input", note: "x" },
        demo,
      ),
    ).toBe(true);
    expect(
      labeledBaselineMatchesDemo(
        { value: 101, kind: "raw_input", note: "x" },
        demo,
      ),
    ).toBe(false);
    expect(
      labeledBaselineMatchesDemo(
        { value: 100, kind: "reference_baseline", note: "x" },
        demo,
      ),
    ).toBe(false);
  });
});
