import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { WdlFormatter, WdlParser } from "../../../../src/language";
import { semanticAst } from "../../../support/semanticAst";

interface FormatterGolden {
  readonly formatted: string | null;
  readonly minified: string | null;
  readonly twoSpaceFormatted: string | null;
  readonly tabFormatted: string | null;
}

const sourcesDirectory = resolve(
  process.cwd(),
  "test/fixtures/expressions/sources",
);
const goldenPath = resolve(
  process.cwd(),
  "test/fixtures/expressions/formatter-golden.json",
);

async function loadCorpus(): Promise<{
  readonly sourceFiles: readonly string[];
  readonly goldens: Readonly<Record<string, FormatterGolden>>;
}> {
  const sourceFiles = (await readdir(sourcesDirectory))
    .filter((fileName) => fileName.endsWith(".wdlexpr"))
    .sort();
  const goldens = JSON.parse(
    await readFile(goldenPath, "utf8"),
  ) as Readonly<Record<string, FormatterGolden>>;
  return { sourceFiles, goldens };
}

describe("WDL formatter corpus", () => {
  it("matches default, compact, two-space, and tab goldens", async () => {
    const { sourceFiles, goldens } = await loadCorpus();
    const defaultFormatter = new WdlFormatter();
    const twoSpaceFormatter = new WdlFormatter({ indentSize: 2 });
    const tabFormatter = new WdlFormatter({ useTabs: true });

    expect(Object.keys(goldens).sort()).toEqual(sourceFiles);

    for (const fileName of sourceFiles) {
      const source = await readFile(resolve(sourcesDirectory, fileName), "utf8");
      const expression = new WdlParser(source).parse().expression;
      const golden = goldens[fileName];
      expect(golden, `Missing formatter golden for ${fileName}`).toBeDefined();
      if (golden === undefined) {
        continue;
      }

      expect(defaultFormatter.format(expression), `${fileName}: formatted`).toBe(
        golden.formatted ?? undefined,
      );
      expect(defaultFormatter.minify(expression), `${fileName}: minified`).toBe(
        golden.minified ?? undefined,
      );
      expect(
        twoSpaceFormatter.format(expression),
        `${fileName}: two-space formatted`,
      ).toBe(golden.twoSpaceFormatted ?? undefined);
      expect(tabFormatter.format(expression), `${fileName}: tab formatted`).toBe(
        golden.tabFormatted ?? undefined,
      );
    }
  });

  it("is idempotent and meaning-preserving for every supported fixture", async () => {
    const { sourceFiles, goldens } = await loadCorpus();
    const formatter = new WdlFormatter();

    for (const fileName of sourceFiles) {
      const source = await readFile(resolve(sourcesDirectory, fileName), "utf8");
      const original = new WdlParser(source).parse();
      const golden = goldens[fileName];
      if (golden === undefined || golden.formatted === null) {
        expect(golden?.minified, `${fileName}: unsafe minify`).toBeNull();
        continue;
      }

      const formattedResult = new WdlParser(golden.formatted).parse();
      const minifiedResult = new WdlParser(golden.minified ?? "").parse();
      expect(formattedResult.diagnostics, `${fileName}: formatted parse`).toEqual(
        [],
      );
      expect(minifiedResult.diagnostics, `${fileName}: minified parse`).toEqual([]);
      expect(
        formatter.format(formattedResult.expression),
        `${fileName}: idempotency`,
      ).toBe(golden.formatted);
      expect(
        semanticAst(formattedResult.expression),
        `${fileName}: formatted semantics`,
      ).toEqual(semanticAst(original.expression));
      expect(
        semanticAst(minifiedResult.expression),
        `${fileName}: minified semantics`,
      ).toEqual(semanticAst(original.expression));
    }
  });

  it("covers the required formatter regression categories", async () => {
    const { sourceFiles, goldens } = await loadCorpus();
    expect(sourceFiles).toEqual(
      expect.arrayContaining([
        "complex.wdlexpr",
        "empty-call.wdlexpr",
        "escaped-and-numeric.wdlexpr",
        "incomplete-concat.wdlexpr",
        "incomplete-safe-index.wdlexpr",
        "property-access.wdlexpr",
      ]),
    );
    expect(goldens["incomplete-concat.wdlexpr"]?.formatted).toBeNull();
    expect(goldens["incomplete-safe-index.wdlexpr"]?.minified).toBeNull();
  });
});
