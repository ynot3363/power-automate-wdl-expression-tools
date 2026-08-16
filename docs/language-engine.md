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
