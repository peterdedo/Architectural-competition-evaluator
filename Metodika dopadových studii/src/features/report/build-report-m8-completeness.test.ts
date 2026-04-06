/**
 * M8 report completeness — testy (EPIC 5).
 *
 * Co se testuje:
 * - přítomnost m8_report_completeness ve snapshotu
 * - verze schématu (aktuální METHODOLOGY_REPORT_SCHEMA_VERSION)
 * - struktura osnovy (outline): 10 bodů § 3.1 + 4 přílohy
 * - struktura annexes: 4 standardizované přílohy
 * - contentLayerIndex: všech 5 vrstev přítomno
 * - M8 neobsahuje výpočetní data (čistě indexační)
 * - regrese: section11.rows === m7.scenarioMetrics.rows
 * - regrese: schema verze v metadatech odpovídá METHODOLOGY_REPORT_SCHEMA_VERSION
 * - exporty nesou M8 metadata (přes snapshot)
 */

import { describe, expect, it } from "vitest";
import { createDemoWizardState } from "@/features/studio/demo-seed";
import { runAllScenarioPipelines } from "@/features/studio/run-all-scenarios";
import { buildMethodologyReportSnapshot } from "./build-report-snapshot";
import {
  METHODOLOGY_REPORT_SCHEMA_VERSION,
  type M8ContentLayer,
} from "./types";
import { serializeReportSnapshot } from "./report-exports";

const ALL_CONTENT_LAYERS: M8ContentLayer[] = [
  "inputs",
  "baseline",
  "module_results",
  "scenarios",
  "assumptions_oq_fallback",
];

describe("M8 report completeness — snapshot structure", () => {
  const state = createDemoWizardState();
  const results = runAllScenarioPipelines(state);
  const snap = buildMethodologyReportSnapshot(state, results);

  it("snapshot existuje", () => {
    expect(snap).not.toBeNull();
  });

  it("schema verze odpovídá METHODOLOGY_REPORT_SCHEMA_VERSION", () => {
    expect(snap!.metadata.schemaVersion).toBe(METHODOLOGY_REPORT_SCHEMA_VERSION);
  });

  it("m8_report_completeness je přítomno", () => {
    expect(snap!.m8_report_completeness).toBeDefined();
  });

  describe("outline (osnova § 3.1)", () => {
    it("obsahuje celkem 14 položek (10 bodů + 4 přílohy)", () => {
      expect(snap!.m8_report_completeness.outline).toHaveLength(14);
    });

    it("10 kapitol má id 'kap-1' až 'kap-10'", () => {
      const bodyItems = snap!.m8_report_completeness.outline.filter((i) =>
        i.id.startsWith("kap-"),
      );
      expect(bodyItems).toHaveLength(10);
      for (let n = 1; n <= 10; n++) {
        expect(bodyItems.find((i) => i.id === `kap-${n}`)).toBeDefined();
      }
    });

    it("4 přílohy mají id 'priloha-A' až 'priloha-D'", () => {
      const annexItems = snap!.m8_report_completeness.outline.filter((i) =>
        i.id.startsWith("priloha-"),
      );
      expect(annexItems).toHaveLength(4);
      for (const letter of ["A", "B", "C", "D"]) {
        expect(
          annexItems.find((i) => i.id === `priloha-${letter}`),
        ).toBeDefined();
      }
    });

    it("každá položka má methodologyRef, titleCs, contentLayer, snapshotPath", () => {
      for (const item of snap!.m8_report_completeness.outline) {
        expect(item.methodologyRef).toBeTruthy();
        expect(item.titleCs).toBeTruthy();
        expect(ALL_CONTENT_LAYERS).toContain(item.contentLayer);
        expect(item.snapshotPath).toBeTruthy();
      }
    });

    it("osnova neobsahuje výpočetní čísla (čistě indexační)", () => {
      for (const item of snap!.m8_report_completeness.outline) {
        expect(typeof item.id).toBe("string");
        expect(typeof item.snapshotPath).toBe("string");
        // žádné číselné hodnoty v indexačních polích
        expect(typeof item.titleCs).toBe("string");
      }
    });
  });

  describe("annexes (standardizované přílohy)", () => {
    it("jsou přítomny 4 přílohy", () => {
      expect(snap!.m8_report_completeness.annexes).toHaveLength(4);
    });

    it("každá příloha má titleCs, snapshotPath, contentLayer, availableInJsonExport", () => {
      for (const annex of snap!.m8_report_completeness.annexes) {
        expect(annex.titleCs).toBeTruthy();
        expect(annex.snapshotPath).toBeTruthy();
        expect(ALL_CONTENT_LAYERS).toContain(annex.contentLayer);
        expect(typeof annex.availableInJsonExport).toBe("boolean");
      }
    });

    it("všechny přílohy jsou dostupné v JSON exportu", () => {
      for (const annex of snap!.m8_report_completeness.annexes) {
        expect(annex.availableInJsonExport).toBe(true);
      }
    });
  });

  describe("contentLayerIndex", () => {
    it("obsahuje všech 5 vrstev", () => {
      const idx = snap!.m8_report_completeness.contentLayerIndex;
      for (const layer of ALL_CONTENT_LAYERS) {
        expect(idx[layer]).toBeDefined();
        expect(Array.isArray(idx[layer])).toBe(true);
        expect(idx[layer].length).toBeGreaterThan(0);
      }
    });

    it("každá vrstva odkazuje pouze na řetězcové klíče", () => {
      const idx = snap!.m8_report_completeness.contentLayerIndex;
      for (const layer of ALL_CONTENT_LAYERS) {
        for (const key of idx[layer]) {
          expect(typeof key).toBe("string");
        }
      }
    });
  });
});

describe("M8 ↔ exporty — jedna pravda", () => {
  const state = createDemoWizardState();
  const results = runAllScenarioPipelines(state);
  const snap = buildMethodologyReportSnapshot(state, results)!;

  it("serializeReportSnapshot nese m8_report_completeness ze snapshotu", () => {
    const json = JSON.parse(serializeReportSnapshot(snap)) as typeof snap;
    expect(json.m8_report_completeness).toBeDefined();
    expect(json.m8_report_completeness.outline).toHaveLength(14);
    expect(json.m8_report_completeness.annexes).toHaveLength(4);
  });

  it("serializeReportSnapshot nese explainability_summary (baseline)", () => {
    const json = JSON.parse(serializeReportSnapshot(snap)) as typeof snap;
    expect(Array.isArray(json.explainability_summary)).toBe(true);
    expect(
      json.explainability_summary.some((sec: { id: string }) => sec.id === "m4_ou"),
    ).toBe(true);
  });

  it("exportovaná schema verze odpovídá METHODOLOGY_REPORT_SCHEMA_VERSION", () => {
    const json = JSON.parse(serializeReportSnapshot(snap)) as typeof snap;
    expect(json.metadata.schemaVersion).toBe(METHODOLOGY_REPORT_SCHEMA_VERSION);
  });
});

describe("M8 regrese — M7 a EPIC 1–4", () => {
  const state = createDemoWizardState();
  const results = runAllScenarioPipelines(state);
  const snap = buildMethodologyReportSnapshot(state, results)!;

  it("section11_comparison.rows === m7_scenario_consolidation.scenarioMetrics.rows (referenční shoda)", () => {
    expect(snap.section11_comparison.rows).toBe(
      snap.m7_scenario_consolidation.scenarioMetrics.rows,
    );
  });

  it("section12 m7VaryingEffectiveAssumptionKeys shodné s M7 sensitivity", () => {
    expect(
      snap.section12_assumptionsUncertainty.m7VaryingEffectiveAssumptionKeys,
    ).toEqual(
      snap.m7_scenario_consolidation.sensitivitySummary.varyingAssumptionKeys,
    );
  });

  it("m8_report_completeness neobsahuje výsledky M3–M6 (čistě indexační)", () => {
    const m8 = snap.m8_report_completeness;
    // osnova ani přílohy neobsahují číselné výsledky
    const json = JSON.stringify(m8);
    // základní výpočetní čísla ze snapshotu se v M8 indexu neobjevují
    const nCelkem = snap.primaryKpiAndModules.baseline.employment.nCelkem;
    expect(json).not.toContain(String(nCelkem));
  });

  it("snap stále obsahuje p1_layers, primaryKpiAndModules, m7 (regrese EPIC 1–4)", () => {
    expect(snap.p1_layers).toBeDefined();
    expect(snap.primaryKpiAndModules.baseline).toBeDefined();
    expect(snap.m7_scenario_consolidation.scenarioMetrics.rows.length).toBeGreaterThan(0);
  });
});
