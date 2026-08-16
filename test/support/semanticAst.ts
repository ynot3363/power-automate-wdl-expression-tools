import type { ExpressionNode } from "../../src/language";

/** Strip source positions and raw spelling while preserving expression meaning. */
export function semanticAst(node: ExpressionNode): unknown {
  switch (node.type) {
    case "FunctionCall":
      return {
        type: node.type,
        name: node.name,
        arguments: node.arguments.map(semanticAst),
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
        target: semanticAst(node.target),
        property: semanticAst(node.property),
        isSafe: node.isSafe,
      };
    case "IndexAccess":
      return {
        type: node.type,
        target: semanticAst(node.target),
        index: semanticAst(node.index),
        isSafe: node.isSafe,
      };
    case "ParenthesizedExpression":
    case "AtExpression":
      return { type: node.type, expression: semanticAst(node.expression) };
    case "MissingExpression":
      return { type: node.type, expected: node.expected };
    case "Unknown":
      return { type: node.type, raw: node.raw };
  }
}
