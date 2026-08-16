import * as vscode from "vscode";
import {
  defaultFormatterOptions,
  WdlFormatter,
  type FormatterOptions,
} from "../../language";
import type { DocumentAnalysisService } from "./documentAnalysisService";

const configurationSection = "powerAutomateWdlExpressions.format";

export type WdlTransformMode = "format" | "minify";

export type WdlTransformResult =
  | { readonly kind: "edit"; readonly edit: vscode.TextEdit }
  | { readonly kind: "unchanged" }
  | { readonly kind: "unsafe" };

export function createDocumentTransform(
  document: vscode.TextDocument,
  analysis: DocumentAnalysisService,
  mode: WdlTransformMode,
): WdlTransformResult {
  const source = document.getText();
  const result = analysis.analyzeDocument(document);
  return createTransformResult(
    document,
    fullDocumentRange(document),
    source,
    result.expression,
    mode,
  );
}

export function createRangeTransform(
  document: vscode.TextDocument,
  range: vscode.Range,
  analysis: DocumentAnalysisService,
  mode: WdlTransformMode,
): WdlTransformResult {
  const source = document.getText(range);
  if (source.length === 0) {
    return { kind: "unchanged" };
  }

  const result = analysis.analyzeText(source);
  if (
    result.expression.range.start !== 0 ||
    result.expression.range.end !== source.length
  ) {
    return { kind: "unsafe" };
  }

  return createTransformResult(
    document,
    range,
    source,
    result.expression,
    mode,
  );
}

export function readFormatterOptions(
  document: vscode.TextDocument,
): FormatterOptions {
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

function createTransformResult(
  document: vscode.TextDocument,
  range: vscode.Range,
  source: string,
  expression: ReturnType<DocumentAnalysisService["analyzeText"]>["expression"],
  mode: WdlTransformMode,
): WdlTransformResult {
  const formatter = new WdlFormatter(readFormatterOptions(document));
  const transformed =
    mode === "format"
      ? formatter.format(expression)
      : formatter.minify(expression);
  if (transformed === undefined) {
    return { kind: "unsafe" };
  }
  if (transformed === source) {
    return { kind: "unchanged" };
  }
  return {
    kind: "edit",
    edit: vscode.TextEdit.replace(range, transformed),
  };
}

function fullDocumentRange(document: vscode.TextDocument): vscode.Range {
  return new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length),
  );
}
