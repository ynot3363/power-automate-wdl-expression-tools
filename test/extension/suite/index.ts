import { equal, ok } from "node:assert/strict";
import * as vscode from "vscode";

export async function run(): Promise<void> {
  const extension = vscode.extensions.getExtension(
    "aepcodes.power-automate-wdl-expression-tools",
  );

  ok(extension, "The extension should be discoverable in the host.");
  await extension.activate();
  equal(extension.isActive, true, "The extension should activate.");
}
