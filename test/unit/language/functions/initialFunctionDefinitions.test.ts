import { describe, expect, it } from "vitest";
import {
  initialFunctionDefinitions,
  microsoftFunctionReferenceNames,
  validateWdlFunctionDefinitions,
  wdlFunctionCatalog,
  wdlFunctionCategories,
} from "../../../../src/language";

describe("initialFunctionDefinitions", () => {
  it("passes runtime validation as a complete dataset", () => {
    expect(validateWdlFunctionDefinitions(initialFunctionDefinitions)).toEqual([]);
  });

  it("exactly covers Microsoft's documented workflow function names", () => {
    expect(microsoftFunctionReferenceNames).toHaveLength(137);
    expect(wdlFunctionCatalog.list().map(({ name }) => name)).toEqual(
      [...microsoftFunctionReferenceNames].sort((left, right) =>
        left.localeCompare(right, "en-US", { sensitivity: "base" }),
      ),
    );
  });

  it("models addProperty as a three-argument object function", () => {
    expect(wdlFunctionCatalog.get("addProperty")).toMatchObject({
      category: "JSON/XML",
      documentationUrl:
        "https://learn.microsoft.com/en-us/azure/logic-apps/expression-functions-reference#addProperty",
      signatures: [
        {
          parameters: [
            { name: "object", types: ["object"], required: true },
            { name: "property", types: ["string"], required: true },
            { name: "value", types: ["any"], required: true },
          ],
          returnType: "object",
        },
      ],
    });
  });

  it("represents every planned category", () => {
    for (const category of wdlFunctionCategories) {
      expect(wdlFunctionCatalog.listByCategory(category), category).not.toHaveLength(0);
    }
  });

  it("includes usable signatures, examples, parameter help, and official links", () => {
    for (const definition of wdlFunctionCatalog.list()) {
      expect(definition.description.length).toBeGreaterThan(0);
      expect(definition.examples?.length).toBeGreaterThan(0);
      expect(definition.documentationUrl).toMatch(
        /^https:\/\/learn\.microsoft\.com\/en-us\/azure\/logic-apps\//,
      );

      for (const signature of definition.signatures) {
        for (const parameter of signature.parameters) {
          expect(parameter.description?.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("models optional and variadic signatures needed by editor features", () => {
    const substring = wdlFunctionCatalog.get("substring");
    const concat = wdlFunctionCatalog.get("concat");

    expect(substring?.signatures[0]?.parameters[2]).toMatchObject({
      name: "length",
      required: false,
    });
    expect(concat?.signatures[0]?.parameters[1]).toMatchObject({
      name: "additionalText",
      required: true,
      variadic: true,
    });
  });
});
