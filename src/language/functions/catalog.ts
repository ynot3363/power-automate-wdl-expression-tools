import {
  loadWdlFunctionDefinitions,
  type WdlCatalogValidationIssue,
} from "./catalogValidation";
import type {
  WdlFunctionCategory,
  WdlFunctionDefinition,
} from "./functionDefinition";

export class WdlFunctionCatalog {
  private readonly definitions: readonly WdlFunctionDefinition[];
  private readonly definitionsByName: ReadonlyMap<string, WdlFunctionDefinition>;

  public constructor(input: unknown) {
    this.definitions = [...loadWdlFunctionDefinitions(input)].sort((left, right) =>
      normalizeName(left.name).localeCompare(normalizeName(right.name), "en-US"),
    );
    this.definitionsByName = new Map(
      this.definitions.map((definition) => [
        normalizeName(definition.name),
        definition,
      ]),
    );
  }

  public get(name: string): WdlFunctionDefinition | undefined {
    return this.definitionsByName.get(normalizeName(name));
  }

  public has(name: string): boolean {
    return this.definitionsByName.has(normalizeName(name));
  }

  public list(): readonly WdlFunctionDefinition[] {
    return this.definitions;
  }

  public listByCategory(
    category: WdlFunctionCategory,
  ): readonly WdlFunctionDefinition[] {
    return this.definitions.filter(
      (definition) => definition.category === category,
    );
  }

  public matchPrefix(prefix: string): readonly WdlFunctionDefinition[] {
    const normalizedPrefix = normalizeName(prefix);
    return this.definitions.filter((definition) =>
      normalizeName(definition.name).startsWith(normalizedPrefix),
    );
  }
}

export type { WdlCatalogValidationIssue };

function normalizeName(name: string): string {
  return name.toLocaleLowerCase("en-US");
}
