import type { ExpressionNode, FunctionCallNode } from "./nodes";
import type { SourceRange } from "./sourceRange";

export function findFunctionCallAtNameOffset(
  expression: ExpressionNode,
  offset: number,
): FunctionCallNode | undefined {
  switch (expression.type) {
    case "FunctionCall": {
      for (const argument of expression.arguments) {
        const nested = findFunctionCallAtNameOffset(argument, offset);
        if (nested !== undefined) {
          return nested;
        }
      }
      return containsOffset(expression.nameRange, offset) ? expression : undefined;
    }
    case "IndexAccess":
      return (
        findFunctionCallAtNameOffset(expression.target, offset) ??
        findFunctionCallAtNameOffset(expression.index, offset)
      );
    case "PropertyAccess":
      return (
        findFunctionCallAtNameOffset(expression.target, offset) ??
        findFunctionCallAtNameOffset(expression.property, offset)
      );
    case "AtExpression":
    case "ParenthesizedExpression":
      return findFunctionCallAtNameOffset(expression.expression, offset);
    case "BooleanLiteral":
    case "Identifier":
    case "MissingExpression":
    case "NullLiteral":
    case "NumberLiteral":
    case "StringLiteral":
    case "Unknown":
      return undefined;
  }
}

function containsOffset(range: SourceRange, offset: number): boolean {
  return offset >= range.start && offset < range.end;
}
