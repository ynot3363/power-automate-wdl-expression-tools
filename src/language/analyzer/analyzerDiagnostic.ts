import type { SourceRange } from "../ast/sourceRange";
import type { WdlParserDiagnostic } from "../parser/parserError";

export type WdlSemanticDiagnosticCode = "WDL1101" | "WDL1201" | "WDL1301";

export interface WdlSemanticDiagnostic {
  readonly code: WdlSemanticDiagnosticCode;
  readonly message: string;
  readonly severity: "error";
  readonly range: SourceRange;
}

export type WdlDiagnostic = WdlParserDiagnostic | WdlSemanticDiagnostic;
