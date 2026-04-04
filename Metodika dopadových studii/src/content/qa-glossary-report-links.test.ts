import { describe, expect, it } from "vitest";

import { glossaryCs } from "./glossary-cs";
import { reportCs } from "@/features/report/report-copy-cs";

describe("QA: slovníček a odkazy z reportu", () => {
  it("glossary má PMJ, RZPS, RUD", () => {
    expect(glossaryCs.PMJ.length).toBeGreaterThan(40);
    expect(glossaryCs.RZPS.length).toBeGreaterThan(40);
    expect(glossaryCs.RUD.length).toBeGreaterThan(40);
  });

  it("report má sekci úprav průvodce a kroky s query ?step=", () => {
    expect(reportCs.editWizard.openWizard.length).toBeGreaterThan(5);
    expect(reportCs.editWizard.steps.length).toBeGreaterThan(0);
    for (const { step, label } of reportCs.editWizard.steps) {
      expect(step).toBeGreaterThanOrEqual(0);
      expect(step).toBeLessThanOrEqual(9);
      expect(label.length).toBeGreaterThan(3);
      expect(`/studio?step=${step}`).toMatch(/step=\d/);
    }
  });

  it("export toolbar má aria popisky", () => {
    expect(reportCs.exportsAria.snapshot).toContain("JSON");
    expect(reportCs.exportsAria.comparison).toContain("JSON");
  });
});
