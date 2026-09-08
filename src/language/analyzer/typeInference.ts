import type { ExpressionNode, FunctionCallNode } from "../ast/nodes";
import type { WdlFunctionCatalog } from "../functions/catalog";
import { wdlFunctionCatalog } from "../functions/defaultCatalog";
import type {
  WdlFunctionParameter,
  WdlFunctionSignature,
} from "../functions/functionDefinition";
import type { WdlType } from "./wdlTypes";

export interface WdlTypeInference {
  readonly types: readonly WdlType[];
  readonly isUnknown: boolean;
}

/** A cache scoped to one catalog and analysis; source nodes are never reused across edits. */
export class WdlTypeInferrer {
  private readonly cache = new WeakMap<ExpressionNode, WdlTypeInference>();

  public constructor(private readonly catalog: WdlFunctionCatalog = wdlFunctionCatalog) {}

  public infer(expression: ExpressionNode): WdlTypeInference {
    const cached = this.cache.get(expression);
    if (cached !== undefined) {
      return cached;
    }
    const result = this.inferExpression(expression);
    this.cache.set(expression, result);
    return result;
  }

  public getApplicableSignatures(
    call: FunctionCallNode,
    signatures: readonly WdlFunctionSignature[],
  ): readonly WdlFunctionSignature[] {
    return signatures.filter((signature) => {
      if (!acceptsArgumentCount(signature, call.arguments.length)) {
        return false;
      }

      return call.arguments.every((argument, index) => {
        const parameter = parameterAt(signature, index);
        if (parameter === undefined) {
          return false;
        }

        const inference = this.infer(argument);
        return inference.types.some((actual) =>
          parameter.types.some((expected) => areWdlTypesCompatible(actual, expected)),
        );
      });
    });
  }

  private inferExpression(expression: ExpressionNode): WdlTypeInference {
    switch (expression.type) {
      case "StringLiteral":
        return known("string");
      case "NumberLiteral":
        return known(expression.numberKind);
      case "BooleanLiteral":
        return known("boolean");
      case "NullLiteral":
        return known("null");
      case "FunctionCall":
        return this.inferFunctionCall(expression);
      case "AtExpression":
      case "ParenthesizedExpression":
        return this.infer(expression.expression);
      case "Identifier":
      case "IndexAccess":
      case "MissingExpression":
      case "PropertyAccess":
      case "Unknown":
        return unknown();
    }
  }

  private inferFunctionCall(call: FunctionCallNode): WdlTypeInference {
    if (call.arguments.some(({ type }) => type === "MissingExpression")) {
      return unknown();
    }

    const definition = this.catalog.get(call.name);
    if (definition === undefined) {
      return unknown();
    }

    const applicable = this.getApplicableSignatures(call, definition.signatures);
    const candidates = applicable.length > 0 ? applicable : definition.signatures;
    const types = [...new Set(candidates.map(({ returnType }) => returnType))];
    return {
      types,
      isUnknown: types.some((type) => type === "any" || type === "unknown"),
    };
  }
}

export function inferWdlType(
  expression: ExpressionNode,
  catalog: WdlFunctionCatalog = wdlFunctionCatalog,
): WdlTypeInference {
  return new WdlTypeInferrer(catalog).infer(expression);
}

export function getApplicableSignatures(
  call: FunctionCallNode,
  signatures: readonly WdlFunctionSignature[],
  catalog: WdlFunctionCatalog = wdlFunctionCatalog,
): readonly WdlFunctionSignature[] {
  return new WdlTypeInferrer(catalog).getApplicableSignatures(call, signatures);
}

export function acceptsArgumentCount(
  signature: WdlFunctionSignature,
  count: number,
): boolean {
  const minimum = signature.parameters.filter(({ required }) => required).length;
  const maximum = signature.parameters.some(({ variadic }) => variadic)
    ? Number.POSITIVE_INFINITY
    : signature.parameters.length;
  return count >= minimum && count <= maximum;
}

export function parameterAt(
  signature: WdlFunctionSignature,
  index: number,
): WdlFunctionParameter | undefined {
  const direct = signature.parameters[index];
  if (direct !== undefined) {
    return direct;
  }

  const last = signature.parameters.at(-1);
  return last?.variadic === true ? last : undefined;
}

export function areWdlTypesCompatible(actual: WdlType, expected: WdlType): boolean {
  if (
    actual === expected ||
    actual === "any" ||
    actual === "unknown" ||
    expected === "any" ||
    expected === "unknown"
  ) {
    return true;
  }

  return isNumeric(actual) && isNumeric(expected);
}

function known(type: WdlType): WdlTypeInference {
  return { types: [type], isUnknown: false };
}

function unknown(): WdlTypeInference {
  return { types: ["unknown"], isUnknown: true };
}

function isNumeric(type: WdlType): boolean {
  return type === "integer" || type === "float" || type === "number";
}
