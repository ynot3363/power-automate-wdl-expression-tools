import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  WdlParser,
  type ExpressionNode,
  type Token,
  type WdlParserDiagnostic,
} from "../../../../src/language";

interface CorpusGolden {
  readonly source: string;
  readonly tokens: readonly Token[];
  readonly ast: ExpressionNode;
  readonly diagnostics: readonly WdlParserDiagnostic[];
}

const sourcesDirectory = resolve(
  process.cwd(),
  "test/fixtures/expressions/sources",
);
const goldenPath = resolve(
  process.cwd(),
  "test/fixtures/expressions/parser-golden.json",
);

describe("WDL parser corpus", () => {
  it("matches the checked-in lexer, AST, and diagnostic goldens", async () => {
    const sourceFiles = (await readdir(sourcesDirectory))
      .filter((fileName) => fileName.endsWith(".wdlexpr"))
      .sort();
    const goldens = JSON.parse(
      await readFile(goldenPath, "utf8"),
    ) as Readonly<Record<string, CorpusGolden>>;

    expect(Object.keys(goldens).sort()).toEqual(sourceFiles);

    for (const fileName of sourceFiles) {
      const source = await readFile(resolve(sourcesDirectory, fileName), "utf8");
      const golden = goldens[fileName];
      expect(golden, `Missing golden for ${fileName}`).toBeDefined();
      if (golden === undefined) {
        continue;
      }

      const result = new WdlParser(source).parse();
      expect(source, `${fileName}: source`).toBe(golden.source);
      expect(result.tokens, `${fileName}: lexer tokens`).toEqual(golden.tokens);
      expect(result.expression, `${fileName}: AST`).toEqual(golden.ast);
      expect(result.diagnostics, `${fileName}: diagnostics`).toEqual(
        golden.diagnostics,
      );
    }
  });

  it("continues parsing the invalid fixture after its first error", async () => {
    const source = await readFile(
      resolve(sourcesDirectory, "invalid-recovery.wdlexpr"),
      "utf8",
    );
    const result = new WdlParser(source).parse();

    expect(result.diagnostics.length).toBeGreaterThan(2);
    expect(JSON.stringify(result.expression)).toContain("toLower");
    expect(result.diagnostics.at(-1)?.range.start).toBeGreaterThan(10);
  });
});
