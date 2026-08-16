import { describe, expect, it } from "vitest";
import {
  initialFunctionDefinitions,
  validateWdlFunctionDefinitions,
  wdlFunctionCatalog,
  wdlFunctionCategories,
} from "../../../../src/language";

const requiredInitialFunctions = [
  "if",
  "concat",
  "substring",
  "variables",
  "outputs",
  "body",
  "triggerBody",
  "items",
  "coalesce",
  "equals",
  "empty",
  "trim",
  "toLower",
  "toUpper",
  "sub",
  "subtractFromTime",
] as const;

describe("initialFunctionDefinitions", () => {
  it("passes runtime validation as a complete dataset", () => {
    expect(validateWdlFunctionDefinitions(initialFunctionDefinitions)).toEqual([]);
  });

  it("contains every function required by the initial scope", () => {
    for (const name of requiredInitialFunctions) {
      expect(wdlFunctionCatalog.get(name), name).toBeDefined();
    }
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
