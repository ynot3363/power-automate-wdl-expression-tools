# Changelog

All notable changes to Power Automate WDL Expression Tools are documented in
this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.2] - 2026-09-07

### Fixed

- Preserve rejected source text when formatting or minifying expressions with
  syntax errors.
- Prevent selection formatting and minification from changing text inside string
  literals or other partial tokens.
- Cache inferred types during analysis to avoid exponential work for nested
  overloaded function calls.
- Preserve existing argument lists when completing function names.
- Accept valid single-argument `coalesce` calls.
- Keep signature help on the current argument until the cursor crosses its comma.

## [1.0.1] - 2026-08-30

### Changed

- Refocused the README as the Visual Studio Marketplace homepage and moved
  contributor setup, testing, debugging, and architecture notes into a
  dedicated development guide.

## [1.0.0] - 2026-08-16

### Added

- Dedicated `.wdlexpr` language mode and syntax highlighting.
- Fault-tolerant WDL lexer, parser, typed AST, and source-range utilities.
- AST-aware document/selection formatting and expression minification.
- Rich, theme-aware, local catalog-backed hover, completion, and signature help.
- Catalog coverage for all 137 functions in Microsoft's workflow expression
  reference, including `addProperty`.
- Conservative syntax, function, argument-count, and argument-type diagnostics.
- Commands for new scratch expressions, formatting, and minification.
- Shared versioned document-analysis cache and lifecycle cleanup.
- Unit, corpus, grammar, and Extension Host integration test coverage.

[1.0.2]: https://github.com/ynot3363/power-automate-wdl-expression-tools/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/ynot3363/power-automate-wdl-expression-tools/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ynot3363/power-automate-wdl-expression-tools/releases/tag/v1.0.0
