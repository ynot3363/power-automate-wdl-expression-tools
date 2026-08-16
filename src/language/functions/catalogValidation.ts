import { isWdlType } from "../analyzer/wdlTypes";
import {
  wdlFunctionCategories,
  type WdlFunctionDefinition,
} from "./functionDefinition";

export interface WdlCatalogValidationIssue {
  readonly path: string;
  readonly message: string;
}

export class WdlCatalogValidationError extends Error {
  public constructor(public readonly issues: readonly WdlCatalogValidationIssue[]) {
    super(
      `Invalid WDL function catalog:\n${issues
        .map((issue) => `- ${issue.path}: ${issue.message}`)
        .join("\n")}`,
    );
    this.name = "WdlCatalogValidationError";
  }
}

const categorySet: ReadonlySet<unknown> = new Set(wdlFunctionCategories);

export function loadWdlFunctionDefinitions(
  input: unknown,
): readonly WdlFunctionDefinition[] {
  const issues = validateWdlFunctionDefinitions(input);
  if (issues.length > 0) {
    throw new WdlCatalogValidationError(issues);
  }

  return structuredClone(input) as readonly WdlFunctionDefinition[];
}

export function validateWdlFunctionDefinitions(
  input: unknown,
): readonly WdlCatalogValidationIssue[] {
  const issues: WdlCatalogValidationIssue[] = [];
  if (!Array.isArray(input)) {
    return [{ path: "$", message: "Expected an array of function definitions." }];
  }

  const names = new Map<string, number>();
  for (const [definitionIndex, value] of input.entries()) {
    const path = `$[${String(definitionIndex)}]`;
    if (!isRecord(value)) {
      issues.push({ path, message: "Expected a function definition object." });
      continue;
    }

    const name = readNonEmptyString(value.name, `${path}.name`, issues);
    if (name !== undefined) {
      const normalizedName = name.toLocaleLowerCase("en-US");
      const previousIndex = names.get(normalizedName);
      if (previousIndex !== undefined) {
        issues.push({
          path: `${path}.name`,
          message: `Duplicates function name at $[${String(previousIndex)}].name.`,
        });
      } else {
        names.set(normalizedName, definitionIndex);
      }
    }

    if (!categorySet.has(value.category)) {
      issues.push({
        path: `${path}.category`,
        message: "Expected a supported WDL function category.",
      });
    }

    readNonEmptyString(value.description, `${path}.description`, issues);
    validateSignatures(value.signatures, `${path}.signatures`, issues);
    validateExamples(value.examples, `${path}.examples`, issues);
    validateDocumentationUrl(
      value.documentationUrl,
      `${path}.documentationUrl`,
      issues,
    );
  }

  return issues;
}

function validateSignatures(
  value: unknown,
  path: string,
  issues: WdlCatalogValidationIssue[],
): void {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push({ path, message: "Expected at least one function signature." });
    return;
  }

  const signatureKeys = new Map<string, number>();
  for (const [signatureIndex, signature] of value.entries()) {
    const signaturePath = `${path}[${String(signatureIndex)}]`;
    if (!isRecord(signature)) {
      issues.push({ path: signaturePath, message: "Expected a signature object." });
      continue;
    }

    if (!isWdlType(signature.returnType)) {
      issues.push({
        path: `${signaturePath}.returnType`,
        message: "Expected a supported WDL return type.",
      });
    }

    validateParameters(signature.parameters, `${signaturePath}.parameters`, issues);
    const signatureKey = JSON.stringify({
      parameters: signature.parameters,
      returnType: signature.returnType,
    });
    const previousIndex = signatureKeys.get(signatureKey);
    if (previousIndex !== undefined) {
      issues.push({
        path: signaturePath,
        message: `Duplicates signature at ${path}[${String(previousIndex)}].`,
      });
    } else {
      signatureKeys.set(signatureKey, signatureIndex);
    }
  }
}

function validateParameters(
  value: unknown,
  path: string,
  issues: WdlCatalogValidationIssue[],
): void {
  if (!Array.isArray(value)) {
    issues.push({ path, message: "Expected a parameter array." });
    return;
  }

  let encounteredOptional = false;
  let encounteredVariadic = false;
  for (const [parameterIndex, parameter] of value.entries()) {
    const parameterPath = `${path}[${String(parameterIndex)}]`;
    if (!isRecord(parameter)) {
      issues.push({ path: parameterPath, message: "Expected a parameter object." });
      continue;
    }

    readNonEmptyString(parameter.name, `${parameterPath}.name`, issues);
    validateParameterTypes(parameter.types, `${parameterPath}.types`, issues);
    if (typeof parameter.required !== "boolean") {
      issues.push({
        path: `${parameterPath}.required`,
        message: "Expected a boolean required flag.",
      });
    } else if (!parameter.required) {
      encounteredOptional = true;
    } else if (encounteredOptional) {
      issues.push({
        path: `${parameterPath}.required`,
        message: "A required parameter cannot follow an optional parameter.",
      });
    }

    if (
      parameter.variadic !== undefined &&
      typeof parameter.variadic !== "boolean"
    ) {
      issues.push({
        path: `${parameterPath}.variadic`,
        message: "Expected a boolean variadic flag when present.",
      });
    }

    if (parameter.variadic === true) {
      if (encounteredVariadic) {
        issues.push({
          path: `${parameterPath}.variadic`,
          message: "A signature can contain only one variadic parameter.",
        });
      }
      if (parameterIndex !== value.length - 1) {
        issues.push({
          path: `${parameterPath}.variadic`,
          message: "A variadic parameter must be last.",
        });
      }
      encounteredVariadic = true;
    }

    validateOptionalString(
      parameter.description,
      `${parameterPath}.description`,
      issues,
    );
  }
}

function validateParameterTypes(
  value: unknown,
  path: string,
  issues: WdlCatalogValidationIssue[],
): void {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push({ path, message: "Expected at least one supported WDL type." });
    return;
  }

  for (const [typeIndex, type] of value.entries()) {
    if (!isWdlType(type)) {
      issues.push({
        path: `${path}[${String(typeIndex)}]`,
        message: "Expected a supported WDL type.",
      });
    }
  }
}

function validateExamples(
  value: unknown,
  path: string,
  issues: WdlCatalogValidationIssue[],
): void {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    issues.push({ path, message: "Expected an examples array when present." });
    return;
  }

  for (const [exampleIndex, example] of value.entries()) {
    const examplePath = `${path}[${String(exampleIndex)}]`;
    if (!isRecord(example)) {
      issues.push({ path: examplePath, message: "Expected an example object." });
      continue;
    }
    readNonEmptyString(example.expression, `${examplePath}.expression`, issues);
    validateOptionalString(example.result, `${examplePath}.result`, issues);
    validateOptionalString(
      example.description,
      `${examplePath}.description`,
      issues,
    );
  }
}

function validateDocumentationUrl(
  value: unknown,
  path: string,
  issues: WdlCatalogValidationIssue[],
): void {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "string") {
    issues.push({ path, message: "Expected a URL string when present." });
    return;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Unsupported URL protocol.");
    }
  } catch {
    issues.push({ path, message: "Expected a structurally valid HTTP(S) URL." });
  }
}

function readNonEmptyString(
  value: unknown,
  path: string,
  issues: WdlCatalogValidationIssue[],
): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path, message: "Expected a non-empty string." });
    return undefined;
  }
  return value;
}

function validateOptionalString(
  value: unknown,
  path: string,
  issues: WdlCatalogValidationIssue[],
): void {
  if (value !== undefined && (typeof value !== "string" || value.length === 0)) {
    issues.push({ path, message: "Expected a non-empty string when present." });
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
