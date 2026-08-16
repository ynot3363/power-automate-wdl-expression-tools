import { describe, expect, it } from "vitest";
import {
  findFunctionCallAtArgumentOffset,
  findFunctionCallAtNameOffset,
  WdlParser,
} from "../../../../src/language";

function find(source: string, offset: number) {
  return findFunctionCallAtNameOffset(
    new WdlParser(source).parse().expression,
    offset,
  );
}

describe("findFunctionCallAtNameOffset", () => {
  it("finds nested function names using half-open source ranges", () => {
    const source = "if(equals(1, 1), 'yes', 'no')";
    expect(find(source, 0)?.name).toBe("if");
    expect(find(source, 1)?.name).toBe("if");
    expect(find(source, 2)).toBeUndefined();
    expect(find(source, 3)?.name).toBe("equals");
    expect(find(source, 8)?.name).toBe("equals");
    expect(find(source, 9)).toBeUndefined();
  });

  it("ignores identifiers inside strings and unrelated access properties", () => {
    const source = "concat('toLower(''x'')', 'y').value";
    expect(find(source, source.indexOf("toLower"))).toBeUndefined();
    expect(find(source, source.indexOf("value"))).toBeUndefined();
  });

  it("finds the name of an incomplete call", () => {
    expect(find("substring(", 5)?.name).toBe("substring");
  });
});

describe("findFunctionCallAtArgumentOffset", () => {
  it.each([
    ["concat(|", "concat", 0],
    ["concat('a', |", "concat", 1],
    ["concat('a', 'b', |", "concat", 2],
    ["substring(\n  'abc',\n  |1\n)", "substring", 1],
    ["if(equals(1, |", "equals", 1],
  ])("finds the active argument in %s", (markedSource, name, argumentIndex) => {
    const offset = markedSource.indexOf("|");
    const source = markedSource.replace("|", "");
    const context = findFunctionCallAtArgumentOffset(
      new WdlParser(source).parse().expression,
      offset,
    );
    expect(context?.call.name).toBe(name);
    expect(context?.argumentIndex).toBe(argumentIndex);
  });

  it("returns no call on a name or after a closed call", () => {
    const source = "concat('a', 'b')";
    const expression = new WdlParser(source).parse().expression;
    expect(findFunctionCallAtArgumentOffset(expression, 2)).toBeUndefined();
    expect(
      findFunctionCallAtArgumentOffset(expression, source.length),
    ).toBeUndefined();
  });
});
