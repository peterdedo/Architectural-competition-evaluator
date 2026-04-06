import { describe, expect, it } from "vitest";
import { splitExecutiveSummaryForOutlineCh9 } from "./executive-summary-split";

describe("splitExecutiveSummaryForOutlineCh9", () => {
  it("rozdělí text u nadpisu Co závisí na předpokladech", () => {
    const t = `### Hlavní závěry\n\nÚvodní odstavec.\n\n#### Co je v tomto shrnutí potvrzené\n- a\n\n#### Co závisí na předpokladech\n- b`;
    const { section91, section92 } = splitExecutiveSummaryForOutlineCh9(t);
    expect(section91).toContain("Úvodní odstavec");
    expect(section91).not.toContain("Co závisí na předpokladech");
    expect(section92).toContain("#### Co závisí na předpokladech");
    expect(section92).toContain("- b");
  });

  it("bez markeru vrátí celý text do 9.1 a prázdné 9.2", () => {
    const t = "jen jeden blok";
    const { section91, section92 } = splitExecutiveSummaryForOutlineCh9(t);
    expect(section91).toBe("jen jeden blok");
    expect(section92).toBe("");
  });
});
