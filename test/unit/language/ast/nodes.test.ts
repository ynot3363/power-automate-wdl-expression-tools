import { describe, expect, it } from "vitest";
import {
  sourceRange,
  spanRanges,
  visitExpression,
  type ExpressionNode,
  type WdlAstVisitor,
} from "../../../../src/language";

const zero = sourceRange(0, 0);
const one = sourceRange(0, 1);

const examples = [
  {
    type: "FunctionCall",
    name: "concat",
    arguments: [],
    nameRange: sourceRange(0, 6),
    openParenRange: sourceRange(6, 7),
    closeParenRange: sourceRange(7, 8),
    isClosed: true,
    range: sourceRange(0, 8),
  },
  { type: "StringLiteral", value: "x", raw: "'x'", range: one },
  {
    type: "NumberLiteral",
    value: 1,
    raw: "1",
    numberKind: "integer",
    range: one,
  },
  { type: "BooleanLiteral", value: true, range: one },
  { type: "NullLiteral", range: one },
  { type: "Identifier", name: "value", range: one },
  {
    type: "PropertyAccess",
    target: { type: "Identifier", name: "item", range: one },
    property: { type: "Identifier", name: "name", range: one },
    operatorRange: one,
    isSafe: false,
    range: one,
  },
  {
    type: "IndexAccess",
    target: { type: "Identifier", name: "item", range: one },
    index: { type: "StringLiteral", value: "name", raw: "'name'", range: one },
    operatorRange: one,
    closeBracketRange: one,
    isSafe: true,
    isClosed: true,
    range: one,
  },
  {
    type: "ParenthesizedExpression",
    expression: { type: "Identifier", name: "value", range: one },
    openParenRange: one,
    closeParenRange: one,
    isClosed: true,
    range: one,
  },
  {
    type: "AtExpression",
    expression: { type: "Identifier", name: "value", range: one },
    atSignRange: one,
    range: one,
  },
  { type: "MissingExpression", expected: "expression", range: zero },
  { type: "Unknown", raw: "$", range: one },
] as const satisfies readonly ExpressionNode[];

const typeVisitor: WdlAstVisitor<string> = {
  visitFunctionCall: (node) => node.type,
  visitStringLiteral: (node) => node.type,
  visitNumberLiteral: (node) => node.type,
  visitBooleanLiteral: (node) => node.type,
  visitNullLiteral: (node) => node.type,
  visitIdentifier: (node) => node.type,
  visitPropertyAccess: (node) => node.type,
  visitIndexAccess: (node) => node.type,
  visitParenthesizedExpression: (node) => node.type,
  visitAtExpression: (node) => node.type,
  visitMissingExpression: (node) => node.type,
  visitUnknown: (node) => node.type,
};

describe("WDL AST", () => {
  it("represents and visits every expression node variant", () => {
    expect(examples.map((node) => visitExpression(node, typeVisitor))).toEqual(
      examples.map((node) => node.type),
    );
  });

  it("creates validated half-open source ranges", () => {
    expect(sourceRange(2, 5)).toEqual({ start: 2, end: 5 });
    expect(spanRanges(sourceRange(2, 5), sourceRange(8, 10))).toEqual({
      start: 2,
      end: 10,
    });
    expect(() => sourceRange(-1, 0)).toThrow(RangeError);
    expect(() => sourceRange(2, 1)).toThrow(RangeError);
    expect(() => sourceRange(0.5, 1)).toThrow(TypeError);
  });
});
