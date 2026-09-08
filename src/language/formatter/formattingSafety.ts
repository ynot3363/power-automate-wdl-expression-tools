import type { WdlDiagnostic } from "../analyzer/analyzerDiagnostic";
import type { SourceRange } from "../ast/sourceRange";
import type { Token } from "../lexer/token";

/** Recovery can discard source tokens even when every remaining AST node is complete. */
export function hasWdlSyntaxErrors(diagnostics: readonly WdlDiagnostic[]): boolean {
  return diagnostics.some(({ code }) => code.startsWith("WDL10"));
}

/** A selection must not reinterpret part of a literal or another token as code. */
export function isWdlFormattingRangeSafe(
  tokens: readonly Token[],
  range: SourceRange,
): boolean {
  return !tokens.some(({ start, end }) =>
    (start < range.start && range.start < end) ||
    (start < range.end && range.end < end),
  );
}
