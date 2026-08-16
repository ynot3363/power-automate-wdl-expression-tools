import * as vscode from "vscode";
import {
  findFunctionCallAtNameOffset,
  getApplicableSignatures,
  wdlFunctionCatalog,
  type WdlFunctionDefinition,
  type WdlFunctionSignature,
} from "../../language";
import type { DocumentAnalysisService } from "../services/documentAnalysisService";

const wdlLanguageId = "power-automate-wdl-expression";

export class WdlHoverProvider implements vscode.HoverProvider {
  public constructor(private readonly analysis: DocumentAnalysisService) {}

  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.Hover | undefined {
    const result = this.analysis.analyzeDocument(document);
    const call = findFunctionCallAtNameOffset(
      result.expression,
      document.offsetAt(position),
    );
    if (call === undefined) {
      return undefined;
    }

    const definition = wdlFunctionCatalog.get(call.name);
    if (definition === undefined) {
      return undefined;
    }

    const applicable = getApplicableSignatures(
      call,
      definition.signatures,
      wdlFunctionCatalog,
    );
    const signatures = applicable.length > 0 ? applicable : definition.signatures;
    const contents = renderHover(definition, signatures);
    return new vscode.Hover(
      contents,
      new vscode.Range(
        document.positionAt(call.nameRange.start),
        document.positionAt(call.nameRange.end),
      ),
    );
  }
}

function renderHover(
  definition: WdlFunctionDefinition,
  signatures: readonly WdlFunctionSignature[],
): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString(undefined, true);
  markdown.isTrusted = false;
  markdown.supportHtml = false;

  markdown.appendMarkdown("$(symbol-function) **");
  markdown.appendText(definition.name);
  markdown.appendMarkdown("** · ");
  markdown.appendText(`${definition.category} function`);
  markdown.appendMarkdown("\n\n");

  for (const signature of signatures) {
    markdown.appendCodeblock(
      formatSignature(definition.name, signature),
      wdlLanguageId,
    );
  }

  const description = deprecatedDescription(definition.description);
  if (description !== undefined) {
    markdown.appendMarkdown("$(warning) **Deprecated**\n\n");
    markdown.appendText(description);
  } else {
    markdown.appendText(definition.description);
  }

  markdown.appendMarkdown("\n\n---\n\n$(symbol-parameter) **Parameters**\n\n");
  const parameters = uniqueParameters(signatures);
  if (parameters.length === 0) {
    markdown.appendMarkdown("_None._");
  } else {
    markdown.appendMarkdown(
      "| Name | Type | Requirement | Description |\n" +
        "| --- | --- | --- | --- |\n",
    );
    for (const parameter of parameters) {
      markdown.appendMarkdown(
        `| \`${escapeInlineCode(parameter.name)}\` | ${formatTypes(parameter.types)} | ${formatRequirement(parameter.required, parameter.variadic)} | ${escapeTableCell(parameter.description ?? "No description available.")} |\n`,
      );
    }
  }

  markdown.appendMarkdown(
    `\n$(arrow-right) **Returns** ${formatTypes(
      [...new Set(signatures.map(({ returnType }) => returnType))],
    )}`,
  );

  if (definition.examples !== undefined && definition.examples.length > 0) {
    const heading = definition.examples.length === 1 ? "Example" : "Examples";
    markdown.appendMarkdown(`\n\n---\n\n$(beaker) **${heading}**\n\n`);
    for (const example of definition.examples) {
      markdown.appendCodeblock(example.expression, wdlLanguageId);
      if (example.description !== undefined) {
        markdown.appendText(example.description);
        markdown.appendMarkdown("\n\n");
      }
      if (example.result !== undefined) {
        markdown.appendMarkdown("**Result**\n\n");
        markdown.appendCodeblock(example.result, "text");
      }
    }
  }

  if (isMicrosoftDocumentationUrl(definition.documentationUrl)) {
    markdown.appendMarkdown(
      `\n\n---\n\n$(link-external) [Microsoft documentation](${definition.documentationUrl})`,
    );
  }

  return markdown;
}

function formatSignature(
  name: string,
  signature: WdlFunctionSignature,
): string {
  const parameters = signature.parameters.map((parameter) => {
    const prefix = parameter.variadic === true ? "..." : "";
    const optional = parameter.required ? "" : "?";
    return `${prefix}${parameter.name}${optional}: ${parameter.types.join(" | ")}`;
  });
  return `${name}(${parameters.join(", ")}): ${signature.returnType}`;
}

function uniqueParameters(signatures: readonly WdlFunctionSignature[]) {
  const parameters = signatures.flatMap(({ parameters: values }) => values);
  return parameters.filter(
    (parameter, index) =>
      parameters.findIndex(({ name }) => name === parameter.name) === index,
  );
}

function formatTypes(types: readonly string[]): string {
  return types.map((type) => `\`${escapeInlineCode(type)}\``).join(" or ");
}

function formatRequirement(
  required: boolean,
  variadic: boolean | undefined,
): string {
  if (variadic === true) {
    return required ? "Required, repeatable" : "Optional, repeatable";
  }
  return required ? "Required" : "Optional";
}

function deprecatedDescription(description: string): string | undefined {
  const prefix = "Deprecated:";
  return description.startsWith(prefix)
    ? description.slice(prefix.length).trimStart()
    : undefined;
}

function isMicrosoftDocumentationUrl(url: string | undefined): url is string {
  if (url === undefined) {
    return false;
  }

  const parsed = new URL(url);
  return parsed.protocol === "https:" && parsed.hostname === "learn.microsoft.com";
}

function escapeInlineCode(value: string): string {
  return value.replaceAll("`", "\\`");
}

function escapeTableCell(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("\r\n", " ")
    .replaceAll("\n", " ");
}
