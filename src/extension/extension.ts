import type * as vscode from "vscode";
import { registerNewExpressionCommand } from "./commands/newExpression";

/** Activate the extension integration layer. */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(registerNewExpressionCommand());
}

/** Release extension resources. */
export function deactivate(): void {
  // No resources are allocated by the scaffold.
}
