import type {
  AtExpressionNode,
  BooleanLiteralNode,
  ExpressionNode,
  FunctionCallNode,
  IdentifierNode,
  IndexAccessNode,
  MissingExpressionNode,
  NullLiteralNode,
  NumberLiteralNode,
  ParenthesizedExpressionNode,
  PropertyAccessNode,
  StringLiteralNode,
  UnknownNode,
} from "./nodes";

export interface WdlAstVisitor<Result> {
  visitFunctionCall(node: FunctionCallNode): Result;
  visitStringLiteral(node: StringLiteralNode): Result;
  visitNumberLiteral(node: NumberLiteralNode): Result;
  visitBooleanLiteral(node: BooleanLiteralNode): Result;
  visitNullLiteral(node: NullLiteralNode): Result;
  visitIdentifier(node: IdentifierNode): Result;
  visitPropertyAccess(node: PropertyAccessNode): Result;
  visitIndexAccess(node: IndexAccessNode): Result;
  visitParenthesizedExpression(node: ParenthesizedExpressionNode): Result;
  visitAtExpression(node: AtExpressionNode): Result;
  visitMissingExpression(node: MissingExpressionNode): Result;
  visitUnknown(node: UnknownNode): Result;
}

export function visitExpression<Result>(
  node: ExpressionNode,
  visitor: WdlAstVisitor<Result>,
): Result {
  switch (node.type) {
    case "FunctionCall":
      return visitor.visitFunctionCall(node);
    case "StringLiteral":
      return visitor.visitStringLiteral(node);
    case "NumberLiteral":
      return visitor.visitNumberLiteral(node);
    case "BooleanLiteral":
      return visitor.visitBooleanLiteral(node);
    case "NullLiteral":
      return visitor.visitNullLiteral(node);
    case "Identifier":
      return visitor.visitIdentifier(node);
    case "PropertyAccess":
      return visitor.visitPropertyAccess(node);
    case "IndexAccess":
      return visitor.visitIndexAccess(node);
    case "ParenthesizedExpression":
      return visitor.visitParenthesizedExpression(node);
    case "AtExpression":
      return visitor.visitAtExpression(node);
    case "MissingExpression":
      return visitor.visitMissingExpression(node);
    case "Unknown":
      return visitor.visitUnknown(node);
  }
}
