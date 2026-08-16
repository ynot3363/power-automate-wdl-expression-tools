import { describe, expect, it } from "vitest";
import { WdlAnalyzer, WdlFunctionCatalog } from "../../../../src/language";

function diagnostics(source: string) {
  return new WdlAnalyzer().analyze(source).diagnostics;
}

describe("WdlAnalyzer", () => {
  it("accepts valid nested calls and case-insensitive function names", () => {
    expect(
      diagnostics("IF(equals(1, 1), concat('a', 'b'), toUpper('c'))"),
    ).toEqual([]);
  });

  it("reports unknown functions on their name range", () => {
    expect(diagnostics("mystery('value')")).toEqual([
      {
        code: "WDL1101",
        message: "Unknown function 'mystery'.",
        severity: "error",
        range: { start: 0, end: 7 },
      },
    ]);
  });

  it.each([
    ["concat('one')", 1, "2 or more"],
    ["toLower('one', 'two')", 2, "1"],
  ])("reports invalid argument counts for %s", (source, count, expected) => {
    const result = diagnostics(source);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ code: "WDL1201", severity: "error" });
    expect(result[0]?.message).toContain(
      `does not accept ${String(count)} argument`,
    );
    expect(result[0]?.message).toContain(`Expected ${expected}`);
  });

  it("reports only provable argument type mismatches on argument ranges", () => {
    expect(diagnostics("substring(true, 'start')")).toEqual([
      {
        code: "WDL1301",
        message: "Argument 1 of substring expects string, but received boolean.",
        severity: "error",
        range: { start: 10, end: 14 },
      },
      {
        code: "WDL1301",
        message: "Argument 2 of substring expects integer, but received string.",
        severity: "error",
        range: { start: 16, end: 23 },
      },
    ]);
    expect(diagnostics("toLower(variables('runtime'))")).toEqual([]);
  });

  it("walks nested expressions without cascading uncertain diagnostics", () => {
    expect(diagnostics("concat(missing(), toLower(false))").map(({ code }) => code)).toEqual([
      "WDL1101",
      "WDL1301",
    ]);
  });

  it("preserves parser diagnostics for incomplete expressions", () => {
    const result = diagnostics("concat('value',");
    expect(result.map(({ code }) => code)).toEqual(["WDL1001", "WDL1002"]);
  });

  it("accepts an argument when any overload supports its known type", () => {
    const catalog = new WdlFunctionCatalog([
      {
        name: "overloaded",
        category: "Logical",
        description: "Accepts strings or booleans.",
        signatures: [
          {
            parameters: [{ name: "value", types: ["string"], required: true }],
            returnType: "string",
          },
          {
            parameters: [{ name: "value", types: ["boolean"], required: true }],
            returnType: "boolean",
          },
        ],
      },
    ]);

    expect(new WdlAnalyzer(catalog).analyze("overloaded(true)").diagnostics).toEqual([]);
  });
});
