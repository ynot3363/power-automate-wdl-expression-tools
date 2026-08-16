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

  const packageJson = extension.packageJSON as {
    contributes?: {
      configuration?: {
        properties?: Readonly<Record<string, { default?: unknown }>>;
      };
      grammars?: readonly { scopeName?: string }[];
      languages?: readonly { configuration?: string; id?: string }[];
    };
  };
  equal(
    packageJson.contributes?.languages?.[0]?.configuration,
    "./language-configuration.json",
    "The WDL language should contribute its editor configuration.",
  );
  equal(
    packageJson.contributes.grammars?.[0]?.scopeName,
    "source.power-automate-wdl-expression",
    "The WDL language should contribute its TextMate grammar.",
  );
  equal(
    packageJson.contributes.configuration?.properties?.[
      "powerAutomateWdlExpressions.format.indentSize"
    ]?.default,
    4,
    "The formatter should contribute a four-space default.",
  );
  equal(
    packageJson.contributes.configuration.properties[
      "powerAutomateWdlExpressions.format.useTabs"
    ]?.default,
    false,
    "The formatter should use spaces by default.",
  );

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

    await verifyFormatting();
  } finally {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await rm(fixtureDirectory, { force: true, recursive: true });
  }
}

async function verifyFormatting(): Promise<void> {
  const configuration = vscode.workspace.getConfiguration(
    "powerAutomateWdlExpressions.format",
  );
  try {
    const defaultDocument = await openExpression(
      "if(equals(1,1),'yes','no')",
    );
    await vscode.commands.executeCommand("editor.action.formatDocument");
    equal(
      defaultDocument.getText(),
      "if(\n    equals(1, 1),\n    'yes',\n    'no'\n)",
      "Format Document should use the engine formatter and default indentation.",
    );

    await configuration.update(
      "indentSize",
      2,
      vscode.ConfigurationTarget.Global,
    );
    const configuredDocument = await openExpression(
      "if(equals(1,1),'yes','no')",
    );
    await vscode.commands.executeCommand("editor.action.formatDocument");
    equal(
      configuredDocument.getText(),
      "if(\n  equals(1, 1),\n  'yes',\n  'no'\n)",
      "Format Document should read resource-scoped indentation settings.",
    );

    await configuration.update(
      "useTabs",
      true,
      vscode.ConfigurationTarget.Global,
    );
    const tabDocument = await openExpression("if(equals(1,1),'yes','no')");
    await vscode.commands.executeCommand("editor.action.formatDocument");
    equal(
      tabDocument.getText(),
      "if(\n\tequals(1, 1),\n\t'yes',\n\t'no'\n)",
      "Format Document should honor tab indentation.",
    );

    await resetFormattingConfiguration(configuration);

    const selectionDocument = await openExpression(
      "concat('left','right')\nif(equals(1,1),'yes','no')",
    );
    const editor = vscode.window.activeTextEditor;
    ok(editor, "The selection formatting fixture should have an editor.");
    editor.selection = new vscode.Selection(
      selectionDocument.lineAt(1).range.start,
      selectionDocument.lineAt(1).range.end,
    );
    await vscode.commands.executeCommand("editor.action.formatSelection");
    equal(
      selectionDocument.getText(),
      "concat('left','right')\nif(\n    equals(1, 1),\n    'yes',\n    'no'\n)",
      "Format Selection should replace one complete selected expression.",
    );

    const incompleteDocument = await openExpression("concat('left', 'right')");
    const incompleteEditor = vscode.window.activeTextEditor;
    ok(incompleteEditor, "The incomplete selection fixture should have an editor.");
    incompleteEditor.selection = new vscode.Selection(0, 0, 0, 14);
    await vscode.commands.executeCommand("editor.action.formatSelection");
    equal(
      incompleteDocument.getText(),
      "concat('left', 'right')",
      "Incomplete selections should remain unchanged.",
    );
  } finally {
    await resetFormattingConfiguration(configuration);
  }
}

async function resetFormattingConfiguration(
  configuration: vscode.WorkspaceConfiguration,
): Promise<void> {
  await configuration.update(
    "indentSize",
    undefined,
    vscode.ConfigurationTarget.Global,
  );
  await configuration.update(
    "useTabs",
    undefined,
    vscode.ConfigurationTarget.Global,
  );
}

async function openExpression(content: string): Promise<vscode.TextDocument> {
  const document = await vscode.workspace.openTextDocument({
    language: LANGUAGE_ID,
    content,
  });
  await vscode.window.showTextDocument(document);
  return document;
}
