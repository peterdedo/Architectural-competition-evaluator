import { describe, expect, it } from "vitest";
import { getNumeric, resolveAssumptions } from "./resolve-assumptions";

describe("resolveAssumptions", () => {
  it("override beats default", () => {
    const { resolved } = resolveAssumptions(
      { gamma: 0.99 },
      ["gamma", "delta"],
    );
    expect(resolved.gamma).toBe(0.99);
    expect(resolved.delta).toBeDefined();
  });

  it("getNumeric parses string", () => {
    expect(getNumeric({ theta: "0.4" }, "theta")).toBe(0.4);
  });
});
