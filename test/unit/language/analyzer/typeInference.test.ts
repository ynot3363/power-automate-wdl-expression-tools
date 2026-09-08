import { describe, expect, it, vi } from "vitest";
import {
  areWdlTypesCompatible,
  inferWdlType,
  getApplicableSignatures,
  initialFunctionDefinitions,
  WdlAnalyzer,
  WdlFunctionCatalog,
  WdlParser,
} from "../../../../src/language";

function infer(source: string) {
  return inferWdlType(new WdlParser(source).parse().expression);
}

describe("inferWdlType", () => {
  it.each([12, 24])("bounds nested overload work at depth %i for every consumer", (depth) => {
    const source = "first(".repeat(depth) + "'abc'" + ")".repeat(depth);
    const expression = new WdlParser(source).parse().expression;
    expect(expression.type).toBe("FunctionCall");
    if (expression.type !== "FunctionCall") {
      return;
    }
    const catalog = new WdlFunctionCatalog(initialFunctionDefinitions);
    const signatures = catalog.get("first")?.signatures ?? [];
    const get = catalog.get.bind(catalog);
    const lookup = vi.spyOn(catalog, "get").mockImplementation((name) => {
      if (lookup.mock.calls.length > depth * 2) {
        throw new Error("Nested inference exceeded a linear lookup budget.");
      }
      return get(name);
    });

    expect(inferWdlType(expression, catalog)).toEqual({ types: ["string"], isUnknown: false });
    lookup.mockClear();
    expect(getApplicableSignatures(expression, signatures, catalog)).toHaveLength(1);
    lookup.mockClear();
    expect(new WdlAnalyzer(catalog).analyze(source).diagnostics).toEqual([]);
    expect(lookup.mock.calls.length).toBeLessThanOrEqual(depth * 2);
  });

  it("keeps inference for the same AST isolated between catalogs", () => {
    const expression = new WdlParser("value()").parse().expression;
    for (const returnType of ["string", "boolean"] as const) {
      const catalog = new WdlFunctionCatalog([{
        name: "value", category: "Logical", description: "A catalog-specific value.",
        signatures: [{ parameters: [], returnType }],
      }]);
      expect(inferWdlType(expression, catalog)).toEqual({ types: [returnType], isUnknown: false });
    }
  });

  it.each([
    ["'text'", ["string"]],
    ["42", ["integer"]],
    ["4.2", ["float"]],
    ["true", ["boolean"]],
    ["null", ["null"]],
  ])("infers the literal type for %s", (source, expected) => {
    expect(infer(source)).toEqual({ types: expected, isUnknown: false });
  });

  it("infers nested known function calls", () => {
    expect(infer("concat(toLower('A'), substring('xyz', 1))")).toEqual({
      types: ["string"],
      isUnknown: false,
    });
    expect(infer("equals(empty(''), true)")).toEqual({
      types: ["boolean"],
      isUnknown: false,
    });
  });

  it.each([
    "runtimeValue",
    "runtimeValue.name",
    "variables('value')?['property']",
    "unknownFunction('value')",
    "concat(",
  ])("preserves uncertainty for %s", (source) => {
    expect(infer(source)).toEqual({ types: ["unknown"], isUnknown: true });
  });

  it("returns all candidate types when an overload cannot be narrowed", () => {
    const catalog = new WdlFunctionCatalog([
      {
        name: "choose",
        category: "Logical",
        description: "Returns a typed value.",
        signatures: [
          {
            parameters: [{ name: "value", types: ["string"], required: true }],
            returnType: "string",
          },
          {
            parameters: [{ name: "value", types: ["number"], required: true }],
            returnType: "number",
          },
        ],
      },
    ]);

    const ambiguous = new WdlParser("choose(runtimeValue)").parse().expression;
    const narrowed = new WdlParser("choose('value')").parse().expression;
    expect(inferWdlType(ambiguous, catalog)).toEqual({
      types: ["string", "number"],
      isUnknown: false,
    });
    expect(inferWdlType(narrowed, catalog)).toEqual({
      types: ["string"],
      isUnknown: false,
    });
  });

  it("treats numeric variants as compatible and unknown values conservatively", () => {
    expect(areWdlTypesCompatible("integer", "number")).toBe(true);
    expect(areWdlTypesCompatible("float", "integer")).toBe(true);
    expect(areWdlTypesCompatible("unknown", "string")).toBe(true);
    expect(areWdlTypesCompatible("boolean", "string")).toBe(false);
  });
});
