import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { WdlAnalyzer, type WdlDiagnostic } from "../../../../src/language";

interface AnalyzerGolden {
  readonly source: string;
  readonly diagnostics: readonly WdlDiagnostic[];
}

const sourcesDirectory = resolve(process.cwd(), "test/fixtures/expressions/sources");
const goldenPath = resolve(
  process.cwd(),
  "test/fixtures/expressions/analyzer-golden.json",
);

describe("WDL analyzer corpus", () => {
  it("matches the checked-in semantic diagnostic goldens", async () => {
    const sourceFiles = (await readdir(sourcesDirectory))
      .filter((fileName) => fileName.endsWith(".wdlexpr"))
      .sort();
    const goldens = JSON.parse(
      await readFile(goldenPath, "utf8"),
    ) as Readonly<Record<string, AnalyzerGolden>>;

    expect(Object.keys(goldens).sort()).toEqual(sourceFiles);
    for (const fileName of sourceFiles) {
      const source = await readFile(resolve(sourcesDirectory, fileName), "utf8");
      const golden = goldens[fileName];
      expect(golden, `Missing golden for ${fileName}`).toBeDefined();
      if (golden === undefined) {
        continue;
      }

      expect(source, `${fileName}: source`).toBe(golden.source);
      expect(
        new WdlAnalyzer().analyze(source).diagnostics,
        `${fileName}: diagnostics`,
      ).toEqual(golden.diagnostics);
    }
  });
});
