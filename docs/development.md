# Development guide

This guide covers local development of **Power Automate WDL Expression Tools**.
For extension features, settings, and usage, see the
[Marketplace README](../README.md).

## Prerequisites

- Node.js 24
- npm
- Visual Studio Code 1.125 or newer

## Setup and validation

Install the locked dependencies and run the fast repository checks:

```sh
npm ci
npm run validate
```

`npm run validate` runs linting, TypeScript type checking, unit tests, and the
extension and test builds.

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

## Running and debugging the extension

Open the repository in VS Code and run the **Run Extension** launch
configuration to build the project and open an Extension Development Host.

Use the **Run Extension Integration Tests** launch configuration to debug the
Extension Host test suite interactively.

## Architecture

The reusable WDL engine lives under `src/language` and never imports `vscode`.
It owns lexing, parsing, formatting, function metadata, type inference, and
diagnostics.

Editor commands, providers, diagnostics, and lifecycle adapters live under
`src/extension`. They translate between VS Code APIs and language-engine
results without duplicating core language behavior.

See [Language engine](language-engine.md) for the detailed boundary and
[Implementation plan](implementation-plan.md) for project scope and sequencing.

## Continuous integration

Pull requests and pushes to `main` use a locked dependency install before
running lint, typecheck, unit-test, and build gates in GitHub Actions. A
separate Linux job runs the Extension Host suite under `xvfb-run`, keeping
editor integration failures distinct from the fast language-engine checks.
Superseded runs on the same branch are cancelled automatically.

Release packaging and publication are documented in the
[release guide](releasing.md).
