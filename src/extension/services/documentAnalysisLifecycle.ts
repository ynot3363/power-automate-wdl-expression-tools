import * as vscode from "vscode";
import { WDL_EXPRESSION_LANGUAGE_ID } from "../constants";
import type { DocumentAnalysisService } from "./documentAnalysisService";

export function registerDocumentAnalysisLifecycle(
  analysis: DocumentAnalysisService,
): vscode.Disposable {
  return vscode.Disposable.from(
    vscode.workspace.onDidCloseTextDocument((document) => {
      analysis.releaseDocument(document.uri);
    }),
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (document.languageId !== WDL_EXPRESSION_LANGUAGE_ID) {
        analysis.releaseDocument(document.uri);
      }
    }),
    vscode.workspace.onDidChangeTextDocument(({ document }) => {
      if (document.languageId !== WDL_EXPRESSION_LANGUAGE_ID) {
        analysis.releaseDocument(document.uri);
      }
    }),
  );
}
