# Power Automate WDL Expression Tools

[![Validation](https://github.com/ynot3363/power-automate-wdl-expression-tools/actions/workflows/validation.yml/badge.svg)](https://github.com/ynot3363/power-automate-wdl-expression-tools/actions/workflows/validation.yml)

Write, understand, validate, and reformat standalone Microsoft Power Automate
and Azure Logic Apps Workflow Definition Language (WDL) expressions without
leaving Visual Studio Code.

This extension adds a dedicated `.wdlexpr` language mode with syntax
highlighting, AST-aware formatting and minification, function help,
completion, signature help, and conservative diagnostics.

## Quick start

1. Install **Power Automate WDL Expression Tools** in Visual Studio Code.
2. Create a file whose name ends in `.wdlexpr`.
3. Paste or write one Power Automate or Logic Apps expression.

For an unsaved scratch expression, open the Command Palette and run
**Power Automate: New WDL Expression**.

```wdl
if(equals(toLower(variables('Status')),'approved'),concat('Hello, ',trim(variables('Name'))),'Pending')
```

Run **Format Document** or **Power Automate: Format WDL Expression** to produce:

```wdl
if(
    equals(
        toLower(
            variables('Status')
        ),
        'approved'
    ),
    concat(
        'Hello, ',
        trim(
            variables('Name')
        )
    ),
    'Pending'
)
```

Run **Power Automate: Minify WDL Expression** to return to a compact form.

## Features

- Dedicated `.wdlexpr` files and `Power Automate WDL Expression` language mode
- Theme-aware syntax highlighting for calls, literals, access chains, and
  delimiters
- Document and safe-selection formatting driven by the parsed expression tree
- AST-aware minification that preserves WDL string escaping
- Hover documentation for all 137 functions in Microsoft's workflow expression
  function reference
- Function completion with snippet tab stops
- Signature help that follows nested and incomplete calls
- Problems-panel diagnostics for syntax, unknown functions, argument counts,
  and provable argument-type errors
- Cached document analysis shared by editor providers

Function metadata ships with the extension. Hover and completion do not fetch
documentation while you edit.

## Commands

| Command | What it does |
| --- | --- |
| `Power Automate: New WDL Expression` | Opens an untitled WDL expression editor. |
| `Power Automate: Format WDL Expression` | Formats the single non-empty selection, or the full document. |
| `Power Automate: Minify WDL Expression` | Minifies the single non-empty selection, or the full document. |

The format and minify commands only change `Power Automate WDL Expression`
editors. Incomplete or unsafe input is left unchanged and VS Code displays an
explanation.

VS Code's standard **Format Document** and **Format Selection** commands are
also supported. A selection must contain one complete expression.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `powerAutomateWdlExpressions.format.indentSize` | `4` | Spaces per indentation level. |
| `powerAutomateWdlExpressions.format.useTabs` | `false` | Indent with tabs instead of spaces. |
| `powerAutomateWdlExpressions.diagnostics.enabled` | `true` | Publish WDL syntax and static semantic diagnostics. |

All settings are resource-scoped, so they can be configured for a user,
workspace, folder, or language.

## Diagnostics

Diagnostics use stable code families:

| Code family | Meaning |
| --- | --- |
| `WDL1000` | Syntax error |
| `WDL1100` | Unknown function |
| `WDL1200` | Invalid argument count |
| `WDL1300` | Provably incompatible argument type |

Analysis is intentionally conservative. Runtime values from flow variables,
actions, triggers, properties, and connectors remain unknown rather than
producing speculative errors.

## Current limitations

- A `.wdlexpr` file contains one standalone expression; this is not a complete
  flow-definition editor.
- The extension does not connect to Power Platform, inspect a flow, or discover
  action, variable, trigger, or connector schemas.
- The bundled catalog follows Microsoft's workflow expression function reference;
  availability can still vary by Power Automate or Logic Apps environment.
- No `.wdl` file association is registered, to avoid claiming unrelated WDL
  formats.
- Diagnostics are static editor guidance, not a substitute for validating and
  running the expression in its target flow.

## Requirements

- Visual Studio Code 1.125 or newer
- No Power Platform sign-in is required

## Development

Install dependencies and run the fast repository checks:

```sh
npm ci
npm run validate
```

Run the Extension Host suite separately, or run every local quality gate:

```sh
npm run test:integration
npm run test:all
```

The integration suite launches a clean VS Code host and reports a named
scenario for language registration, commands, formatting, hover, signature
help, completion, and diagnostic lifecycle behavior. It runs against the
pinned VS Code version configured by the test runner. On headless Linux, use:

```sh
xvfb-run -a npm run test:integration
```

Pull requests and pushes to `main` run the same locked install, lint,
typecheck, unit-test, and build gates in GitHub Actions. A separate Linux job
runs the Extension Host suite under `xvfb-run`, so editor integration failures
remain distinct from the fast language-engine checks. Superseded runs on the
same branch are cancelled automatically.

Open the repository in VS Code and run the **Run Extension** launch
configuration for manual development. The **Run Extension Integration Tests**
launch configuration supports interactive test debugging.

The reusable engine lives under `src/language` and never imports `vscode`.
Editor commands, providers, diagnostics, and lifecycle adapters live under
`src/extension`. See [Language engine](docs/language-engine.md) for the detailed
boundary.

## Privacy

Expression source is analyzed locally. The extension does not send documents
to a remote service and does not include telemetry.

## Feedback and license

Report defects and feature requests in the
[GitHub issue tracker](https://github.com/ynot3363/power-automate-wdl-expression-tools/issues).

Licensed under the [GNU Affero General Public License v3.0](LICENSE).
