import type * as vscode from "vscode";
import type { DocumentAnalysisService } from "../services/documentAnalysisService";
import {
  createDocumentTransform,
  createRangeTransform,
} from "../services/expressionTransforms";

export class WdlDocumentFormattingProvider
  implements vscode.DocumentFormattingEditProvider
{
  public constructor(private readonly analysis: DocumentAnalysisService) {}

  public provideDocumentFormattingEdits(
    document: vscode.TextDocument,
  ): vscode.TextEdit[] {
    const result = createDocumentTransform(document, this.analysis, "format");
    return result.kind === "edit" ? [result.edit] : [];
  }
}

export class WdlDocumentRangeFormattingProvider
  implements vscode.DocumentRangeFormattingEditProvider
{
  public constructor(private readonly analysis: DocumentAnalysisService) {}

  public provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument,
    range: vscode.Range,
  ): vscode.TextEdit[] {
    const result = createRangeTransform(
      document,
      range,
      this.analysis,
      "format",
    );
    return result.kind === "edit" ? [result.edit] : [];
  }
}
