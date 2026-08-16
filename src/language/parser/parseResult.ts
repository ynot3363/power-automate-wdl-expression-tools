import type { ExpressionNode } from "../ast/nodes";
import type { Token } from "../lexer/token";
import type { WdlParserDiagnostic } from "./parserError";

export interface ParseResult {
  readonly expression: ExpressionNode;
  readonly diagnostics: readonly WdlParserDiagnostic[];
  readonly tokens: readonly Token[];
}
