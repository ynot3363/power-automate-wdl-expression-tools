import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { WdlAnalyzer } from "../src/language";

const sourcesDirectory = resolve(
  process.cwd(),
  "test/fixtures/expressions/sources",
);
const goldenPath = resolve(
  process.cwd(),
  "test/fixtures/expressions/analyzer-golden.json",
);

async function main(): Promise<void> {
  const sourceFiles = (await readdir(sourcesDirectory))
    .filter((fileName) => fileName.endsWith(".wdlexpr"))
    .sort();
  const goldenEntries: Record<string, unknown> = {};

  for (const fileName of sourceFiles) {
    const source = await readFile(resolve(sourcesDirectory, fileName), "utf8");
    goldenEntries[fileName] = {
      source,
      diagnostics: new WdlAnalyzer().analyze(source).diagnostics,
    };
  }

  await writeFile(goldenPath, `${JSON.stringify(goldenEntries, null, 2)}\n`, "utf8");
  console.log(`Updated ${String(sourceFiles.length)} analyzer corpus goldens.`);
}

main().catch((error: unknown) => {
  console.error("Unable to update analyzer corpus goldens.", error);
  process.exitCode = 1;
});
