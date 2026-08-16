import { equal, ok } from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as vscode from "vscode";

const EXTENSION_ID = "aepcodes.power-automate-wdl-expression-tools";
const LANGUAGE_ID = "power-automate-wdl-expression";
const NEW_EXPRESSION_COMMAND_ID =
  "powerAutomateWdlExpressions.newExpression";

export async function run(): Promise<void> {
  const extension = vscode.extensions.getExtension(EXTENSION_ID);

  ok(extension, "The extension should be discoverable in the host.");
  await extension.activate();
  equal(extension.isActive, true, "The extension should activate.");

  const languages = await vscode.languages.getLanguages();
  ok(languages.includes(LANGUAGE_ID), "The WDL language should be registered.");

  const commands = await vscode.commands.getCommands(true);
  ok(
    commands.includes(NEW_EXPRESSION_COMMAND_ID),
    "The new-expression command should be registered.",
  );

  const fixtureDirectory = await mkdtemp(join(tmpdir(), "wdlexpr-test-"));
  const fixturePath = join(fixtureDirectory, "automatic.wdlexpr");

  try {
    await writeFile(fixturePath, "concat('Hello', 'World')", "utf8");
    const fileDocument = await vscode.workspace.openTextDocument(fixturePath);
    equal(
      fileDocument.languageId,
      LANGUAGE_ID,
      ".wdlexpr files should select the WDL language automatically.",
    );

    await vscode.commands.executeCommand(NEW_EXPRESSION_COMMAND_ID);
    const activeDocument = vscode.window.activeTextEditor?.document;
    ok(activeDocument, "The command should open an editor.");
    equal(activeDocument.isUntitled, true, "The new document should be untitled.");
    equal(
      activeDocument.languageId,
      LANGUAGE_ID,
      "The new document should use the WDL language.",
    );
  } finally {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await rm(fixtureDirectory, { force: true, recursive: true });
  }
}
