import * as vscode from "vscode";
import {
  defaultFormatterOptions,
  WdlFormatter,
  type FormatterOptions,
} from "../../language";
import type { DocumentAnalysisService } from "../services/documentAnalysisService";

const configurationSection = "powerAutomateWdlExpressions.format";

export class WdlDocumentFormattingProvider
  implements vscode.DocumentFormattingEditProvider
{
  public constructor(private readonly analysis: DocumentAnalysisService) {}

  public provideDocumentFormattingEdits(
    document: vscode.TextDocument,
  ): vscode.TextEdit[] {
    const result = this.analysis.analyzeDocument(document);
    const formatted = createFormatter(document).format(result.expression);
    if (formatted === undefined || formatted === document.getText()) {
      return [];
    }

    return [
      vscode.TextEdit.replace(
        new vscode.Range(
          document.positionAt(0),
          document.positionAt(document.getText().length),
        ),
        formatted,
      ),
    ];
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
    const selectedSource = document.getText(range);
    if (selectedSource.length === 0) {
      return [];
    }

    const result = this.analysis.analyzeText(selectedSource);
    if (
      result.expression.range.start !== 0 ||
      result.expression.range.end !== selectedSource.length
    ) {
      return [];
    }

    const formatted = createFormatter(document).format(result.expression);
    if (formatted === undefined || formatted === selectedSource) {
      return [];
    }

    return [vscode.TextEdit.replace(range, formatted)];
  }
}

function createFormatter(document: vscode.TextDocument): WdlFormatter {
  return new WdlFormatter(readFormatterOptions(document));
}

function readFormatterOptions(document: vscode.TextDocument): FormatterOptions {
  const configuration = vscode.workspace.getConfiguration(
    configurationSection,
    document.uri,
  );
  const configuredIndentSize = configuration.get<number>("indentSize");
  const indentSize =
    configuredIndentSize !== undefined &&
    Number.isInteger(configuredIndentSize) &&
    configuredIndentSize > 0
      ? configuredIndentSize
      : defaultFormatterOptions.indentSize;

  return {
    indentSize,
    useTabs: configuration.get<boolean>(
      "useTabs",
      defaultFormatterOptions.useTabs,
    ),
  };
}
