import * as vscode from "vscode";
import {
  getWdlFunctionCompletionContext,
  wdlFunctionCatalog,
  type WdlFunctionDefinition,
  type WdlFunctionParameter,
  type WdlFunctionSignature,
} from "../../language";
import type { DocumentAnalysisService } from "../services/documentAnalysisService";

export class WdlCompletionProvider implements vscode.CompletionItemProvider {
  public constructor(private readonly analysis: DocumentAnalysisService) {}

  public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.CompletionList {
    const result = this.analysis.analyzeDocument(document);
    const context = getWdlFunctionCompletionContext(
      result.tokens,
      document.offsetAt(position),
    );
    if (context === undefined) {
      return new vscode.CompletionList([], false);
    }

    const replacementRange = new vscode.Range(
      document.positionAt(context.replacementRange.start),
      document.positionAt(context.replacementRange.end),
    );
    const items = wdlFunctionCatalog.matchPrefix(context.prefix).map((definition) =>
      createCompletionItem(definition, replacementRange),
    );
    return new vscode.CompletionList(items, false);
  }
}

function createCompletionItem(
  definition: WdlFunctionDefinition,
  replacementRange: vscode.Range,
): vscode.CompletionItem {
  const signature = definition.signatures[0];
  const item = new vscode.CompletionItem(
    definition.name,
    vscode.CompletionItemKind.Function,
  );
  item.detail = `${definition.category} function — ${definition.signatures
    .map((candidate) => formatSignature(definition.name, candidate))
    .join(" | ")}`;
  item.documentation = completionDocumentation(definition);
  item.filterText = definition.name;
  item.insertText = createSnippet(definition.name, signature);
  item.range = replacementRange;
  item.sortText = definition.name.toLocaleLowerCase("en-US");
  return item;
}

function createSnippet(
  name: string,
  signature: WdlFunctionSignature | undefined,
): vscode.SnippetString {
  const snippet = new vscode.SnippetString();
  snippet.appendText(`${name}(`);
  signature?.parameters.forEach((parameter, index) => {
    if (index > 0) {
      snippet.appendText(", ");
    }
    snippet.appendPlaceholder(parameter.name, index + 1);
  });
  snippet.appendText(")");
  snippet.appendTabstop(0);
  return snippet;
}

function formatSignature(name: string, signature: WdlFunctionSignature): string {
  return `${name}(${signature.parameters.map(formatParameter).join(", ")}): ${signature.returnType}`;
}

function formatParameter(parameter: WdlFunctionParameter): string {
  const variadic = parameter.variadic === true ? "..." : "";
  const optional = parameter.required ? "" : "?";
  return `${variadic}${parameter.name}${optional}: ${parameter.types.join(" | ")}`;
}

function completionDocumentation(
  definition: WdlFunctionDefinition,
): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString(undefined, true);
  markdown.isTrusted = false;
  markdown.supportHtml = false;
  markdown.appendText(definition.description);
  if (isMicrosoftDocumentationUrl(definition.documentationUrl)) {
    markdown.appendMarkdown(
      `\n\n[Microsoft documentation](${definition.documentationUrl})`,
    );
  }
  return markdown;
}

function isMicrosoftDocumentationUrl(url: string | undefined): url is string {
  if (url === undefined) {
    return false;
  }
  const parsed = new URL(url);
  return parsed.protocol === "https:" && parsed.hostname === "learn.microsoft.com";
}
