import { equal, ok } from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as vscode from "vscode";

const EXTENSION_ID = "aepcodes.power-automate-wdl-expression-tools";
const LANGUAGE_ID = "power-automate-wdl-expression";
const NEW_EXPRESSION_COMMAND_ID =
  "powerAutomateWdlExpressions.newExpression";
const FORMAT_EXPRESSION_COMMAND_ID =
  "powerAutomateWdlExpressions.formatExpression";
const MINIFY_EXPRESSION_COMMAND_ID =
  "powerAutomateWdlExpressions.minifyExpression";

export async function run(): Promise<void> {
  const extension = vscode.extensions.getExtension(EXTENSION_ID);

  ok(extension, "The extension should be discoverable in the host.");
  await extension.activate();
  equal(extension.isActive, true, "The extension should activate.");

  const fixtureDirectory = await mkdtemp(join(tmpdir(), "wdlexpr-test-"));
  try {
    await runScenario("manifest, language, and command registration", async () => {
      await verifyManifestAndRegistration(extension, fixtureDirectory);
    });
    await runScenario("format and minify utility commands", async () => {
      await verifyUtilityCommands(fixtureDirectory);
    });
    await runScenario("native document and selection formatting", verifyFormatting);
    await runScenario("catalog-backed hover", verifyHover);
    await runScenario("nested signature help", verifySignatureHelp);
    await runScenario("catalog-backed completion", verifyCompletion);
    await runScenario("diagnostics and document lifecycle", verifyDiagnostics);
    await runScenario("commands without an active editor", verifyNoEditorCommands);
  } finally {
    await resetExtensionTestState();
    await rm(fixtureDirectory, { force: true, recursive: true });
  }

  equal(
    vscode.window.activeTextEditor,
    undefined,
    "The integration suite should leave no active editor state.",
  );
}

async function verifyManifestAndRegistration(
  extension: vscode.Extension<unknown>,
  fixtureDirectory: string,
): Promise<void> {

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
  equal(
    packageJson.contributes.configuration.properties[
      "powerAutomateWdlExpressions.diagnostics.enabled"
    ]?.default,
    true,
    "Diagnostics should be enabled by default.",
  );

  const languages = await vscode.languages.getLanguages();
  ok(languages.includes(LANGUAGE_ID), "The WDL language should be registered.");

  const commands = await vscode.commands.getCommands(true);
  ok(
    commands.includes(NEW_EXPRESSION_COMMAND_ID),
    "The new-expression command should be registered.",
  );
  ok(
    commands.includes(FORMAT_EXPRESSION_COMMAND_ID),
    "The format-expression command should be registered.",
  );
  ok(
    commands.includes(MINIFY_EXPRESSION_COMMAND_ID),
    "The minify-expression command should be registered.",
  );

  const fixturePath = join(fixtureDirectory, "automatic.wdlexpr");
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
}

async function verifyUtilityCommands(fixtureDirectory: string): Promise<void> {
  const source = "if(equals(1,1),'yes','no')";
  const undoFixturePath = join(fixtureDirectory, "undo.wdlexpr");
  await writeFile(undoFixturePath, source, "utf8");
  const formatDocument = await vscode.workspace.openTextDocument(undoFixturePath);
  await vscode.window.showTextDocument(formatDocument);
  await vscode.commands.executeCommand(FORMAT_EXPRESSION_COMMAND_ID);
  equal(
    formatDocument.getText(),
    "if(\n    equals(1, 1),\n    'yes',\n    'no'\n)",
    "The format command should transform a complete document.",
  );
  equal(
    formatDocument.isDirty,
    true,
    "The format command should apply a normal unsaved editor edit.",
  );

  const configuration = vscode.workspace.getConfiguration(
    "powerAutomateWdlExpressions.format",
  );
  try {
    await configuration.update(
      "indentSize",
      2,
      vscode.ConfigurationTarget.Global,
    );
    await vscode.commands.executeCommand(FORMAT_EXPRESSION_COMMAND_ID);
    equal(
      formatDocument.getText(),
      "if(\n  equals(1, 1),\n  'yes',\n  'no'\n)",
      "The format command should share configured provider indentation.",
    );
  } finally {
    await resetFormattingConfiguration(configuration);
  }

  const selectionDocument = await openExpression(
    "concat('left','right')\nif(equals(1,1),'yes','no')",
  );
  const selectionEditor = vscode.window.activeTextEditor;
  ok(selectionEditor, "The selection command fixture should have an editor.");
  selectionEditor.selection = new vscode.Selection(
    selectionDocument.lineAt(1).range.start,
    selectionDocument.lineAt(1).range.end,
  );
  await vscode.commands.executeCommand(FORMAT_EXPRESSION_COMMAND_ID);
  equal(
    selectionDocument.getText(),
    "concat('left','right')\nif(\n    equals(1, 1),\n    'yes',\n    'no'\n)",
    "The format command should transform only the selected expression.",
  );

  const multiline =
    "if(\n    equals(\n        variables('Name'),\n        ''\n    ),\n    'Unknown',\n    variables('Name')\n)";
  const minifyDocument = await openExpression(multiline);
  await vscode.commands.executeCommand(MINIFY_EXPRESSION_COMMAND_ID);
  equal(
    minifyDocument.getText(),
    "if(equals(variables('Name'),''),'Unknown',variables('Name'))",
    "The minify command should use compact AST output.",
  );

  const incompleteDocument = await openExpression("concat('value',");
  await vscode.commands.executeCommand(MINIFY_EXPRESSION_COMMAND_ID);
  equal(
    incompleteDocument.getText(),
    "concat('value',",
    "Unsafe incomplete input should remain unchanged.",
  );

  const unsupportedDocument = await vscode.workspace.openTextDocument({
    language: "plaintext",
    content: "if(equals(1,1),'yes','no')",
  });
  await vscode.window.showTextDocument(unsupportedDocument);
  await vscode.commands.executeCommand(FORMAT_EXPRESSION_COMMAND_ID);
  equal(
    unsupportedDocument.getText(),
    "if(equals(1,1),'yes','no')",
    "Unsupported language documents should remain unchanged.",
  );

  const multiSelectionDocument = await openExpression(source);
  const multiSelectionEditor = vscode.window.activeTextEditor;
  ok(multiSelectionEditor, "The multi-selection fixture should have an editor.");
  multiSelectionEditor.selections = [
    new vscode.Selection(0, 0, 0, 0),
    new vscode.Selection(0, 3, 0, 3),
  ];
  await vscode.commands.executeCommand(FORMAT_EXPRESSION_COMMAND_ID);
  equal(
    multiSelectionDocument.getText(),
    source,
    "Multiple unrelated selections should remain unchanged.",
  );

}

async function verifyNoEditorCommands(): Promise<void> {
  await closeAllActiveEditors();
  assertNoActiveEditor();
  await vscode.commands.executeCommand(FORMAT_EXPRESSION_COMMAND_ID);
  await vscode.commands.executeCommand(MINIFY_EXPRESSION_COMMAND_ID);
}

function assertNoActiveEditor(): void {
  equal(
    vscode.window.activeTextEditor,
    undefined,
    "The no-editor command fixture should start without an active editor.",
  );
}

async function verifyFormatting(): Promise<void> {
  const configuration = vscode.workspace.getConfiguration(
    "powerAutomateWdlExpressions.format",
  );
  try {
    const defaultDocument = await openExpression(
      "if(equals(1,1),'yes','no')",
    );
    await applyDocumentFormatting(defaultDocument);
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
    await applyDocumentFormatting(configuredDocument);
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
    await applyDocumentFormatting(tabDocument);
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
    await applyRangeFormatting(selectionDocument, editor.selection);
    equal(
      selectionDocument.getText(),
      "concat('left','right')\nif(\n    equals(1, 1),\n    'yes',\n    'no'\n)",
      "Format Selection should replace one complete selected expression.",
    );

    const incompleteDocument = await openExpression("concat('left', 'right')");
    const incompleteEditor = vscode.window.activeTextEditor;
    ok(incompleteEditor, "The incomplete selection fixture should have an editor.");
    incompleteEditor.selection = new vscode.Selection(0, 0, 0, 14);
    await applyRangeFormatting(incompleteDocument, incompleteEditor.selection);
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

async function applyDocumentFormatting(
  document: vscode.TextDocument,
): Promise<void> {
  const edits =
    (await vscode.commands.executeCommand<readonly vscode.TextEdit[] | undefined>(
      "vscode.executeFormatDocumentProvider",
      document.uri,
      { insertSpaces: true, tabSize: 4 },
    )) ?? [];
  await applyFormattingEdits(document, edits);
}

async function applyRangeFormatting(
  document: vscode.TextDocument,
  range: vscode.Range,
): Promise<void> {
  const edits =
    (await vscode.commands.executeCommand<readonly vscode.TextEdit[] | undefined>(
      "vscode.executeFormatRangeProvider",
      document.uri,
      range,
      { insertSpaces: true, tabSize: 4 },
    )) ?? [];
  await applyFormattingEdits(document, edits);
}

async function applyFormattingEdits(
  document: vscode.TextDocument,
  edits: readonly vscode.TextEdit[],
): Promise<void> {
  if (edits.length === 0) {
    return;
  }
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.set(document.uri, edits);
  equal(
    await vscode.workspace.applyEdit(workspaceEdit),
    true,
    "Formatting provider edits should apply.",
  );
}

async function verifyHover(): Promise<void> {
  const knownDocument = await openExpression("concat('left', 'right')");
  const knownHovers = await executeHovers(knownDocument, new vscode.Position(0, 1));
  equal(knownHovers.length, 1, "A known function name should provide hover help.");
  const knownMarkdown = hoverMarkdown(knownHovers[0]);
  ok(knownMarkdown.includes("concat("), "Hover should include the signature.");
  ok(
    knownMarkdown.includes("Combines"),
    `Hover should include the description. Rendered: ${knownMarkdown}`,
  );
  ok(knownMarkdown.includes("additionalText"), "Hover should include parameter help.");
  ok(knownMarkdown.includes("Returns"), "Hover should include the return type.");
  ok(knownMarkdown.includes("Hello world"), "Hover should include an example result.");
  ok(knownMarkdown.includes("learn.microsoft.com"), "Hover should link to Microsoft documentation.");
  const markdownContent = knownHovers[0]?.contents.find(
    (content): content is vscode.MarkdownString =>
      content instanceof vscode.MarkdownString,
  );
  equal(markdownContent?.isTrusted, false, "Hover Markdown must not be trusted.");

  const nestedDocument = await openExpression(
    "if(equals(1, 1), toLower('YES'), 'no')",
  );
  const nestedHovers = await executeHovers(
    nestedDocument,
    new vscode.Position(0, 20),
  );
  ok(
    hoverMarkdown(nestedHovers[0]).includes("toLower("),
    "Nested hover should select the innermost function name.",
  );

  const boundaryHovers = await executeHovers(
    knownDocument,
    new vscode.Position(0, "concat".length),
  );
  equal(boundaryHovers.length, 0, "The name's exclusive end should not own hover.");

  const unknownDocument = await openExpression("mystery('value')");
  equal(
    (await executeHovers(unknownDocument, new vscode.Position(0, 2))).length,
    0,
    "Unknown functions should not provide hover help.",
  );

  const escapedDocument = await openExpression("concat('toLower(''x'')', 'y')");
  equal(
    (
      await executeHovers(
        escapedDocument,
        new vscode.Position(0, escapedDocument.getText().indexOf("toLower") + 1),
      )
    ).length,
    0,
    "Function-like text inside an escaped string should not provide hover help.",
  );

  const incompleteDocument = await openExpression("substring(");
  equal(
    (await executeHovers(incompleteDocument, new vscode.Position(0, 3))).length,
    1,
    "Incomplete known calls should still provide hover help on the name.",
  );
}

async function executeHovers(
  document: vscode.TextDocument,
  position: vscode.Position,
): Promise<readonly vscode.Hover[]> {
  return (
    (await vscode.commands.executeCommand<readonly vscode.Hover[] | undefined>(
      "vscode.executeHoverProvider",
      document.uri,
      position,
    )) ?? []
  );
}

function hoverMarkdown(hover: vscode.Hover | undefined): string {
  ok(hover, "Expected a hover result.");
  return hover.contents
    .map((content) =>
      content instanceof vscode.MarkdownString
        ? content.value
        : typeof content === "string"
          ? content
          : "",
    )
    .join("\n");
}

async function verifySignatureHelp(): Promise<void> {
  const firstDocument = await openExpression("concat(");
  const first = await executeSignatureHelp(
    firstDocument,
    firstDocument.positionAt(firstDocument.getText().length),
  );
  ok(first, "A known incomplete call should provide signature help.");
  ok(first.signatures[0]?.label.startsWith("concat("));
  equal(first.activeParameter, 0, "The first argument should be active after '('.");
  ok(
    signatureParameterDocumentation(first.signatures[0]?.parameters[0]).includes(
      "first",
    ),
    "Signature help should include parameter documentation.",
  );

  const middleDocument = await openExpression("if(true, 'yes', 'no')");
  const middle = await executeSignatureHelp(
    middleDocument,
    middleDocument.positionAt(middleDocument.getText().indexOf("'yes'")),
  );
  equal(middle?.activeParameter, 1, "The middle argument should be active.");

  const nestedDocument = await openExpression("if(equals(1, ");
  const nested = await executeSignatureHelp(
    nestedDocument,
    nestedDocument.positionAt(nestedDocument.getText().length),
  );
  ok(nested, "The incomplete nested call should provide signature help.");
  ok(
    nested.signatures[0]?.label.startsWith("equals("),
    "An inner cursor should report equals rather than its enclosing if call.",
  );
  equal(nested.activeParameter, 1, "The second equals argument should be active.");

  const optionalDocument = await openExpression(
    "substring(\n  'abc',\n  1,\n  )",
  );
  const optional = await executeSignatureHelp(
    optionalDocument,
    optionalDocument.positionAt(optionalDocument.getText().lastIndexOf(")")),
  );
  equal(optional?.activeParameter, 2, "The optional length argument should be active.");

  const overloadedDocument = await openExpression("first('abc')");
  const overloaded = await executeSignatureHelp(
    overloadedDocument,
    overloadedDocument.positionAt(overloadedDocument.getText().indexOf("abc")),
  );
  equal(overloaded?.signatures.length, 1, "A known literal should narrow overloads.");
  ok(overloaded.signatures[0]?.label.includes("collection: string"));

  const variadicDocument = await openExpression("concat('a', 'b', 'c')");
  const variadic = await executeSignatureHelp(
    variadicDocument,
    variadicDocument.positionAt(variadicDocument.getText().indexOf("'c'")),
  );
  equal(
    variadic?.activeParameter,
    1,
    "Variadic arguments should stay on the final declared parameter.",
  );

  const unknownDocument = await openExpression("mystery(");
  equal(
    await executeSignatureHelp(
      unknownDocument,
      unknownDocument.positionAt(unknownDocument.getText().length),
    ),
    undefined,
    "Unknown calls should not provide signature help.",
  );

  const outsideDocument = await openExpression("concat('a', 'b')");
  equal(
    await executeSignatureHelp(outsideDocument, new vscode.Position(0, 1)),
    undefined,
    "Positions outside a call's arguments should not provide signature help.",
  );
}

async function executeSignatureHelp(
  document: vscode.TextDocument,
  position: vscode.Position,
): Promise<vscode.SignatureHelp | undefined> {
  return vscode.commands.executeCommand<vscode.SignatureHelp | undefined>(
    "vscode.executeSignatureHelpProvider",
    document.uri,
    position,
  );
}

function signatureParameterDocumentation(
  parameter: vscode.ParameterInformation | undefined,
): string {
  const documentation = parameter?.documentation;
  if (documentation === undefined) {
    return "";
  }
  return typeof documentation === "string" ? documentation : documentation.value;
}

async function verifyCompletion(): Promise<void> {
  const prefixDocument = await openExpression("sub");
  const prefixItems = await executeCompletion(
    prefixDocument,
    prefixDocument.positionAt(prefixDocument.getText().length),
  );
  const prefixLabels = prefixItems.map(completionLabel);
  equal(new Set(prefixLabels).size, prefixLabels.length, "Completion labels must be unique.");
  ok(prefixLabels.includes("sub"), "The 'sub' prefix should include sub.");
  ok(prefixLabels.includes("substring"), "The 'sub' prefix should include substring.");
  ok(
    prefixLabels.includes("subtractFromTime"),
    "The 'sub' prefix should include subtractFromTime.",
  );

  const substringItem = prefixItems.find(
    (item) => completionLabel(item) === "substring",
  );
  ok(substringItem, "Expected a substring completion item.");
  ok(substringItem.detail?.includes("String function"), "Completion should show its category.");
  ok(
    substringItem.detail?.includes("length?"),
    "Completion should show signature details.",
  );
  ok(
    completionDocumentation(substringItem).includes("learn.microsoft.com"),
    "Completion should include Microsoft documentation.",
  );
  equal(
    completionSnippet(substringItem),
    "substring(${1:text}, ${2:startIndex}, ${3:length})$0",
    "Optional parameters should have ordered snippet tab stops.",
  );

  const concatItem = (
    await executeCompletion(await openExpression("con"), new vscode.Position(0, 3))
  ).find((item) => completionLabel(item) === "concat");
  ok(concatItem, "Expected a concat completion item.");
  equal(
    completionSnippet(concatItem),
    "concat(${1:text}, ${2:additionalText})$0",
    "Variadic signatures should insert one predictable variadic placeholder.",
  );

  const firstItem = (
    await executeCompletion(await openExpression("fir"), new vscode.Position(0, 3))
  ).find((item) => completionLabel(item) === "first");
  ok(firstItem, "Expected a first completion item.");
  equal(
    completionSnippet(firstItem),
    "first(${1:collection})$0",
    "Overloads should use the first catalog signature deterministically.",
  );

  const emptyItems = await executeCompletion(
    await openExpression(""),
    new vscode.Position(0, 0),
  );
  ok(emptyItems.length > prefixItems.length, "An empty root prefix should expose the catalog.");
  ok(
    !emptyItems.map(completionLabel).includes("Get_User"),
    "Completion should not invent flow-context values.",
  );

  const incompleteDocument = await openExpression("if(true, sub");
  ok(
    (
      await executeCompletion(
        incompleteDocument,
        incompleteDocument.positionAt(incompleteDocument.getText().length),
      )
    )
      .map(completionLabel)
      .includes("substring"),
    "Completion should work in an incomplete argument position.",
  );

  const stringDocument = await openExpression("'sub'");
  equal(
    (
      await executeCompletion(stringDocument, new vscode.Position(0, 2))
    ).length,
    0,
    "Completion should not appear inside strings.",
  );

  const propertyDocument = await openExpression("variables('x').sub");
  equal(
    (
      await executeCompletion(
        propertyDocument,
        propertyDocument.positionAt(propertyDocument.getText().length),
      )
    ).length,
    0,
    "Completion should not appear for access properties.",
  );
}

async function executeCompletion(
  document: vscode.TextDocument,
  position: vscode.Position,
): Promise<readonly vscode.CompletionItem[]> {
  const result = await vscode.commands.executeCommand<vscode.CompletionList>(
    "vscode.executeCompletionItemProvider",
    document.uri,
    position,
  );
  return result.items.filter(({ detail }) => detail?.includes(" function — "));
}

function completionLabel(item: vscode.CompletionItem): string {
  return typeof item.label === "string" ? item.label : item.label.label;
}

function completionDocumentation(item: vscode.CompletionItem): string {
  const documentation = item.documentation;
  if (documentation === undefined) {
    return "";
  }
  return typeof documentation === "string" ? documentation : documentation.value;
}

function completionSnippet(item: vscode.CompletionItem): string | undefined {
  return item.insertText instanceof vscode.SnippetString
    ? item.insertText.value
    : undefined;
}

async function verifyDiagnostics(): Promise<void> {
  const invalidSource =
    "if(mystery(), substring(true, 'start'), toLower())";
  const invalidDocument = await openExpression(invalidSource);
  const invalidDiagnostics = await waitForDiagnostics(
    invalidDocument.uri,
    (values) => values.length === 4,
    "Expected semantic diagnostics for the complete invalid expression.",
  );
  equal(
    invalidDiagnostics.map(diagnosticCode).join(","),
    "WDL1101,WDL1301,WDL1301,WDL1201",
    "Problems should preserve stable engine diagnostic codes.",
  );
  const unknownFunction = invalidDiagnostics[0];
  ok(unknownFunction, "Expected an unknown-function diagnostic.");
  equal(unknownFunction.severity, vscode.DiagnosticSeverity.Error);
  equal(unknownFunction.source, "Power Automate WDL");
  equal(
    invalidDocument.getText(unknownFunction.range),
    "mystery",
    "Diagnostic offsets should map to the exact editor range.",
  );

  const incompleteDocument = await openExpression("concat('a',");
  const incompleteDiagnostics = await waitForDiagnostics(
    incompleteDocument.uri,
    (values) => values.length === 2,
    "Expected parser diagnostics for ordinary incomplete input.",
  );
  ok(
    incompleteDiagnostics.every((diagnostic) =>
      diagnosticCode(diagnostic).startsWith("WDL100"),
    ),
    "Incomplete input should retain parser diagnostics without semantic cascades.",
  );

  const conservativeDocument = await openExpression(
    "toLower(variables('runtime'))",
  );
  await delay(250);
  equal(
    vscode.languages.getDiagnostics(conservativeDocument.uri).length,
    0,
    "Unknown runtime values should not cause speculative type diagnostics.",
  );

  const debounceDocument = await openExpression("concat('a', 'b')");
  await replaceDocument(debounceDocument, "mystery()");
  await delay(50);
  equal(
    vscode.languages.getDiagnostics(debounceDocument.uri).length,
    0,
    "Changes should wait for the documented debounce before publishing.",
  );
  await waitForDiagnostics(
    debounceDocument.uri,
    (values) => values.some((diagnostic) => diagnosticCode(diagnostic) === "WDL1101"),
    "Expected the debounced unknown-function diagnostic.",
  );

  await replaceDocument(debounceDocument, "toLower(true)");
  await replaceDocument(debounceDocument, "concat('a', 'b')");
  await waitForDiagnostics(
    debounceDocument.uri,
    (values) => values.length === 0,
    "The final document version should clear stale scheduled diagnostics.",
  );

  const diagnosticConfiguration = vscode.workspace.getConfiguration(
    "powerAutomateWdlExpressions.diagnostics",
  );
  try {
    await diagnosticConfiguration.update(
      "enabled",
      false,
      vscode.ConfigurationTarget.Global,
    );
    await waitForDiagnostics(
      invalidDocument.uri,
      (values) => values.length === 0,
      "Disabling diagnostics should clear published Problems.",
    );
    await replaceDocument(invalidDocument, "anotherMystery()");
    await delay(250);
    equal(
      vscode.languages.getDiagnostics(invalidDocument.uri).length,
      0,
      "Disabled diagnostics should remain clear after edits.",
    );
  } finally {
    await diagnosticConfiguration.update(
      "enabled",
      undefined,
      vscode.ConfigurationTarget.Global,
    );
  }
  await waitForDiagnostics(
    invalidDocument.uri,
    (values) => values.some((diagnostic) => diagnosticCode(diagnostic) === "WDL1101"),
    "Re-enabling diagnostics should analyze open WDL documents.",
  );

  const languageDocument = await openExpression("mystery()");
  await waitForDiagnostics(
    languageDocument.uri,
    (values) => values.length === 1,
    "Expected diagnostics before changing the document language.",
  );
  await vscode.languages.setTextDocumentLanguage(languageDocument, "plaintext");
  await waitForDiagnostics(
    languageDocument.uri,
    (values) => values.length === 0,
    "Changing away from WDL should clear diagnostics.",
  );

  const closeDocument = await openExpression("mystery()");
  equal(
    vscode.window.activeTextEditor?.document.uri.toString(),
    closeDocument.uri.toString(),
    "The close lifecycle fixture should be the active editor.",
  );
  await waitForDiagnostics(
    closeDocument.uri,
    (values) => values.length === 1,
    "Expected diagnostics before closing the document.",
  );
  await vscode.commands.executeCommand(
    "workbench.action.revertAndCloseActiveEditor",
  );
  await waitForDiagnostics(
    closeDocument.uri,
    (values) => values.length === 0,
    "Closing a WDL document should clear its diagnostics.",
  );
}

function diagnosticCode(diagnostic: Pick<vscode.Diagnostic, "code">): string {
  const code = diagnostic.code;
  if (code === undefined) {
    return "";
  }
  return typeof code === "object" ? String(code.value) : String(code);
}

async function replaceDocument(
  document: vscode.TextDocument,
  content: string,
): Promise<void> {
  const edit = new vscode.WorkspaceEdit();
  edit.replace(
    document.uri,
    new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length),
    ),
    content,
  );
  equal(await vscode.workspace.applyEdit(edit), true, "The test edit should apply.");
}

async function waitForDiagnostics(
  uri: vscode.Uri,
  predicate: (diagnostics: readonly vscode.Diagnostic[]) => boolean,
  message: string,
): Promise<readonly vscode.Diagnostic[]> {
  const timeoutAt = Date.now() + 2_000;
  while (Date.now() < timeoutAt) {
    const diagnostics = vscode.languages.getDiagnostics(uri);
    if (predicate(diagnostics)) {
      return diagnostics;
    }
    await delay(25);
  }
  throw new Error(message);
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function runScenario(
  name: string,
  scenario: () => Promise<void>,
): Promise<void> {
  process.stdout.write(`\n[extension integration] ${name}\n`);
  try {
    await scenario();
    process.stdout.write(`[extension integration] passed: ${name}\n`);
  } catch (error: unknown) {
    const detail =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    throw new Error(
      `Extension integration scenario failed: ${name}\n${detail}`,
      { cause: error },
    );
  } finally {
    await resetExtensionTestState();
  }
}

async function resetExtensionTestState(): Promise<void> {
  const formatting = vscode.workspace.getConfiguration(
    "powerAutomateWdlExpressions.format",
  );
  await resetFormattingConfiguration(formatting);
  await vscode.workspace
    .getConfiguration("powerAutomateWdlExpressions.diagnostics")
    .update("enabled", undefined, vscode.ConfigurationTarget.Global);

  await closeAllActiveEditors();
}

async function closeAllActiveEditors(): Promise<void> {
  for (let remainingEditors = 100; remainingEditors > 0; remainingEditors -= 1) {
    if (vscode.window.activeTextEditor === undefined) {
      return;
    }
    await vscode.commands.executeCommand(
      "workbench.action.revertAndCloseActiveEditor",
    );
  }

  throw new Error("Unable to close all integration-test editors.");
}
