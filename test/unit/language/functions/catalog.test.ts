import { describe, expect, it } from "vitest";
import {
  WdlCatalogValidationError,
  WdlFunctionCatalog,
  validateWdlFunctionDefinitions,
  wdlFunctionCategories,
  wdlTypes,
} from "../../../../src/language";

const validDefinitions = [
  {
    name: "concat",
    category: "String",
    description: "Combines strings.",
    signatures: [
      {
        parameters: [
          {
            name: "values",
            types: ["string"],
            required: true,
            variadic: true,
            description: "Strings to combine.",
          },
        ],
        returnType: "string",
      },
    ],
    examples: [
      {
        expression: "concat('a', 'b')",
        result: "ab",
      },
    ],
    documentationUrl: "https://learn.microsoft.com/example/concat",
  },
  {
    name: "equals",
    category: "Logical",
    description: "Tests equality.",
    signatures: [
      {
        parameters: [
          { name: "left", types: ["any"], required: true },
          { name: "right", types: ["any"], required: true },
        ],
        returnType: "boolean",
      },
    ],
  },
] as const;

function withDefinition(change: Readonly<Record<string, unknown>>): unknown {
  return [{ ...structuredClone(validDefinitions[0]), ...change }];
}

describe("WdlFunctionCatalog", () => {
  it("loads, sorts, and looks up valid definitions deterministically", () => {
    const catalog = new WdlFunctionCatalog([...validDefinitions].reverse());
    expect(catalog.list().map(({ name }) => name)).toEqual(["concat", "equals"]);
    expect(catalog.get("CONCAT")?.name).toBe("concat");
    expect(catalog.has("Equals")).toBe(true);
    expect(catalog.listByCategory("Logical").map(({ name }) => name)).toEqual([
      "equals",
    ]);
    expect(catalog.matchPrefix("CO").map(({ name }) => name)).toEqual([
      "concat",
    ]);
    expect(catalog.get("missing")).toBeUndefined();
  });

  it("exposes every planned WDL type and function category", () => {
    expect(wdlTypes).toEqual([
      "string",
      "integer",
      "float",
      "number",
      "boolean",
      "array",
      "object",
      "null",
      "any",
      "unknown",
    ]);
    expect(wdlFunctionCategories).toEqual([
      "String",
      "Collection",
      "Logical",
      "Conversion",
      "Math",
      "DateTime",
      "Workflow",
      "URI",
      "JSON/XML",
    ]);
  });

  it.each([
    ["non-array input", {}, "$"],
    ["duplicate names", [validDefinitions[0], validDefinitions[0]], "$[1].name"],
    ["missing signatures", withDefinition({ signatures: [] }), "$[0].signatures"],
    [
      "missing parameter name",
      withDefinition({
        signatures: [
          {
            parameters: [{ name: "", types: ["string"], required: true }],
            returnType: "string",
          },
        ],
      }),
      "$[0].signatures[0].parameters[0].name",
    ],
    [
      "missing parameter types",
      withDefinition({
        signatures: [
          {
            parameters: [{ name: "value", types: [], required: true }],
            returnType: "string",
          },
        ],
      }),
      "$[0].signatures[0].parameters[0].types",
    ],
    [
      "unsupported parameter type",
      withDefinition({
        signatures: [
          {
            parameters: [{ name: "value", types: ["date"], required: true }],
            returnType: "string",
          },
        ],
      }),
      "$[0].signatures[0].parameters[0].types[0]",
    ],
    [
      "unsupported return type",
      withDefinition({
        signatures: [{ parameters: [], returnType: "date" }],
      }),
      "$[0].signatures[0].returnType",
    ],
    [
      "required after optional",
      withDefinition({
        signatures: [
          {
            parameters: [
              { name: "optional", types: ["string"], required: false },
              { name: "required", types: ["string"], required: true },
            ],
            returnType: "string",
          },
        ],
      }),
      "$[0].signatures[0].parameters[1].required",
    ],
    [
      "variadic parameter not last",
      withDefinition({
        signatures: [
          {
            parameters: [
              {
                name: "values",
                types: ["string"],
                required: true,
                variadic: true,
              },
              { name: "suffix", types: ["string"], required: true },
            ],
            returnType: "string",
          },
        ],
      }),
      "$[0].signatures[0].parameters[0].variadic",
    ],
    [
      "invalid documentation URL",
      withDefinition({ documentationUrl: "not a URL" }),
      "$[0].documentationUrl",
    ],
    [
      "duplicate signatures",
      withDefinition({
        signatures: [
          validDefinitions[0].signatures[0],
          validDefinitions[0].signatures[0],
        ],
      }),
      "$[0].signatures[1]",
    ],
  ])("rejects %s", (_name, input, expectedPath) => {
    const issues = validateWdlFunctionDefinitions(input);
    expect(issues.map(({ path }) => path)).toContain(expectedPath);
    expect(() => new WdlFunctionCatalog(input)).toThrow(WdlCatalogValidationError);
  });
});
