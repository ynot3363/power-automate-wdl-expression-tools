import { describe, expect, it } from "vitest";
import {
  WdlFormatter,
  WdlParser,
  type ExpressionNode,
} from "../../../../src/language";
import { semanticAst } from "../../../support/semanticAst";

function parse(source: string): ExpressionNode {
  return new WdlParser(source).parse().expression;
}

describe("WdlFormatter", () => {
  const source =
    "if(equals(trim(variables('Name')),''),'Unknown',variables('Name'))";
  const expected = [
    "if(",
    "    equals(",
    "        trim(",
    "            variables('Name')",
    "        ),",
    "        ''",
    "    ),",
    "    'Unknown',",
    "    variables('Name')",
    ")",
  ].join("\n");

  it("formats nested calls with four-space indentation", () => {
    expect(new WdlFormatter().format(parse(source))).toBe(expected);
  });

  it("minifies a complete expression without altering literals", () => {
    expect(new WdlFormatter().minify(parse(expected))).toBe(source);
    expect(
      new WdlFormatter().minify(
        parse("if(equals(-42, 3.14), 'It''s working', '')"),
      ),
    ).toBe("if(equals(-42,3.14),'It''s working','')");
  });

  it("supports configured space and tab indentation", () => {
    const twoSpaces = new WdlFormatter({ indentSize: 2 }).format(parse(source));
    expect(twoSpaces).toContain("\n  equals(\n    trim(");

    const tabs = new WdlFormatter({ indentSize: 8, useTabs: true }).format(
      parse(source),
    );
    expect(tabs).toContain("\n\tequals(\n\t\ttrim(");
  });

  it("preserves property, index, safe access, parentheses, and at-signs", () => {
    const access = "@(outputs('Get_User')?['body/Email'].value)";
    expect(new WdlFormatter().format(parse(access))).toBe(access);
    expect(new WdlFormatter().minify(parse(access))).toBe(access);
  });

  it("returns undefined instead of rewriting incomplete or unknown input", () => {
    const formatter = new WdlFormatter();
    expect(formatter.format(parse("concat('Hello',"))).toBeUndefined();
    expect(formatter.minify(parse("outputs('Get_User')?["))).toBeUndefined();
    expect(formatter.format(parse("$"))).toBeUndefined();
  });

  it("is idempotent and preserves semantic AST shape", () => {
    const formatter = new WdlFormatter();
    const original = parse(source);
    const formatted = formatter.format(original);
    expect(formatted).toBeDefined();
    if (formatted === undefined) {
      return;
    }

    expect(formatter.format(parse(formatted))).toBe(formatted);
    expect(semanticAst(parse(formatted))).toEqual(semanticAst(original));

    const minified = formatter.minify(original);
    expect(minified).toBeDefined();
    if (minified === undefined) {
      return;
    }
    expect(semanticAst(parse(minified))).toEqual(semanticAst(original));
  });

  it("rejects invalid indentation options", () => {
    expect(() => new WdlFormatter({ indentSize: 0 })).toThrow(RangeError);
    expect(() => new WdlFormatter({ indentSize: 1.5 })).toThrow(RangeError);
  });
});
