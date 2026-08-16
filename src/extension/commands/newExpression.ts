import * as vscode from "vscode";
import {
  NEW_EXPRESSION_COMMAND_ID,
  WDL_EXPRESSION_LANGUAGE_ID,
} from "../constants";

export function registerNewExpressionCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(
    NEW_EXPRESSION_COMMAND_ID,
    async (): Promise<void> => {
      const document = await vscode.workspace.openTextDocument({
        content: "",
        language: WDL_EXPRESSION_LANGUAGE_ID,
      });

      await vscode.window.showTextDocument(document);
    },
  );
}
