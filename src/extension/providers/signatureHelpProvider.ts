import * as vscode from "vscode";
import {
  findFunctionCallAtArgumentOffset,
  getApplicableSignatures,
  parameterAt,
  wdlFunctionCatalog,
  type WdlFunctionParameter,
  type WdlFunctionSignature,
} from "../../language";
import type { DocumentAnalysisService } from "../services/documentAnalysisService";

export class WdlSignatureHelpProvider implements vscode.SignatureHelpProvider {
  public constructor(private readonly analysis: DocumentAnalysisService) {}

  public provideSignatureHelp(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.SignatureHelp | undefined {
    const result = this.analysis.analyzeDocument(document);
    const context = findFunctionCallAtArgumentOffset(
      result.expression,
      document.offsetAt(position),
    );
    if (context === undefined) {
      return undefined;
    }

    const definition = wdlFunctionCatalog.get(context.call.name);
    if (definition === undefined) {
      return undefined;
    }

    const applicable = getApplicableSignatures(
      context.call,
      definition.signatures,
      wdlFunctionCatalog,
    );
    const signatures = applicable.length > 0 ? applicable : definition.signatures;
    const help = new vscode.SignatureHelp();
    help.signatures = signatures.map((signature) =>
      createSignatureInformation(definition.name, signature),
    );
    help.activeSignature = 0;
    help.activeParameter = activeParameter(
      signatures[0],
      context.argumentIndex,
    );
    return help;
  }
}

function createSignatureInformation(
  name: string,
  signature: WdlFunctionSignature,
): vscode.SignatureInformation {
  const label = formatSignature(name, signature);
  const information = new vscode.SignatureInformation(label);
  information.parameters = signature.parameters.map((parameter) => {
    const parameterInformation = new vscode.ParameterInformation(
      parameterLabel(parameter),
      safeMarkdown(parameter.description ?? "No description available."),
    );
    return parameterInformation;
  });
  return information;
}

function formatSignature(name: string, signature: WdlFunctionSignature): string {
  return `${name}(${signature.parameters.map(parameterLabel).join(", ")}): ${signature.returnType}`;
}

function parameterLabel(parameter: WdlFunctionParameter): string {
  const variadic = parameter.variadic === true ? "..." : "";
  const optional = parameter.required ? "" : "?";
  return `${variadic}${parameter.name}${optional}: ${parameter.types.join(" | ")}`;
}

function activeParameter(
  signature: WdlFunctionSignature | undefined,
  argumentIndex: number,
): number {
  if (signature === undefined || signature.parameters.length === 0) {
    return 0;
  }

  const parameter = parameterAt(signature, argumentIndex);
  return parameter === undefined
    ? signature.parameters.length - 1
    : signature.parameters.indexOf(parameter);
}

function safeMarkdown(value: string): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString(undefined, true);
  markdown.isTrusted = false;
  markdown.supportHtml = false;
  markdown.appendText(value);
  return markdown;
}
