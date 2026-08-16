import type { ExpressionNode, FunctionCallNode } from "../ast/nodes";
import type { WdlFunctionCatalog } from "../functions/catalog";
import { wdlFunctionCatalog } from "../functions/defaultCatalog";
import type { WdlFunctionSignature } from "../functions/functionDefinition";
import type { Token } from "../lexer/token";
import { WdlParser } from "../parser/wdlParser";
import type { WdlDiagnostic, WdlSemanticDiagnostic } from "./analyzerDiagnostic";
import {
  acceptsArgumentCount,
  areWdlTypesCompatible,
  inferWdlType,
  parameterAt,
} from "./typeInference";
import type { WdlType } from "./wdlTypes";

export interface WdlAnalysisResult {
  readonly expression: ExpressionNode;
  readonly tokens: readonly Token[];
  readonly diagnostics: readonly WdlDiagnostic[];
}

export class WdlAnalyzer {
  public constructor(
    private readonly catalog: WdlFunctionCatalog = wdlFunctionCatalog,
  ) {}

  public analyze(source: string): WdlAnalysisResult {
    const parseResult = new WdlParser(source).parse();
    const semanticDiagnostics: WdlSemanticDiagnostic[] = [];
    this.analyzeExpression(parseResult.expression, semanticDiagnostics);

    return {
      expression: parseResult.expression,
      tokens: parseResult.tokens,
      diagnostics: [...parseResult.diagnostics, ...semanticDiagnostics],
    };
  }

  private analyzeExpression(
    expression: ExpressionNode,
    diagnostics: WdlSemanticDiagnostic[],
  ): void {
    switch (expression.type) {
      case "FunctionCall":
        this.analyzeCall(expression, diagnostics);
        for (const argument of expression.arguments) {
          this.analyzeExpression(argument, diagnostics);
        }
        return;
      case "IndexAccess":
        this.analyzeExpression(expression.target, diagnostics);
        this.analyzeExpression(expression.index, diagnostics);
        return;
      case "PropertyAccess":
        this.analyzeExpression(expression.target, diagnostics);
        this.analyzeExpression(expression.property, diagnostics);
        return;
      case "AtExpression":
      case "ParenthesizedExpression":
        this.analyzeExpression(expression.expression, diagnostics);
        return;
      case "BooleanLiteral":
      case "Identifier":
      case "MissingExpression":
      case "NullLiteral":
      case "NumberLiteral":
      case "StringLiteral":
      case "Unknown":
        return;
    }
  }

  private analyzeCall(
    call: FunctionCallNode,
    diagnostics: WdlSemanticDiagnostic[],
  ): void {
    const definition = this.catalog.get(call.name);
    if (definition === undefined) {
      diagnostics.push({
        code: "WDL1101",
        message: `Unknown function '${call.name}'.`,
        severity: "error",
        range: call.nameRange,
      });
      return;
    }

    if (call.arguments.some(({ type }) => type === "MissingExpression")) {
      return;
    }

    const countCompatible = definition.signatures.filter((signature) =>
      acceptsArgumentCount(signature, call.arguments.length),
    );
    if (countCompatible.length === 0) {
      diagnostics.push({
        code: "WDL1201",
        message: `${definition.name} does not accept ${String(call.arguments.length)} ${pluralizeArgument(call.arguments.length)}. Expected ${describeCounts(definition.signatures)}.`,
        severity: "error",
        range: call.range,
      });
      return;
    }

    call.arguments.forEach((argument, index) => {
      const inference = inferWdlType(argument, this.catalog);
      if (inference.isUnknown) {
        return;
      }

      const acceptedTypes = collectAcceptedTypes(countCompatible, index);
      const hasCompatibleCandidate = inference.types.some((actual) =>
        acceptedTypes.some((expected) =>
          areWdlTypesCompatible(actual, expected),
        ),
      );
      if (!hasCompatibleCandidate) {
        diagnostics.push({
          code: "WDL1301",
          message: `Argument ${String(index + 1)} of ${definition.name} expects ${formatTypes(acceptedTypes)}, but received ${formatTypes(inference.types)}.`,
          severity: "error",
          range: argument.range,
        });
      }
    });
  }
}

function collectAcceptedTypes(
  signatures: readonly WdlFunctionSignature[],
  index: number,
): readonly WdlType[] {
  return [
    ...new Set(
      signatures.flatMap((signature) => parameterAt(signature, index)?.types ?? []),
    ),
  ];
}

function describeCounts(signatures: readonly WdlFunctionSignature[]): string {
  const descriptions = signatures.map((signature) => {
    const minimum = signature.parameters.filter(({ required }) => required).length;
    if (signature.parameters.some(({ variadic }) => variadic)) {
      return `${String(minimum)} or more`;
    }

    const maximum = signature.parameters.length;
    return minimum === maximum
      ? String(minimum)
      : `${String(minimum)}-${String(maximum)}`;
  });
  return [...new Set(descriptions)].join(" or ");
}

function formatTypes(types: readonly WdlType[]): string {
  return [...new Set(types)].join(" or ");
}

function pluralizeArgument(count: number): string {
  return count === 1 ? "argument" : "arguments";
}
