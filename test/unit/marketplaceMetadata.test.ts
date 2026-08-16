import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface MarketplaceManifest {
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly publisher: string;
  readonly license: string;
  readonly icon: string;
  readonly repository: { readonly url: string };
  readonly bugs: { readonly url: string };
  readonly homepage: string;
  readonly categories: readonly string[];
  readonly keywords: readonly string[];
}

const repositoryRoot = process.cwd();

const readRepositoryFile = (path: string): string =>
  readFileSync(join(repositoryRoot, path), "utf8");

describe("Marketplace metadata", () => {
  it("declares complete discoverability and support metadata", () => {
    const manifest = JSON.parse(readRepositoryFile("package.json")) as MarketplaceManifest;

    expect(manifest.name).toBe("power-automate-wdl-expression-tools");
    expect(manifest.displayName).toBe("Power Automate WDL Expression Tools");
    expect(manifest.description).toContain("Power Automate");
    expect(manifest.publisher).toBe("aepcodes");
    expect(manifest.license).toBe("AGPL-3.0-only");
    expect(manifest.icon).toBe("assets/icon.png");
    expect(manifest.repository.url).toBe(
      "https://github.com/ynot3363/power-automate-wdl-expression-tools.git",
    );
    expect(manifest.bugs.url).toBe(
      "https://github.com/ynot3363/power-automate-wdl-expression-tools/issues",
    );
    expect(manifest.homepage).toContain("github.com/ynot3363/power-automate-wdl-expression-tools");
    expect(manifest.categories).toEqual(
      expect.arrayContaining(["Programming Languages", "Formatters", "Linters"]),
    );
    expect(manifest.keywords).toEqual(
      expect.arrayContaining(["power-automate", "logic-apps", "wdl", "expressions"]),
    );
  });

  it("ships the complete AGPL-3.0 license and public release documents", () => {
    const license = readRepositoryFile("LICENSE");
    const readme = readRepositoryFile("README.md");
    const changelog = readRepositoryFile("CHANGELOG.md");

    expect(license).toContain("GNU AFFERO GENERAL PUBLIC LICENSE");
    expect(license).toContain("Version 3, 19 November 2007");
    expect(license).toContain("END OF TERMS AND CONDITIONS");
    expect(readme).toContain("## Current limitations");
    expect(readme).toContain("Power Automate: Minify WDL Expression");
    expect(readme).toContain("```wdl");
    expect(changelog).toContain("## [Unreleased]");
  });

  it("uses a square PNG Marketplace icon and records its provenance", () => {
    const icon = readFileSync(join(repositoryRoot, "assets/icon.png"));

    expect(icon.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(icon.readUInt32BE(16)).toBe(256);
    expect(icon.readUInt32BE(20)).toBe(256);
    expect(readRepositoryFile("assets/README.md")).toContain("Asset provenance");
  });

  it("defines an explicit VSIX exclusion list", () => {
    const vscodeIgnore = readRepositoryFile(".vscodeignore");

    expect(vscodeIgnore).toContain("src/**");
    expect(vscodeIgnore).toContain("test/**");
    expect(vscodeIgnore).toContain("docs/**");
    expect(vscodeIgnore).not.toContain("assets/**");
  });
});
