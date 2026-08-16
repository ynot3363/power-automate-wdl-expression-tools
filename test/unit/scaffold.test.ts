import { describe, expect, it } from "vitest";

describe("language engine boundary", () => {
  it("can be imported without the VS Code runtime", async () => {
    await expect(import("../../src/language/index.js")).resolves.toBeDefined();
  });
});
