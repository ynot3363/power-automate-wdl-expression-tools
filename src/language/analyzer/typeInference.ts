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

export function inferWdlType(
  expression: ExpressionNode,
  catalog: WdlFunctionCatalog = wdlFunctionCatalog,
): WdlTypeInference {
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
      return inferFunctionCall(expression, catalog);
    case "AtExpression":
    case "ParenthesizedExpression":
      return inferWdlType(expression.expression, catalog);
    case "Identifier":
    case "IndexAccess":
    case "MissingExpression":
    case "PropertyAccess":
    case "Unknown":
      return unknown();
  }
}

export function getApplicableSignatures(
  call: FunctionCallNode,
  signatures: readonly WdlFunctionSignature[],
  catalog: WdlFunctionCatalog = wdlFunctionCatalog,
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

      const inference = inferWdlType(argument, catalog);
      return inference.types.some((actual) =>
        parameter.types.some((expected) => areWdlTypesCompatible(actual, expected)),
      );
    });
  });
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

function inferFunctionCall(
  call: FunctionCallNode,
  catalog: WdlFunctionCatalog,
): WdlTypeInference {
  if (call.arguments.some(({ type }) => type === "MissingExpression")) {
    return unknown();
  }

  const definition = catalog.get(call.name);
  if (definition === undefined) {
    return unknown();
  }

  const applicable = getApplicableSignatures(call, definition.signatures, catalog);
  const candidates = applicable.length > 0 ? applicable : definition.signatures;
  const types = [...new Set(candidates.map(({ returnType }) => returnType))];
  return {
    types,
    isUnknown: types.some((type) => type === "any" || type === "unknown"),
  };
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
