# Power Automate WDL Expression Tools

Power Automate WDL Expression Tools is a Visual Studio Code extension for
editing standalone Microsoft Power Automate and Logic Apps Workflow Definition
Language (WDL) expressions.

The project is in early development. The current scaffold establishes the
strict TypeScript, validation, and Extension Development Host foundations used
by the numbered implementation stories in GitHub.

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
