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
    expect(context(source)).toEqual({ prefix, replacementRange });
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
