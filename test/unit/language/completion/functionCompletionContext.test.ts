import { describe, expect, it } from "vitest";
import {
  getWdlFunctionCompletionContext,
  WdlLexer,
} from "../../../../src/language";

function context(markedSource: string) {
  const offset = markedSource.indexOf("|");
  const source = markedSource.replace("|", "");
  return getWdlFunctionCompletionContext(new WdlLexer(source).tokenize(), offset);
}

describe("getWdlFunctionCompletionContext", () => {
  it.each([
    ["sub|", "sub", { start: 0, end: 3 }],
    ["if(true, sub|", "sub", { start: 9, end: 12 }],
    ["concat(|", "", { start: 7, end: 7 }],
    ["@|", "", { start: 1, end: 1 }],
    ["|", "", { start: 0, end: 0 }],
  ])("finds an applicable context in %s", (source, prefix, replacementRange) => {
    expect(context(source)).toEqual({ prefix, replacementRange, hasArgumentList: false });
  });

  it.each([
    ["sub|('abc', 0, 1)", "sub", { start: 0, end: 3 }],
    ["su|b ('abc', 0, 1)", "su", { start: 0, end: 3 }],
    ["concat(|sub('abc', 0, 1), 'x')", "", { start: 7, end: 10 }],
    ["@sub|\n('abc', 0, 1)", "sub", { start: 1, end: 4 }],
    ["sub|(", "sub", { start: 0, end: 3 }],
  ])("preserves existing argument lists in %s", (source, prefix, replacementRange) => {
    expect(context(source)).toEqual({ prefix, replacementRange, hasArgumentList: true });
  });

  it.each([
    "'sub|'",
    "'unterminated sub|",
    "variables('x').sub|",
    "concat('a')|",
    "42|",
  ])("rejects an inapplicable context in %s", (source) => {
    expect(context(source)).toBeUndefined();
  });
});
