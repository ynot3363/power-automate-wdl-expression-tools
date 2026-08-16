import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { WdlFormatter, WdlParser } from "../src/language";

const sourcesDirectory = resolve(
  process.cwd(),
  "test/fixtures/expressions/sources",
);
const goldenPath = resolve(
  process.cwd(),
  "test/fixtures/expressions/formatter-golden.json",
);

async function main(): Promise<void> {
  const sourceFiles = (await readdir(sourcesDirectory))
    .filter((fileName) => fileName.endsWith(".wdlexpr"))
    .sort();
  const defaultFormatter = new WdlFormatter();
  const twoSpaceFormatter = new WdlFormatter({ indentSize: 2 });
  const tabFormatter = new WdlFormatter({ useTabs: true });
  const goldenEntries: Record<string, unknown> = {};

  for (const fileName of sourceFiles) {
    const source = await readFile(resolve(sourcesDirectory, fileName), "utf8");
    const expression = new WdlParser(source).parse().expression;
    goldenEntries[fileName] = {
      formatted: defaultFormatter.format(expression) ?? null,
      minified: defaultFormatter.minify(expression) ?? null,
      twoSpaceFormatted: twoSpaceFormatter.format(expression) ?? null,
      tabFormatted: tabFormatter.format(expression) ?? null,
    };
  }

  await writeFile(goldenPath, `${JSON.stringify(goldenEntries, null, 2)}\n`, "utf8");
  console.log(`Updated ${String(sourceFiles.length)} formatter corpus goldens.`);
}

main().catch((error: unknown) => {
  console.error("Unable to update formatter corpus goldens.", error);
  process.exitCode = 1;
});
