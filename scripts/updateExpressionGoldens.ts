import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { WdlParser } from "../src/language";

const sourcesDirectory = resolve(
  process.cwd(),
  "test/fixtures/expressions/sources",
);
const goldenPath = resolve(
  process.cwd(),
  "test/fixtures/expressions/parser-golden.json",
);

async function main(): Promise<void> {
  const sourceFiles = (await readdir(sourcesDirectory))
    .filter((fileName) => fileName.endsWith(".wdlexpr"))
    .sort();
  const goldenEntries: Record<string, unknown> = {};

  for (const fileName of sourceFiles) {
    const source = await readFile(resolve(sourcesDirectory, fileName), "utf8");
    const result = new WdlParser(source).parse();
    goldenEntries[fileName] = {
      source,
      tokens: result.tokens,
      ast: result.expression,
      diagnostics: result.diagnostics,
    };
  }

  await writeFile(goldenPath, `${JSON.stringify(goldenEntries, null, 2)}\n`, "utf8");
  console.log(`Updated ${String(sourceFiles.length)} parser corpus goldens.`);
}

main().catch((error: unknown) => {
  console.error("Unable to update parser corpus goldens.", error);
  process.exitCode = 1;
});
