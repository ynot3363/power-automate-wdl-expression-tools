import type { SourceRange } from "./sourceRange";

interface BaseExpressionNode {
  readonly range: SourceRange;
}

export interface FunctionCallNode extends BaseExpressionNode {
  readonly type: "FunctionCall";
  readonly name: string;
  readonly arguments: readonly ExpressionNode[];
  readonly nameRange: SourceRange;
  readonly openParenRange: SourceRange;
  readonly closeParenRange: SourceRange;
  readonly isClosed: boolean;
}

export interface StringLiteralNode extends BaseExpressionNode {
  readonly type: "StringLiteral";
  readonly value: string;
  readonly raw: string;
}

export interface NumberLiteralNode extends BaseExpressionNode {
  readonly type: "NumberLiteral";
  readonly value: number;
  readonly raw: string;
  readonly numberKind: "integer" | "float";
}

export interface BooleanLiteralNode extends BaseExpressionNode {
  readonly type: "BooleanLiteral";
  readonly value: boolean;
}

export interface NullLiteralNode extends BaseExpressionNode {
  readonly type: "NullLiteral";
}

export interface IdentifierNode extends BaseExpressionNode {
  readonly type: "Identifier";
  readonly name: string;
}

export interface PropertyAccessNode extends BaseExpressionNode {
  readonly type: "PropertyAccess";
  readonly target: ExpressionNode;
  readonly property: IdentifierNode;
  readonly operatorRange: SourceRange;
  readonly isSafe: boolean;
}

export interface IndexAccessNode extends BaseExpressionNode {
  readonly type: "IndexAccess";
  readonly target: ExpressionNode;
  readonly index: ExpressionNode;
  readonly operatorRange: SourceRange;
  readonly closeBracketRange: SourceRange;
  readonly isSafe: boolean;
  readonly isClosed: boolean;
}

export interface ParenthesizedExpressionNode extends BaseExpressionNode {
  readonly type: "ParenthesizedExpression";
  readonly expression: ExpressionNode;
  readonly openParenRange: SourceRange;
  readonly closeParenRange: SourceRange;
  readonly isClosed: boolean;
}

export interface AtExpressionNode extends BaseExpressionNode {
  readonly type: "AtExpression";
  readonly expression: ExpressionNode;
  readonly atSignRange: SourceRange;
}

export interface MissingExpressionNode extends BaseExpressionNode {
  readonly type: "MissingExpression";
  readonly expected: string;
}

export interface UnknownNode extends BaseExpressionNode {
  readonly type: "Unknown";
  readonly raw: string;
}

export type ExpressionNode =
  | FunctionCallNode
  | StringLiteralNode
  | NumberLiteralNode
  | BooleanLiteralNode
  | NullLiteralNode
  | IdentifierNode
  | PropertyAccessNode
  | IndexAccessNode
  | ParenthesizedExpressionNode
  | AtExpressionNode
  | MissingExpressionNode
  | UnknownNode;
