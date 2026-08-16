# WDL Expression Language Engine

The modules under `src/language` implement the reusable WDL expression engine.
They must remain independent from the `vscode` package so tests and future
non-editor consumers can run the engine directly.

## Source Offsets

Tokens and AST nodes use zero-based, half-open UTF-16 offsets into the original
JavaScript string: `start` is inclusive and `end` is exclusive. Whitespace may
be skipped by lexical and syntactic analysis, but it never changes later token
offsets.

Each token retains:

- `lexeme`: the exact source slice;
- `value`: its semantic value where lexical decoding applies; and
- `start` / `end`: the original half-open source range.

For example, the WDL string `'It''s working'` retains that exact lexeme while
its semantic value is `It's working`. An unterminated string is emitted as an
`Unknown` token so the fault-tolerant parser can preserve and diagnose it.

## AST Contract

The `ExpressionNode` discriminated union represents function calls, literals,
identifiers, property and index access, explicit parentheses, the optional `@`
expression prefix, missing expressions, and unknown input. Every node carries a
source range. Function calls also retain their name and delimiter ranges, while
access nodes retain operator and closing-delimiter ranges needed by future
editor features.

Zero-width ranges identify insertion points for recovered missing expressions.
`isClosed` distinguishes a complete call, index, or parenthesized expression
from a useful partial node produced while an author is still typing.

## Parse Results and Recovery

`WdlParser.parse()` returns one root expression, the lexer tokens, and parser
diagnostics as separate data. Normal invalid or incomplete editor input does
not throw. The parser uses:

- `WDL1001` for a missing expression or argument;
- `WDL1002` for a missing delimiter or required syntactic continuation; and
- `WDL1003` for unexpected input.

Missing expressions use a zero-width range at the insertion point. Missing
closing delimiters also retain zero-width delimiter ranges and set `isClosed`
to `false`. Consumers can therefore use partial function and access nodes while
also deciding whether a transformation is safe.

## Expression Corpus

Real-world complete, nested, access-chain, numeric/string, invalid, and
incomplete examples live under `test/fixtures/expressions/sources`. The matching
`parser-golden.json` records lexer tokens, AST output, source ranges, and parser
diagnostics. `formatter-golden.json` records default, compact, two-space, and
tab-indented output, using `null` when recovery makes rewriting unsafe.

Run the corpus through the normal unit suite. After an intentional parser or
lexer contract change, regenerate and review the golden diff explicitly:

```sh
npm run corpus:update
npm run test:unit
```

Every parser regression must add or extend a focused source fixture before the
fix. Do not update goldens merely to make an unexplained failure disappear.
Every formatter regression follows the same rule. Use `npm run
formatter:update` when reviewing only formatter output, or `npm run
corpus:update` to refresh both golden files after an intentional shared-corpus
change.

Inspect the representative AST during development with:

```sh
npm run inspect:ast
npm run inspect:ast -- --expression "concat('Hello', 'World')"
```

## Formatter

`WdlFormatter` traverses only AST nodes. It uses four spaces by default and
supports a positive `indentSize` plus `useTabs`. Nested function calls expand
onto indented argument lines; simple literal-only calls remain compact.

`format()` and `minify()` preserve literal lexemes and return `undefined` when
missing delimiters, missing expressions, or unknown nodes make a semantic
rewrite unsafe. Callers must treat that result as “no edit,” not as empty text.
Complex line-width wrapping is intentionally outside V1.

## Function Catalog Schema

Function metadata enters the engine as untrusted JSON-shaped data and is not
exposed as `WdlFunctionDefinition` objects until runtime validation succeeds.
Each definition contains a unique name, one of the planned categories, a
description, one or more signatures, optional examples, and an optional HTTP(S)
documentation URL.

Each signature has a supported WDL return type and an ordered parameter list.
Parameters have a name, one or more WDL types, a required flag, and optional
variadic and description fields. Required parameters cannot follow optional
ones, and a variadic parameter must be unique and last. Duplicate names and
duplicate signatures are rejected case-insensitively.

Catalog lookup and prefix matching are case-insensitive and return definitions
in deterministic name order. Add or review catalog JSON with the same care as
TypeScript: include focused validation tests, authoritative documentation URLs,
and provenance notes when the actual dataset is introduced.
