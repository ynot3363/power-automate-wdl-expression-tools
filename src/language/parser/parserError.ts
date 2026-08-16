import type { SourceRange } from "../ast/sourceRange";

export type WdlParserDiagnosticCode = "WDL1001" | "WDL1002" | "WDL1003";

export interface WdlParserDiagnostic {
  readonly code: WdlParserDiagnosticCode;
  readonly message: string;
  readonly severity: "error";
  readonly range: SourceRange;
}
