import * as vscode from "vscode";
import { registerNewExpressionCommand } from "./commands/newExpression";
import {
  WdlDocumentFormattingProvider,
  WdlDocumentRangeFormattingProvider,
} from "./providers/formattingProviders";
import { WdlHoverProvider } from "./providers/hoverProvider";
import { WdlSignatureHelpProvider } from "./providers/signatureHelpProvider";
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
    vscode.languages.registerHoverProvider(
      wdlDocumentSelector,
      new WdlHoverProvider(analysis),
    ),
    vscode.languages.registerSignatureHelpProvider(
      wdlDocumentSelector,
      new WdlSignatureHelpProvider(analysis),
      "(",
      ",",
    ),
  );
}

/** Release extension resources. */
export function deactivate(): void {
  // No resources are allocated by the scaffold.
}
