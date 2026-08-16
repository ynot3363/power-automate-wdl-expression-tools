import type { ExpressionNode, FunctionCallNode } from "./nodes";
import type { SourceRange } from "./sourceRange";

export interface FunctionCallCursorContext {
  readonly call: FunctionCallNode;
  readonly argumentIndex: number;
}

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

export function findFunctionCallAtArgumentOffset(
  expression: ExpressionNode,
  offset: number,
): FunctionCallCursorContext | undefined {
  switch (expression.type) {
    case "FunctionCall": {
      for (const argument of expression.arguments) {
        const nested = findFunctionCallAtArgumentOffset(argument, offset);
        if (nested !== undefined) {
          return nested;
        }
      }

      if (
        offset < expression.openParenRange.end ||
        offset > expression.closeParenRange.start
      ) {
        return undefined;
      }

      return {
        call: expression,
        argumentIndex: activeArgumentIndex(expression, offset),
      };
    }
    case "IndexAccess":
      return (
        findFunctionCallAtArgumentOffset(expression.target, offset) ??
        findFunctionCallAtArgumentOffset(expression.index, offset)
      );
    case "PropertyAccess":
      return (
        findFunctionCallAtArgumentOffset(expression.target, offset) ??
        findFunctionCallAtArgumentOffset(expression.property, offset)
      );
    case "AtExpression":
    case "ParenthesizedExpression":
      return findFunctionCallAtArgumentOffset(expression.expression, offset);
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

function activeArgumentIndex(call: FunctionCallNode, offset: number): number {
  if (call.arguments.length === 0) {
    return 0;
  }

  for (const [index, argument] of call.arguments.entries()) {
    if (offset <= argument.range.end) {
      return index;
    }
  }

  return call.arguments.length - 1;
}
