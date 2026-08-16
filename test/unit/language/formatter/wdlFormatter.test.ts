import { describe, expect, it } from "vitest";
import {
  WdlFormatter,
  WdlParser,
  type ExpressionNode,
} from "../../../../src/language";

function parse(source: string): ExpressionNode {
  return new WdlParser(source).parse().expression;
}

function semanticShape(node: ExpressionNode): unknown {
  switch (node.type) {
    case "FunctionCall":
      return {
        type: node.type,
        name: node.name,
        arguments: node.arguments.map(semanticShape),
      };
    case "StringLiteral":
      return { type: node.type, value: node.value };
    case "NumberLiteral":
      return { type: node.type, value: node.value, numberKind: node.numberKind };
    case "BooleanLiteral":
      return { type: node.type, value: node.value };
    case "NullLiteral":
      return { type: node.type };
    case "Identifier":
      return { type: node.type, name: node.name };
    case "PropertyAccess":
      return {
        type: node.type,
        target: semanticShape(node.target),
        property: semanticShape(node.property),
        isSafe: node.isSafe,
      };
    case "IndexAccess":
      return {
        type: node.type,
        target: semanticShape(node.target),
        index: semanticShape(node.index),
        isSafe: node.isSafe,
      };
    case "ParenthesizedExpression":
    case "AtExpression":
      return { type: node.type, expression: semanticShape(node.expression) };
    case "MissingExpression":
      return { type: node.type, expected: node.expected };
    case "Unknown":
      return { type: node.type, raw: node.raw };
  }
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
    expect(semanticShape(parse(formatted))).toEqual(semanticShape(original));

    const minified = formatter.minify(original);
    expect(minified).toBeDefined();
    if (minified === undefined) {
      return;
    }
    expect(semanticShape(parse(minified))).toEqual(semanticShape(original));
  });

  it("rejects invalid indentation options", () => {
    expect(() => new WdlFormatter({ indentSize: 0 })).toThrow(RangeError);
    expect(() => new WdlFormatter({ indentSize: 1.5 })).toThrow(RangeError);
  });
});
