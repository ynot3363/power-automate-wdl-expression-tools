import { describe, expect, it } from "vitest";
import { WdlParser, type ExpressionNode } from "../../../../src/language";

function parse(source: string) {
  return new WdlParser(source).parse();
}

function types(node: ExpressionNode): unknown {
  switch (node.type) {
    case "FunctionCall":
      return [node.type, node.name, node.arguments.map(types)];
    case "PropertyAccess":
      return [node.type, types(node.target), types(node.property), node.isSafe];
    case "IndexAccess":
      return [node.type, types(node.target), types(node.index), node.isSafe];
    case "ParenthesizedExpression":
    case "AtExpression":
      return [node.type, types(node.expression)];
    case "Identifier":
      return [node.type, node.name];
    case "StringLiteral":
    case "NumberLiteral":
    case "BooleanLiteral":
      return [node.type, node.value];
    case "NullLiteral":
      return [node.type];
    case "MissingExpression":
      return [node.type, node.expected];
    case "Unknown":
      return [node.type, node.raw];
  }
}

describe("WdlParser", () => {
  it("parses complete nested function calls", () => {
    const source = "if(empty(variables('Name')), 'Unknown', variables('Name'))";
    const result = parse(source);

    expect(types(result.expression)).toEqual([
      "FunctionCall",
      "if",
      [
        [
          "FunctionCall",
          "empty",
          [["FunctionCall", "variables", [["StringLiteral", "Name"]]]],
        ],
        ["StringLiteral", "Unknown"],
        ["FunctionCall", "variables", [["StringLiteral", "Name"]]],
      ],
    ]);
    expect(result.diagnostics).toEqual([]);
    expect(result.expression.range).toEqual({ start: 0, end: source.length });
  });

  it("parses every literal and an identifier", () => {
    expect(types(parse("'value'").expression)).toEqual([
      "StringLiteral",
      "value",
    ]);
    expect(types(parse("-42").expression)).toEqual(["NumberLiteral", -42]);
    expect(types(parse("3.14").expression)).toEqual(["NumberLiteral", 3.14]);
    expect(types(parse("true").expression)).toEqual(["BooleanLiteral", true]);
    expect(types(parse("null").expression)).toEqual(["NullLiteral"]);
    expect(types(parse("item").expression)).toEqual(["Identifier", "item"]);
  });

  it("parses property, index, and null-safe access as nodes", () => {
    const source = "outputs('Get_User')?['body/Email'].value";
    const result = parse(source);

    expect(types(result.expression)).toEqual([
      "PropertyAccess",
      [
        "IndexAccess",
        ["FunctionCall", "outputs", [["StringLiteral", "Get_User"]]],
        ["StringLiteral", "body/Email"],
        true,
      ],
      ["Identifier", "value"],
      false,
    ]);
    expect(result.diagnostics).toEqual([]);
    expect(result.expression.range).toEqual({ start: 0, end: source.length });
  });

  it("parses the optional at-sign and explicit parentheses", () => {
    expect(types(parse("@(concat('a'))").expression)).toEqual([
      "AtExpression",
      [
        "ParenthesizedExpression",
        ["FunctionCall", "concat", [["StringLiteral", "a"]]],
      ],
    ]);
  });

  it.each([
    ["concat(", ["FunctionCall", "concat", [["MissingExpression", "argument"]]]],
    [
      "concat('Hello',",
      [
        "FunctionCall",
        "concat",
        [["StringLiteral", "Hello"], ["MissingExpression", "argument"]],
      ],
    ],
    [
      "concat(variables('Name'),",
      [
        "FunctionCall",
        "concat",
        [
          ["FunctionCall", "variables", [["StringLiteral", "Name"]]],
          ["MissingExpression", "argument"],
        ],
      ],
    ],
    [
      "if(equals(",
      [
        "FunctionCall",
        "if",
        [
          [
            "FunctionCall",
            "equals",
            [["MissingExpression", "argument"]],
          ],
        ],
      ],
    ],
  ])("recovers a useful AST for incomplete input %s", (source, expected) => {
    const result = parse(source);
    expect(types(result.expression)).toEqual(expected);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics.every(({ code }) => code.startsWith("WDL100"))).toBe(
      true,
    );
  });

  it("recovers an incomplete safe index access", () => {
    const result = parse("outputs('Get_User')?[");
    expect(types(result.expression)).toEqual([
      "IndexAccess",
      ["FunctionCall", "outputs", [["StringLiteral", "Get_User"]]],
      ["MissingExpression", "expression"],
      true,
    ]);
    expect(result.diagnostics.map(({ range }) => range)).toContainEqual({
      start: 21,
      end: 21,
    });
  });

  it("returns diagnostics separately and preserves unexpected input", () => {
    const result = parse("$ trailing");
    expect(types(result.expression)).toEqual(["Unknown", "$"]);
    expect(result.diagnostics).toEqual([
      {
        code: "WDL1003",
        message: 'Unexpected input "$".',
        severity: "error",
        range: { start: 0, end: 1 },
      },
      {
        code: "WDL1003",
        message: 'Unexpected token "trailing" after the expression.',
        severity: "error",
        range: { start: 2, end: 10 },
      },
    ]);
  });

  it("returns a missing expression for empty input without throwing", () => {
    const result = parse("");
    expect(types(result.expression)).toEqual([
      "MissingExpression",
      "expression",
    ]);
    expect(result.diagnostics[0]?.range).toEqual({ start: 0, end: 0 });
  });
});
