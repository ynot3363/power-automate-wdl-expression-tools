import * as vscode from "vscode";
import {
  FORMAT_EXPRESSION_COMMAND_ID,
  MINIFY_EXPRESSION_COMMAND_ID,
  WDL_EXPRESSION_LANGUAGE_ID,
} from "../constants";
import type { DocumentAnalysisService } from "../services/documentAnalysisService";
import {
  createDocumentTransform,
  createRangeTransform,
  type WdlTransformMode,
  type WdlTransformResult,
} from "../services/expressionTransforms";

export function registerExpressionTransformCommands(
  analysis: DocumentAnalysisService,
): readonly vscode.Disposable[] {
  return [
    vscode.commands.registerCommand(FORMAT_EXPRESSION_COMMAND_ID, async () => {
      await transformActiveExpression(analysis, "format");
    }),
    vscode.commands.registerCommand(MINIFY_EXPRESSION_COMMAND_ID, async () => {
      await transformActiveExpression(analysis, "minify");
    }),
  ];
}

async function transformActiveExpression(
  analysis: DocumentAnalysisService,
  mode: WdlTransformMode,
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    void vscode.window.showInformationMessage(
      "Open a WDL expression editor before running this command.",
    );
    return;
  }
  if (editor.document.languageId !== WDL_EXPRESSION_LANGUAGE_ID) {
    void vscode.window.showWarningMessage(
      "This command only transforms Power Automate WDL Expression documents.",
    );
    return;
  }
  if (editor.selections.length !== 1) {
    void vscode.window.showWarningMessage(
      "Select one WDL expression range, or use a single cursor for the whole document.",
    );
    return;
  }

  const selection = editor.selection;
  const result = selection.isEmpty
    ? createDocumentTransform(editor.document, analysis, mode)
    : createRangeTransform(editor.document, selection, analysis, mode);
  await applyTransform(editor, result, mode);
}

async function applyTransform(
  editor: vscode.TextEditor,
  result: WdlTransformResult,
  mode: WdlTransformMode,
): Promise<void> {
  if (result.kind === "unsafe") {
    void vscode.window.showWarningMessage(
      `The ${mode} command could not safely transform the incomplete or unsupported expression.`,
    );
    return;
  }
  if (result.kind === "unchanged") {
    return;
  }

  await editor.edit(
    (editBuilder) => {
      editBuilder.replace(result.edit.range, result.edit.newText);
    },
    { undoStopBefore: true, undoStopAfter: true },
  );
}
