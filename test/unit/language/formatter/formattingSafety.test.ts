import { describe, expect, it } from "vitest";
import {
  hasWdlSyntaxErrors,
  isWdlFormattingRangeSafe,
  WdlAnalyzer,
  WdlFormatter,
  WdlParser,
} from "../../../../src/language";
import { semanticAst } from "../../../support/semanticAst";
import { loadUnsafeTransformFixtures } from "../../../support/unsafeTransformFixtures";

describe("WDL formatting safety", () => {
  it("rejects recovered syntax and selections inside tokens", async () => {
    for (const { source, selectedText } of await loadUnsafeTransformFixtures(process.cwd())) {
      const analysis = new WdlAnalyzer().analyze(source);
      const selection = selectedText ?? source;
      const start = source.indexOf(selection);
      const range = { start, end: start + selection.length };
      const selectedAnalysis = new WdlAnalyzer().analyze(selection);
      expect(
        isWdlFormattingRangeSafe(analysis.tokens, range) &&
          !hasWdlSyntaxErrors(selectedAnalysis.diagnostics),
        source,
      ).toBe(false);
    }
  });

  it.each([
    ["concat('add(1, 2)', 'suffix')", "'add(1, 2)'"],
    ["concat(string(add(1, 2)), 'suffix')", "add(1, 2)"],
    ["concat('a','b')\nadd(1, 2)", "add(1, 2)"],
    ["mystery(1,2)", "mystery(1,2)"],
  ])("preserves safe selections and their meaning in %s", (source, selectedText) => {
    const analysis = new WdlAnalyzer().analyze(source);
    const start = source.indexOf(selectedText);
    expect(isWdlFormattingRangeSafe(analysis.tokens, {
      start, end: start + selectedText.length,
    })).toBe(true);
    const selected = new WdlAnalyzer().analyze(selectedText);
    expect(hasWdlSyntaxErrors(selected.diagnostics)).toBe(false);
    const formatter = new WdlFormatter();
    for (const mode of ["format", "minify"] as const) {
      const output = formatter[mode](selected.expression);
      expect(output).toBeDefined();
      const reparsed = new WdlParser(output ?? "").parse();
      expect(reparsed.diagnostics).toEqual([]);
      expect(semanticAst(reparsed.expression)).toEqual(semanticAst(selected.expression));
      expect(formatter[mode](reparsed.expression)).toBe(output);
    }
  });
});
