import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createOnigScanner,
  createOnigString,
  loadWASM,
} from "vscode-oniguruma";
import {
  INITIAL,
  Registry,
  parseRawGrammar,
  type IGrammar,
} from "vscode-textmate";
import { beforeAll, describe, expect, it } from "vitest";

interface TokenFixture {
  readonly name: string;
  readonly source: string;
  readonly tokens: readonly (readonly [text: string, scope: string])[];
}

const grammarPath = resolve(
  process.cwd(),
  "syntaxes/power-automate-wdl-expression.tmLanguage.json",
);
const fixturePath = resolve(
  process.cwd(),
  "test/fixtures/grammar/tokenization.json",
);
const wasmPath = resolve(
  process.cwd(),
  "node_modules/vscode-oniguruma/release/onig.wasm",
);

let grammar: IGrammar;
let fixtures: readonly TokenFixture[];

beforeAll(async () => {
  const wasm = await readFile(wasmPath);
  await loadWASM(wasm.buffer);

  const registry = new Registry({
    onigLib: Promise.resolve({ createOnigScanner, createOnigString }),
    loadGrammar: async (scopeName) => {
      if (scopeName !== "source.power-automate-wdl-expression") {
        return null;
      }

      return parseRawGrammar(await readFile(grammarPath, "utf8"), grammarPath);
    },
  });

  const loadedGrammar = await registry.loadGrammar(
    "source.power-automate-wdl-expression",
  );
  if (loadedGrammar === null) {
    throw new Error("Unable to load the WDL TextMate grammar.");
  }

  grammar = loadedGrammar;
  fixtures = JSON.parse(await readFile(fixturePath, "utf8")) as TokenFixture[];
});

describe("WDL TextMate grammar", () => {
  it("tokenizes the representative fixtures", () => {
    for (const fixture of fixtures) {
      const actual = grammar
        .tokenizeLine(fixture.source, INITIAL)
        .tokens.map((token) => ({
          scopes: token.scopes,
          text: fixture.source.slice(token.startIndex, token.endIndex),
        }));

      for (const [text, scope] of fixture.tokens) {
        expect(
          actual.some(
            (token) => token.text === text && token.scopes.includes(scope),
          ),
          `${fixture.name}: expected ${JSON.stringify(text)} to have ${scope}`,
        ).toBe(true);
      }
    }
  });
});
