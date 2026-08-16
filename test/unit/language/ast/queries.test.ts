import { describe, expect, it } from "vitest";
import {
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
