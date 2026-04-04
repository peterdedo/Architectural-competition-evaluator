import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Lehká kontrola, že routy reportu existují ve zdroji (bez spuštěného serveru).
 */
describe("app routes (smoke)", () => {
  const root = join(__dirname);

  it("defines /report a /report/print pages", () => {
    const report = readFileSync(join(root, "report", "page.tsx"), "utf-8");
    const print = readFileSync(join(root, "report", "print", "page.tsx"), "utf-8");
    expect(report).toContain("ReportPageClient");
    expect(print).toContain("ReportPrintPageClient");
  });
});
