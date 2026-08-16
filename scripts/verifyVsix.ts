import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

interface ExtensionManifest {
  readonly name: string;
  readonly version: string;
}

const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
) as ExtensionManifest;
const expectedArtifactName = `${manifest.name}-${manifest.version}.vsix`;
const artifactPath = resolve(process.cwd(), process.argv[2] ?? expectedArtifactName);

if (!existsSync(artifactPath)) {
  throw new Error(`Expected VSIX artifact does not exist: ${artifactPath}`);
}
if (!artifactPath.endsWith(`/${expectedArtifactName}`)) {
  throw new Error(
    `Expected artifact name ${expectedArtifactName}, received ${artifactPath}`,
  );
}

const expectedEntries = [
  "[Content_Types].xml",
  "extension.vsixmanifest",
  "extension/LICENSE.txt",
  "extension/assets/icon.png",
  "extension/changelog.md",
  "extension/dist/extension.js",
  "extension/language-configuration.json",
  "extension/package.json",
  "extension/readme.md",
  "extension/syntaxes/power-automate-wdl-expression.tmLanguage.json",
].sort();
const actualEntries = execFileSync("unzip", ["-Z1", artifactPath], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .sort();

if (JSON.stringify(actualEntries) !== JSON.stringify(expectedEntries)) {
  throw new Error(
    [
      "VSIX contents differ from the release allowlist.",
      `Expected:\n${expectedEntries.join("\n")}`,
      `Actual:\n${actualEntries.join("\n")}`,
    ].join("\n\n"),
  );
}

const packagedManifest = JSON.parse(
  execFileSync("unzip", ["-p", artifactPath, "extension/package.json"], {
    encoding: "utf8",
  }),
) as ExtensionManifest;
if (
  packagedManifest.name !== manifest.name ||
  packagedManifest.version !== manifest.version
) {
  throw new Error(
    `Packaged identity ${packagedManifest.name}@${packagedManifest.version} does not match ${manifest.name}@${manifest.version}.`,
  );
}

process.stdout.write(
  `Verified ${expectedArtifactName}: ${String(actualEntries.length)} allowlisted files, version ${manifest.version}.\n`,
);
