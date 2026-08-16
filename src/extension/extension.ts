import * as vscode from "vscode";
import { registerNewExpressionCommand } from "./commands/newExpression";
import {
  WdlDocumentFormattingProvider,
  WdlDocumentRangeFormattingProvider,
} from "./providers/formattingProviders";
import { DocumentAnalysisService } from "./services/documentAnalysisService";

const wdlDocumentSelector: vscode.DocumentSelector = {
  language: "power-automate-wdl-expression",
};

/** Activate the extension integration layer. */
export function activate(context: vscode.ExtensionContext): void {
  const analysis = new DocumentAnalysisService();
  context.subscriptions.push(
    registerNewExpressionCommand(),
    vscode.languages.registerDocumentFormattingEditProvider(
      wdlDocumentSelector,
      new WdlDocumentFormattingProvider(analysis),
    ),
    vscode.languages.registerDocumentRangeFormattingEditProvider(
      wdlDocumentSelector,
      new WdlDocumentRangeFormattingProvider(analysis),
    ),
  );
}

/** Release extension resources. */
export function deactivate(): void {
  // No resources are allocated by the scaffold.
}
