# Repository Instructions

## Project

This repository builds **Power Automate WDL Expression Tools**, a production-
quality Visual Studio Code extension for editing standalone Microsoft Power
Automate and Logic Apps Workflow Definition Language (WDL) expressions.

Read `docs/implementation-plan.md` before planning architecture or changing
feature scope. GitHub issues are the canonical implementation-story records,
and their issue-number order is the intended implementation order.

## V1 Scope

V1 is an expression-language extension, not a flow-definition editor. It
provides `.wdlexpr` language registration, syntax highlighting, parsing,
formatting and minification, function documentation and completion, signature
help, and conservative static diagnostics.

Do not add Power Platform authentication or API integration, flow/action/
variable discovery, connector or trigger schemas, exported workflow JSON
analysis, LSP infrastructure, a webview editor, AI generation, runtime
documentation scraping, a custom color theme, or a default `.wdl` association.
Do not implement future phases opportunistically.

Use these names consistently:

- Extension: `Power Automate WDL Expression Tools`
- Language display name: `Power Automate WDL Expression`
- VS Code language ID: `power-automate-wdl-expression`
- Canonical file extension: `.wdlexpr`

Never introduce `.paexpr`, and do not register `.wdl` by default.

## Architecture

Keep the reusable WDL language engine under `src/language` independent from
VS Code. It owns lexing, AST construction, fault-tolerant parsing, formatting,
function metadata, type inference, and diagnostics. It must never import
`vscode`.

Keep editor adapters under `src/extension`. VS Code providers and commands
translate between native editor APIs and the language engine; they must not
duplicate core parsing, formatting, argument detection, or semantic logic.

Use a single repository, not a monorepo. Do not introduce a Language Server in
V1. Preserve the engine boundary so it can be extracted later, but do not
publish a separate package prematurely.

Do not begin a VS Code provider until its corresponding language-engine
capability exists. Follow the ordered GitHub stories and the checkpoints in the
implementation plan.

## Coding Rules

- Use TypeScript in strict mode and current stable dependencies at the time of
  implementation.
- Prefer WDL-specific names such as `WdlLexer`, `WdlParser`, `WdlFormatter`,
  `WdlAnalyzer`, `WdlType`, and `WdlDiagnostic` over generic core names.
- Do not use TypeScript `any` unless an external integration genuinely requires
  it. The conceptual WDL type `any` is a value in the WDL type system, not the
  TypeScript type.
- Every AST node and token needed by downstream tooling must retain accurate
  offsets into the original source.
- Treat incomplete source as normal editor input. Parser recovery and useful
  partial ASTs are required behavior, not exceptional fallback behavior.
- Do not use regex in place of AST analysis for formatting, hover, signature
  help, argument detection, diagnostics, or semantic analysis. Regex is
  acceptable in the TextMate grammar.
- Implement formatting and minification against the AST. Formatting must be
  idempotent and preserve expression meaning across parse/format/parse.
- Keep function definitions data-driven. Add function-specific analyzer logic
  only when generic catalog and type rules cannot represent the behavior.
- Prefer `unknown` or the WDL `any` type when runtime information cannot be
  proven. Avoid false-positive diagnostics.
- Use stable diagnostic codes in the planned families: `WDL1000` syntax,
  `WDL1100` functions, `WDL1200` argument counts, and `WDL1300` argument types.
- Cache document analysis by URI and document version; do not independently
  parse a document for every provider.
- Keep settings minimal and tied to an identified user need.

## Tests and Validation

- Keep core language tests independent from VS Code and fast.
- Add focused lexer, parser, AST/source-range, formatter, catalog, type-
  inference, and analyzer tests as those components are introduced.
- Every parser or formatter bug must receive a regression fixture.
- Formatter fixtures must verify idempotency and semantic round trips.
- Keep a real-world corpus with complete, nested, access-chain, and incomplete
  expressions. Prefer golden fixtures for lexer, AST, formatter, and diagnostic
  output where they make failures easier to understand.
- Add extension-host integration coverage for registration, commands,
  formatting, hover, completion, signature help, and diagnostics.
- Once the package scripts exist, run focused checks while iterating and
  `npm run validate` before a final implementation-story commit.

## Documentation and Releases

Use Microsoft's Power Automate and Logic Apps WDL documentation as the
authoritative function reference. Store function metadata locally and validate
it as application code; do not scrape documentation at runtime.

Document V1's lack of real flow context clearly. Package with `@vscode/vsce`,
manually install and smoke-test the VSIX before publication, and do not automate
Marketplace publication until the release process has been tested manually.

## Git and GitHub Workflow

- Implement one numbered story per focused pull request unless explicitly told
  otherwise. Read its parent plan for shared context and dependencies.
- Do not implement later stories while completing an earlier story unless the
  issue explicitly includes that prerequisite.
- Keep commits focused and logically grouped. Preserve unrelated worktree
  changes and never stage them accidentally.
- Use issue-closing keywords only when a pull request fully satisfies the
  linked story.
