import type { WdlType } from "../analyzer/wdlTypes";

export const wdlFunctionCategories = [
  "String",
  "Collection",
  "Logical",
  "Conversion",
  "Math",
  "DateTime",
  "Workflow",
  "URI",
  "JSON/XML",
] as const;

export type WdlFunctionCategory = (typeof wdlFunctionCategories)[number];

export interface WdlFunctionParameter {
  readonly name: string;
  readonly types: readonly WdlType[];
  readonly required: boolean;
  readonly variadic?: boolean;
  readonly description?: string;
}

export interface WdlFunctionSignature {
  readonly parameters: readonly WdlFunctionParameter[];
  readonly returnType: WdlType;
}

export interface WdlFunctionExample {
  readonly expression: string;
  readonly result?: string;
  readonly description?: string;
}

export interface WdlFunctionDefinition {
  readonly name: string;
  readonly category: WdlFunctionCategory;
  readonly description: string;
  readonly signatures: readonly WdlFunctionSignature[];
  readonly examples?: readonly WdlFunctionExample[];
  readonly documentationUrl?: string;
}
