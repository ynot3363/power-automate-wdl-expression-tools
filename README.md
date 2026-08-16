# Power Automate WDL Expression Tools

Power Automate WDL Expression Tools is a Visual Studio Code extension for
editing standalone Microsoft Power Automate and Logic Apps Workflow Definition
Language (WDL) expressions.

The project is in early development. The current scaffold establishes the
strict TypeScript, validation, and Extension Development Host foundations used
by the numbered implementation stories in GitHub.

## Getting Started

Create a file with the canonical `.wdlexpr` extension. VS Code automatically
selects the `Power Automate WDL Expression` language mode.

For a temporary scratch document, open the Command Palette and run:

```text
Power Automate: New WDL Expression
```

The command opens an untitled editor in the same language mode. The extension
does not register `.wdl` or `.paexpr` files.

## Editing Support

The WDL language mode auto-closes and matches parentheses and brackets and
auto-closes single quotes. Syntax highlighting follows the active VS Code theme
for generic function calls, WDL strings (including doubled-apostrophe escapes),
numbers, boolean and null literals, delimiters, and property/index access.

Function names are highlighted syntactically. Catalog-backed function validity
and semantic analysis are delivered by later implementation stories.

### Formatting

Use VS Code's **Format Document** command to format a complete expression, or
select one complete expression and run **Format Selection**. Unsafe partial or
incomplete selections are left unchanged.

Formatting uses four spaces by default. Configure
`powerAutomateWdlExpressions.format.indentSize` to change the indentation width
or set `powerAutomateWdlExpressions.format.useTabs` to `true` to indent with
tabs. Both settings can be scoped to a workspace, folder, or language.

### Function help

Hover over a recognized function name to see its catalog-backed signatures,
parameters, return types, examples, and a link to the Microsoft reference. The
catalog is stored with the extension and does not fetch remote documentation or
know the actions, variables, or schemas in a particular flow.

Signature help opens after `(` and `,` and tracks the active argument for known
functions, including nested and incomplete calls. Signatures describe catalog
types only; they cannot suggest values from a particular flow or connector.

## Prerequisites

- Node.js 24 or another Node.js version supported by the package toolchain
- npm 11 or a compatible npm release
- Visual Studio Code 1.125 or newer

## Development

Install dependencies and validate the repository:

```sh
npm install
npm run validate
```

Run the extension integration test separately:

```sh
npm run test:integration
```

To launch the extension manually, open the repository in VS Code and run the
`Run Extension` launch configuration. This starts an Extension Development
Host with the local build loaded.

## Architecture

- `src/language` contains the reusable WDL expression engine and never imports
  `vscode`.
- `src/extension` contains VS Code commands, providers, diagnostics adapters,
  and other editor integration.

Parsing, formatting, type analysis, function metadata, and diagnostics belong
to the language engine. The extension layer adapts those results to native VS
Code APIs.
