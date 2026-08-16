# Power Automate WDL Expression Tools

## VS Code Extension Implementation Plan

## 1. Project Objective

Build a production-quality Visual Studio Code extension that provides a first-class editing experience for Microsoft Power Automate Workflow Definition Language (WDL) expressions.

The extension should allow users to create, paste, edit, and validate Power Automate WDL expressions in VS Code with:

- Syntax highlighting
- Automatic formatting
- Function documentation on hover
- Function autocomplete
- Signature and parameter help
- Syntax diagnostics
- Function validation
- Argument-count validation
- Basic argument-type validation
- Commands for creating and manipulating WDL expression scratch files

The long-term goal is to create a reusable WDL expression language engine that could later support:

- Flow-aware validation
- Exported Power Automate workflow definitions
- Azure Logic Apps expression scenarios
- A CLI
- A browser-based expression editor
- Additional editor integrations
- Potential extraction into an npm package
- A future Language Server

Do **not** attempt to implement complete Power Automate workflow JSON analysis in the initial release.

V1 is specifically a **WDL expression language extension**.

---

# 2. Terminology and Naming

Use the following terminology consistently throughout the project.

## Extension Name

```text
Power Automate WDL Expression Tools
```

## Language Display Name

```text
Power Automate WDL Expression
```

## VS Code Language ID

```text
power-automate-wdl-expression
```

## Canonical File Extension

```text
.wdlexpr
```

Example:

```text
condition.wdlexpr
```

The `.wdlexpr` extension is intentionally used instead of `.wdl`.

`.wdl` is already associated with another established Workflow Description Language ecosystem. Additionally, this project initially edits individual Microsoft WDL **expressions**, not complete workflow-definition documents.

The `.wdlexpr` extension communicates both:

```text
wdl  → Workflow Definition Language
expr → Expression
```

Do not use `.paexpr` anywhere in the implementation.

Do not register `.wdl` as a default file association in V1.

Users may manually associate `.wdl` files with the language if desired, but that should not be part of the default extension behavior.

---

# 3. Core Architectural Principle

The VS Code extension must **not contain the core WDL language logic**.

Build two logical layers inside the repository:

```text
┌─────────────────────────────────────┐
│        WDL Expression Engine        │
│                                     │
│ Lexer                               │
│ Parser                              │
│ AST                                 │
│ Formatter                           │
│ Function Catalog                    │
│ Type Analyzer                       │
│ Diagnostics                         │
│                                     │
│ ZERO dependencies on vscode         │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         VS Code Integration         │
│                                     │
│ Commands                            │
│ Hover Provider                      │
│ Completion Provider                 │
│ Signature Help Provider             │
│ Formatting Provider                 │
│ Diagnostics Adapter                 │
│                                     │
└─────────────────────────────────────┘
```

All parsing, formatting, analysis, and function metadata must work independently from VS Code.

VS Code should only adapt language-engine results to native editor APIs.

Do **not** introduce Language Server Protocol infrastructure in V1.

---

# 4. Technology

Use:

- TypeScript
- TypeScript strict mode
- Native VS Code Extension API
- TextMate grammar for lexical syntax highlighting
- Native VS Code diagnostics
- Native VS Code completion API
- Native VS Code hover API
- Native VS Code signature-help API
- Native VS Code document-formatting API
- Native VS Code range-formatting API where practical
- Current VS Code-supported extension testing tools
- `@vscode/vsce` for packaging
- ESLint
- Unit tests for the standalone language engine

Use current stable dependency versions at implementation time.

Do not hard-code dependency versions from this plan unless necessary.

---

# 5. Repository Structure

Use a single repository.

Do not begin with a monorepo.

Suggested structure:

```text
power-automate-wdl-expression-tools/
│
├── src/
│   │
│   ├── extension/
│   │   ├── extension.ts
│   │   │
│   │   ├── commands/
│   │   │   ├── newExpression.ts
│   │   │   ├── formatExpression.ts
│   │   │   └── minifyExpression.ts
│   │   │
│   │   ├── providers/
│   │   │   ├── hoverProvider.ts
│   │   │   ├── completionProvider.ts
│   │   │   ├── signatureHelpProvider.ts
│   │   │   ├── documentFormattingProvider.ts
│   │   │   └── documentRangeFormattingProvider.ts
│   │   │
│   │   ├── diagnostics/
│   │   │   └── diagnosticManager.ts
│   │   │
│   │   ├── services/
│   │   │   └── documentAnalysisService.ts
│   │   │
│   │   └── utilities/
│   │
│   └── language/
│       │
│       ├── lexer/
│       │   ├── wdlLexer.ts
│       │   ├── token.ts
│       │   └── tokenType.ts
│       │
│       ├── parser/
│       │   ├── wdlParser.ts
│       │   ├── parseResult.ts
│       │   └── parserError.ts
│       │
│       ├── ast/
│       │   ├── nodes.ts
│       │   ├── visitors.ts
│       │   └── sourceRange.ts
│       │
│       ├── formatter/
│       │   ├── wdlFormatter.ts
│       │   └── formatterOptions.ts
│       │
│       ├── analyzer/
│       │   ├── wdlAnalyzer.ts
│       │   ├── typeInference.ts
│       │   ├── wdlTypes.ts
│       │   └── diagnostics.ts
│       │
│       └── functions/
│           ├── catalog.ts
│           ├── functionDefinition.ts
│           └── definitions/
│               ├── collection.json
│               ├── conversion.json
│               ├── datetime.json
│               ├── logical.json
│               ├── math.json
│               ├── string.json
│               ├── workflow.json
│               ├── uri.json
│               └── jsonXml.json
│
├── syntaxes/
│   └── power-automate-wdl-expression.tmLanguage.json
│
├── language-configuration.json
│
├── test/
│   ├── language/
│   │   ├── lexer/
│   │   ├── parser/
│   │   ├── formatter/
│   │   ├── analyzer/
│   │   └── functions/
│   │
│   └── extension/
│
├── .github/
│   └── workflows/
│
├── package.json
├── tsconfig.json
├── README.md
├── CHANGELOG.md
├── LICENSE
└── .vscodeignore
```

The exact folders may evolve.

The critical boundary is:

```text
src/language
```

must never import:

```ts
import * as vscode from "vscode";
```

---

# 6. Internal Naming Conventions

Use WDL terminology for core language-engine classes and interfaces.

Prefer names such as:

```text
WdlLexer
WdlParser
WdlFormatter
WdlAnalyzer
WdlType
WdlFunctionDefinition
WdlFunctionCatalog
WdlDiagnostic
```

VS Code-specific classes can use names such as:

```text
WdlHoverProvider
WdlCompletionProvider
WdlSignatureHelpProvider
WdlFormattingProvider
```

Avoid generic names such as:

```text
Parser
Formatter
Analyzer
```

when a WDL-specific name improves clarity.

---

# 7. Phase 1 — Extension Scaffold

Create the VS Code extension shell.

Configure the extension manifest with:

- Display name
- Extension ID
- Publisher placeholder
- Description
- Repository metadata
- VS Code engine compatibility
- Language contribution
- Grammar contribution
- Commands
- Configuration settings
- Activation configuration

Register:

```text
Language ID:
power-automate-wdl-expression
```

```text
Display Name:
Power Automate WDL Expression
```

```text
File Extension:
.wdlexpr
```

Create the initial command:

```text
Power Automate: New WDL Expression
```

When executed:

1. Create a new untitled document.
2. Set its language mode to `power-automate-wdl-expression`.
3. Open it in the editor.

### Phase 1 Acceptance Criteria

The user can execute:

```text
Command Palette
    ↓
Power Automate: New WDL Expression
    ↓
Untitled editor
    ↓
Language Mode:
Power Automate WDL Expression
```

Opening:

```text
example.wdlexpr
```

must automatically select:

```text
Power Automate WDL Expression
```

No parser is required yet.

---

# 8. Phase 2 — Language Configuration and Syntax Highlighting

Create:

```text
language-configuration.json
```

Configure:

- Parenthesis matching
- Bracket matching
- Auto-closing parentheses
- Auto-closing brackets
- Auto-closing single quotes

Create:

```text
syntaxes/power-automate-wdl-expression.tmLanguage.json
```

Support initial tokenization for:

## Functions

Examples:

```text
if
concat
substring
variables
outputs
body
triggerBody
items
coalesce
equals
empty
trim
toLower
toUpper
```

Prefer recognizing generic function-call syntax:

```text
identifier(
```

rather than maintaining all function names inside the TextMate grammar.

Function validity belongs to the function catalog and analyzer.

## Strings

```text
'Hello World'
```

Handle WDL escaped apostrophes:

```text
'It''s working'
```

## Numbers

```text
123
-42
3.14
```

## Literals

```text
true
false
null
```

## Delimiters

```text
(
)
[
]
,
```

## Operators and Access Syntax

Support highlighting of constructs including:

```text
?
?[
]
.
@
```

### Phase 2 Acceptance Criteria

The following expression should be clearly highlighted using the user's existing VS Code theme:

```text
if(
    equals(
        variables('Name'),
        'Anthony'
    ),
    true,
    false
)
```

The extension must not define a custom color theme.

---

# 9. Phase 3 — WDL Lexer

Build the first reusable language-engine component.

Example:

```text
substring('Anthony', 0, 3)
```

should approximately produce:

```text
IDENTIFIER substring
OPEN_PAREN
STRING Anthony
COMMA
INTEGER 0
COMMA
INTEGER 3
CLOSE_PAREN
EOF
```

Each token must include source-location information.

Example:

```ts
interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}
```

Support at minimum:

```text
Identifier
StringLiteral
IntegerLiteral
FloatLiteral
BooleanLiteral
NullLiteral
OpenParen
CloseParen
OpenBracket
CloseBracket
Comma
Dot
QuestionMark
AtSign
EOF
Unknown
```

Do not discard source positions.

### Lexer Requirements

Correctly handle:

```text
'Anthony'
'It''s working'
123
-123
1.25
true
false
null
outputs('Get_User')
outputs('Get_User')?['body/Email']
```

Whitespace must not affect parsing.

Positions must still refer to the original source text.

### Phase 3 Acceptance Criteria

Create unit tests covering:

- Simple calls
- Nested calls
- Escaped strings
- Negative integers
- Floating-point values
- Whitespace
- Newlines
- Property access
- Safe access
- Empty expressions
- Unexpected characters

Do not move parser logic into the lexer.

---

# 10. Phase 4 — WDL AST

Create a strongly typed Abstract Syntax Tree.

Start with:

```ts
type ExpressionNode =
  | FunctionCallNode
  | StringLiteralNode
  | NumberLiteralNode
  | BooleanLiteralNode
  | NullLiteralNode
  | IdentifierNode
  | PropertyAccessNode
  | IndexAccessNode
  | MissingExpressionNode
  | UnknownNode;
```

Every node must contain:

```ts
interface SourceRange {
  start: number;
  end: number;
}
```

Example:

```ts
interface FunctionCallNode {
  type: "FunctionCall";
  name: string;
  arguments: ExpressionNode[];
  range: SourceRange;
  nameRange: SourceRange;
}
```

Source ranges must be accurate enough to support:

- Hover
- Diagnostics
- Signature help
- Selection formatting
- Future semantic tokens
- Future code actions

---

# 11. Phase 5 — WDL Parser

Implement a recursive-descent parser.

Input:

```text
if(
    empty(
        variables('Name')
    ),
    'Unknown',
    variables('Name')
)
```

should produce conceptually:

```text
FunctionCall: if
├── FunctionCall: empty
│   └── FunctionCall: variables
│       └── StringLiteral: Name
├── StringLiteral: Unknown
└── FunctionCall: variables
    └── StringLiteral: Name
```

Support:

- Function calls
- Nested function calls
- String literals
- Integer literals
- Floating-point literals
- Boolean literals
- Null
- Property access
- Index access
- Null-safe access
- Parenthesized expression structures where applicable

Example:

```text
outputs('Get_User')?['body/Email']
```

must parse into structured nodes.

Do not store this as one opaque token or string.

---

# 12. Fault-Tolerant Parsing

Fault tolerance is mandatory.

The parser must continue producing useful AST information when the expression is incomplete.

Example:

```text
concat(
    variables('Name'),
    toLower(
```

must not simply fail.

Produce something conceptually like:

```text
FunctionCall: concat
├── FunctionCall: variables
│   └── StringLiteral: Name
└── FunctionCall: toLower
    └── MissingExpression
```

Parser diagnostics should be returned separately from the AST.

Incomplete user input is normal editor behavior.

It must not be treated as an exceptional condition.

### Parser Acceptance Criteria

Useful parse results must be produced for:

```text
concat(
```

```text
concat('Hello',
```

```text
concat(
    variables('Name'),
```

```text
if(equals(
```

as well as complete expressions.

---

# 13. Phase 6 — WDL Formatter

Implement the formatter entirely against the AST.

Input:

```text
if(equals(trim(variables('Name')),''),'Unknown',variables('Name'))
```

Expected formatted output:

```text
if(
    equals(
        trim(
            variables('Name')
        ),
        ''
    ),
    'Unknown',
    variables('Name')
)
```

Do not implement formatting through regex replacements.

Initial rules:

- Four-space indentation
- Nested function calls use indentation
- Multiline arguments are placed on separate lines
- Commas terminate arguments
- Literal values remain semantically unchanged
- Structural whitespace is normalized

Create options:

```ts
interface FormatterOptions {
  indentSize: number;
  useTabs: boolean;
}
```

Do not implement complex line-width wrapping in V1.

## Formatter Idempotency

For every formatter fixture:

```ts
format(format(expression)) === format(expression);
```

must be true.

## Formatter Round Trip

The AST produced after formatting must be semantically equivalent to the original AST:

```text
source
  ↓
parse
  ↓
format
  ↓
parse again
```

Formatting must not alter expression meaning.

---

# 14. Phase 7 — WDL Function Catalog

Build a machine-readable function-definition system.

Use Microsoft's Power Automate / Logic Apps WDL documentation as the authoritative source.

Create:

```ts
interface WdlFunctionDefinition {
  name: string;
  category: WdlFunctionCategory;
  description: string;
  signatures: WdlFunctionSignature[];
  examples?: WdlFunctionExample[];
  documentationUrl?: string;
}
```

```ts
interface WdlFunctionSignature {
  parameters: WdlFunctionParameter[];
  returnType: WdlType;
}
```

```ts
interface WdlFunctionParameter {
  name: string;
  types: WdlType[];
  required: boolean;
  variadic?: boolean;
  description?: string;
}
```

Define:

```ts
type WdlType =
  | "string"
  | "integer"
  | "float"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "null"
  | "any"
  | "unknown";
```

Suggested categories:

```text
String
Collection
Logical
Conversion
Math
DateTime
Workflow
URI
JSON/XML
```

Function metadata must be data-driven.

Do not create classes such as:

```text
SubstringFunction
ConcatFunction
EqualsFunction
```

unless a particular function genuinely requires custom semantic logic.

---

# 15. Function Catalog Validation

Create automated validation tests for every function definition.

Validate:

- Unique function names
- At least one signature
- Parameter names exist
- Parameters have at least one supported type
- Every signature has a return type
- Optional/required ordering is valid
- Variadic metadata is valid
- Documentation URLs are structurally valid
- Duplicate signatures are not introduced accidentally

Treat catalog data like application code.

---

# 16. Phase 8 — WDL Type Inference

Implement lightweight static type inference.

Examples:

```text
'Anthony'
```

returns:

```text
string
```

```text
42
```

returns:

```text
integer
```

```text
3.14
```

returns:

```text
float
```

```text
true
```

returns:

```text
boolean
```

Known function calls derive their output type from the function catalog.

Example:

```text
toLower('ANTHONY')
```

becomes:

```text
StringLiteral
    ↓ string

toLower(string)
    ↓ string
```

Dynamic runtime values should use:

```text
any
```

or:

```text
unknown
```

when their exact type cannot be proven.

Example:

```text
outputs('Get_User')
```

must not pretend that V1 knows the schema returned by `Get_User`.

---

# 17. Phase 9 — WDL Analyzer and Diagnostics

Create diagnostics independent of VS Code.

Example structure:

```ts
interface WdlDiagnostic {
  code: string;
  message: string;
  severity: "error" | "warning" | "information";
  range: SourceRange;
}
```

Use stable diagnostic IDs.

Suggested ranges:

```text
WDL1000 Parser / Syntax
WDL1100 Unknown Functions
WDL1200 Argument Counts
WDL1300 Argument Types
```

Examples:

## Unknown Function

```text
toLowerCase('Anthony')
^^^^^^^^^^^
```

```text
WDL1101:
Unknown function 'toLowerCase'.
```

## Argument Count

```text
equals('Anthony')
^^^^^^^^^^^^^^^^^
```

```text
WDL1201:
equals() expects 2 arguments but received 1.
```

## Argument Type

```text
substring('Anthony', 'two')
                     ^^^^^
```

```text
WDL1301:
Argument 'startIndex' expects an integer but received a string.
```

Avoid false positives.

If an argument evaluates to:

```text
any
```

or:

```text
unknown
```

do not report an incompatible-type diagnostic unless the mismatch can actually be proven.

---

# 18. Phase 10 — VS Code Formatting Providers

Connect the standalone WDL formatter to VS Code.

Register:

- Document formatting
- Range/selection formatting where practical

Architecture:

```text
VS Code Document
      ↓
Document Analysis Service
      ↓
WDL Parser
      ↓
AST
      ↓
WDL Formatter
      ↓
VS Code TextEdit
```

Do not duplicate formatting logic in the provider.

Add settings:

```text
powerAutomateWdlExpressions.format.indentSize
```

Default:

```text
4
```

and:

```text
powerAutomateWdlExpressions.format.useTabs
```

Default:

```text
false
```

### Acceptance Criteria

Native VS Code:

```text
Format Document
```

must correctly format `.wdlexpr` documents.

---

# 19. Phase 11 — Hover Provider

When the cursor is positioned over a known function, show structured documentation.

Example:

```text
substring('Anthony', 0, 3)
^^^^^^^^^
```

Hover should show content approximately equivalent to:

```text
substring(
    text: string,
    startIndex: integer,
    length?: integer
): string
```

Followed by:

- Description
- Parameter descriptions
- Return type
- Example
- Microsoft documentation link when available

Use AST source ranges to determine which function is under the cursor.

Do not regex the current editor line.

---

# 20. Phase 12 — Signature Help

Implement native VS Code signature help.

Trigger on:

```text
(
,
```

Given:

```text
substring(
    variables('Name'),
    0,
    |
)
```

the active parameter should be:

```text
length?: integer
```

The implementation must determine:

1. Which `FunctionCallNode` contains the cursor
2. Which argument position contains the cursor
3. Which signatures apply
4. Which signature parameter is active

Nested calls must work correctly.

Example:

```text
if(
    equals(
        variables('Name'),
        |
    ),
    ...
)
```

Signature help must display information for:

```text
equals
```

not:

```text
if
```

---

# 21. Phase 13 — Function Completion

Implement function-name autocomplete.

Typing:

```text
sub|
```

should return applicable catalog matches such as:

```text
substring
sub
subtractFromTime
```

Each completion item should include:

- Function name
- Function category
- Description
- Signature
- Documentation
- Snippet insertion

Example snippet:

```text
substring(${1:text}, ${2:startIndex}, ${3:length})
```

Users should be able to tab between parameters.

Do not implement flow-context completion in V1 for:

```text
variables('...')
outputs('...')
items('...')
```

Those require knowledge of a real flow definition and belong to a future release.

---

# 22. Phase 14 — VS Code Diagnostics

Create a VS Code diagnostic collection.

Flow:

```text
Document Change
      ↓
Document Analysis Service
      ↓
Parse
      ↓
Analyze
      ↓
WdlDiagnostic[]
      ↓
VS Code Diagnostic[]
```

Debounce updates appropriately.

Diagnostics should update while the user types.

Clear them when:

- The document closes
- The document's language changes away from `power-automate-wdl-expression`

Initial diagnostics:

- Parser errors
- Unknown functions
- Invalid argument count
- Proven incompatible argument types

Avoid aggressively flagging incomplete expressions while the user is actively typing when the fault-tolerant AST can represent them reasonably.

---

# 23. Phase 15 — Utility Commands

Add the following commands:

```text
Power Automate: New WDL Expression
Power Automate: Format WDL Expression
Power Automate: Minify WDL Expression
```

## New WDL Expression

Open a new untitled document and assign:

```text
power-automate-wdl-expression
```

as its language mode.

## Format WDL Expression

If text is selected:

```text
format the selection
```

Otherwise:

```text
format the complete document
```

## Minify WDL Expression

Convert:

```text
if(
    equals(
        variables('Name'),
        ''
    ),
    'Unknown',
    variables('Name')
)
```

into:

```text
if(equals(variables('Name'),''),'Unknown',variables('Name'))
```

Minification must use the parser/AST.

Do not use regex.

---

# 24. Phase 16 — WDL Expression Test Corpus

Create a substantial real-world expression fixture library.

## Simple

```text
concat('Hello ', 'World')
```

## Nested

```text
if(
    empty(variables('Name')),
    'Unknown',
    trim(variables('Name'))
)
```

## Property Access

```text
outputs('Get_User')?['body/Email']
```

## Complex

```text
if(
    equals(
        toLower(
            trim(
                coalesce(
                    outputs('Get_User')?['body/Email'],
                    ''
                )
            )
        ),
        'test@contoso.com'
    ),
    concat(
        'Hello ',
        outputs('Get_User')?['body/DisplayName']
    ),
    'Unknown'
)
```

## Incomplete

```text
concat(
```

```text
if(equals(
```

```text
substring('Hello',
```

```text
outputs('Get_User')?[
```

Create golden fixtures for:

- Lexer output
- AST output
- Formatter output
- Analyzer diagnostics

Every parser or formatter bug discovered later must receive a regression fixture.

---

# 25. Phase 17 — VS Code Integration Tests

Create integration tests for the actual extension.

Verify:

## Language Registration

Opening:

```text
test.wdlexpr
```

sets:

```text
power-automate-wdl-expression
```

## Commands

Verify registration of:

```text
Power Automate: New WDL Expression
Power Automate: Format WDL Expression
Power Automate: Minify WDL Expression
```

## Formatting

Verify native formatting returns expected edits.

## Hover

Hovering known functions returns documentation.

## Completion

Known prefixes return catalog matches.

## Signature Help

Active nested function and parameter are detected correctly.

## Diagnostics

Invalid WDL expressions produce expected diagnostics.

Core language tests should remain independent from VS Code and run much faster than extension-host tests.

---

# 26. Phase 18 — Document Analysis and Parse Caching

Do not independently parse the same document for every provider.

Create:

```text
DocumentAnalysisService
```

Conceptually:

```text
                  ┌────────────────────┐
Document Change → │ Document Analysis  │
                  │      Service       │
                  └─────────┬──────────┘
                            │
                            ▼
                       Parse Result
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
           Hover       Signature Help   Diagnostics
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                         Formatter
```

Cache analysis by:

```text
document URI
+
document version
```

When the document version changes, invalidate the cached result.

Do not optimize further unless profiling identifies a real performance problem.

---

# 27. Phase 19 — Extension Settings

Keep settings minimal.

Initial configuration:

```json
{
  "powerAutomateWdlExpressions.format.indentSize": 4,
  "powerAutomateWdlExpressions.format.useTabs": false,
  "powerAutomateWdlExpressions.diagnostics.enabled": true
}
```

Future settings may include:

```text
Formatter line width
Validation strictness
Completion behavior
Documentation verbosity
```

Do not add options without an identified user need.

---

# 28. Phase 20 — Documentation

Create a polished Marketplace README.

## Title

```text
Power Automate WDL Expression Tools
```

## Description

Explain that the extension provides tooling for Microsoft Power Automate / Logic Apps Workflow Definition Language expressions.

## Before

```text
if(equals(trim(variables('Name')),''),'Unknown',variables('Name'))
```

## After

```text
if(
    equals(
        trim(
            variables('Name')
        ),
        ''
    ),
    'Unknown',
    variables('Name')
)
```

Document:

- `.wdlexpr` files
- Syntax highlighting
- Formatting
- Hover documentation
- IntelliSense
- Signature help
- Diagnostics
- Scratchpad command

## Getting Started

Option 1:

```text
Command Palette
→ Power Automate: New WDL Expression
```

Option 2:

```text
Create:
example.wdlexpr
```

## Known Limitations

Explicitly document that V1 does not know:

- Actual flow action names
- Actual initialized variables
- Connector response schemas
- Trigger schemas
- Runtime values
- Environment-specific metadata

Therefore:

```text
outputs('Some_Action')
```

cannot initially be validated against a real Power Automate flow.

---

# 29. Phase 21 — CI

Create GitHub Actions.

Every pull request should run:

```text
Install
   ↓
Lint
   ↓
Type Check
   ↓
Unit Tests
   ↓
Build
```

Add extension integration tests where practical.

Release workflow:

```text
Build
  ↓
Test
  ↓
Package VSIX
  ↓
Create GitHub Release
  ↓
Attach VSIX
```

Do not automate Marketplace publication until the release process has been tested manually.

---

# 30. Phase 22 — Marketplace Packaging

Configure Marketplace metadata:

```text
README.md
CHANGELOG.md
LICENSE
repository
bugs
icon
categories
keywords
```

Suggested keywords:

```text
Power Automate
Power Platform
WDL
Workflow Definition Language
WDL Expression
Logic Apps
Microsoft
Expression
Formatter
IntelliSense
```

Package using current VS Code Marketplace tooling.

Expected artifact:

```text
power-automate-wdl-expression-tools-x.y.z.vsix
```

Install the VSIX manually and smoke-test it before publication.

---

# 31. V1 Definition of Done

V1 is complete when the following work reliably.

## Files and Language

- `.wdlexpr` recognized automatically
- `Power Automate WDL Expression` appears in language selection
- New scratchpad command works

## Editing

- Parentheses auto-close
- Brackets auto-close
- Quotes auto-close
- Bracket matching works

## Highlighting

- Functions
- Strings
- Numbers
- Boolean/null literals
- Delimiters
- Property/index access
- Expression operators

## Parsing

- Nested functions
- Literals
- Property access
- Safe access
- Incomplete expressions
- Accurate source ranges

## Formatting

- Format Document
- Format Selection where practical
- Minify
- Idempotent formatting
- Semantic round-trip preservation

## Language Intelligence

- Function hover
- Parameter descriptions
- Return types
- Signature help
- Function completion
- Snippet insertion

## Diagnostics

- Parser errors
- Unknown functions
- Argument-count errors
- Basic provable type errors

## Quality

- Lexer tests
- Parser tests
- Formatter golden tests
- Analyzer tests
- Function catalog tests
- VS Code integration tests
- CI
- VSIX
- Marketplace-ready README

---

# 32. Explicitly Out of Scope for V1

Do not implement:

- Power Platform authentication
- Power Automate API integration
- Downloading flows
- Editing flows
- Deploying flows
- Flow action discovery
- Connector schema discovery
- Dynamic-content browser
- Variable-name completion
- Action-name completion
- Trigger-name completion
- Full exported workflow JSON validation
- Language Server Protocol
- Webview editor
- Custom VS Code color theme
- AI expression generation
- Runtime documentation scraping
- Default `.wdl` file association

These belong to future phases.

---

# 33. Future V2 — Flow-Aware WDL Intelligence

Design V1 so that a future release can load a real flow definition.

Potential command:

```text
Power Automate: Load Flow Definition
```

Future model:

```ts
interface FlowContext {
  actions: ActionDefinition[];
  variables: VariableDefinition[];
  triggers: TriggerDefinition[];
  scopes: ScopeDefinition[];
}
```

Then:

```text
outputs('
```

could suggest:

```text
Get_User
Get_Items
Create_Item
Send_Email
```

and:

```text
variables('
```

could suggest initialized variables.

Validation could identify:

```text
outputs('Does_Not_Exist')
         ^^^^^^^^^^^^^^
```

and report:

```text
Unknown action 'Does_Not_Exist'.
```

This is a future requirement only.

Do not implement it in V1.

---

# 34. Future V3 — Full WDL Workflow Awareness

A later version may extend beyond standalone expressions and understand WDL expressions embedded in exported workflow JSON.

Example:

```json
{
  "inputs": {
    "value": "@concat('Hello ', variables('Name'))"
  }
}
```

Possible future capabilities:

- Detect embedded `@...` expressions
- Detect `@{...}` interpolation expressions
- Validate expressions inside workflow definitions
- Understand action and scope relationships
- Validate runtime references
- Provide navigation between expressions and referenced actions

This is explicitly outside V1.

---

# 35. Future V4 — Extract the WDL Language Engine

If the language engine becomes useful outside the VS Code extension, extract:

```text
src/language/
```

into a package such as:

```text
@aepcodes/wdl-expression-language
```

Potential consumers:

```text
WDL Expression Engine
        │
        ├── VS Code Extension
        ├── CLI
        ├── Website
        ├── CI Validation
        └── Language Server
```

Do not create the package prematurely.

Maintain the dependency boundary now so extraction later is straightforward.

---

# 36. Coding Rules for Codex

Follow these rules throughout implementation.

1. Use TypeScript strict mode.

2. `src/language` must never import `vscode`.

3. Use WDL-specific names for core language classes.

4. Do not use TypeScript `any` unless an external integration genuinely requires it.

5. The conceptual WDL type `any` must be represented as a value in the WDL type system, not TypeScript `any`.

6. Do not use regex as a substitute for AST analysis for:
   - Formatting
   - Hover
   - Signature help
   - Argument detection
   - Diagnostics
   - Semantic analysis

7. Regex is acceptable for TextMate lexical highlighting.

8. Every AST node must contain accurate source ranges.

9. Incomplete source text is expected editor input.

10. Parser recovery is a first-class feature.

11. Prefer data-driven function definitions.

12. Avoid function-specific analyzer code unless necessary.

13. Avoid false-positive diagnostics.

14. Preserve `any` and `unknown` when runtime information cannot be determined statically.

15. Every parser bug receives a regression test.

16. Every formatter bug receives a regression test.

17. Formatting must be idempotent.

18. Formatting must preserve expression meaning.

19. The WDL language engine must run independently from VS Code.

20. Do not implement future-phase functionality opportunistically.

21. Keep commits focused and logically grouped.

22. Do not introduce `.paexpr`.

23. Do not register `.wdl` by default.

24. `.wdlexpr` is the canonical standalone WDL-expression file extension for this project.

---

# 37. Implementation Sequence

Implement in approximately this order:

```text
1. Extension scaffold
        ↓
2. .wdlexpr language registration
        ↓
3. TextMate syntax highlighting
        ↓
4. WDL Lexer
        ↓
5. WDL AST
        ↓
6. Fault-tolerant WDL Parser
        ↓
7. Parser test corpus
        ↓
8. WDL Formatter
        ↓
9. Formatter tests
        ↓
10. WDL Function Catalog
        ↓
11. Initial function definitions
        ↓
12. WDL Type Inference
        ↓
13. WDL Analyzer
        ↓
14. Formatting Provider
        ↓
15. Hover Provider
        ↓
16. Signature Help
        ↓
17. Completion Provider
        ↓
18. VS Code Diagnostics
        ↓
19. Utility Commands
        ↓
20. Document Analysis Cache
        ↓
21. Integration Tests
        ↓
22. README / Marketplace Assets
        ↓
23. CI
        ↓
24. VSIX Package
```

Do not start a VS Code provider before the corresponding language-engine capability exists.

---

# 38. Development Checkpoints

## Checkpoint A — Extension Shell

Deliver:

```text
VS Code extension scaffold
.wdlexpr registration
Power Automate WDL Expression language mode
Syntax highlighting
New WDL Expression command
```

The extension should already be installable and visually useful.

---

## Checkpoint B — WDL Parser

Deliver:

```text
WdlLexer
AST
WdlParser
Fault tolerance
Source ranges
Parser tests
```

Provide a development/test mechanism capable of showing the AST for:

```text
if(equals(variables('Name'),'Anthony'),true,false)
```

Do not proceed until parser fixtures are stable.

---

## Checkpoint C — WDL Formatter

Deliver:

```text
AST formatter
Format Document
Format Selection
Minify
Golden tests
Idempotency tests
Round-trip tests
```

This should become the first feature suitable for daily use.

---

## Checkpoint D — WDL Documentation Intelligence

Deliver:

```text
Function catalog
Hover
Signature help
Autocomplete
Function snippets
```

At this point the extension should feel like a genuine language extension.

---

## Checkpoint E — WDL Static Analysis

Deliver:

```text
Type inference
Unknown-function diagnostics
Argument-count validation
Basic argument-type validation
Problems panel integration
```

This is the target for the initial serious Marketplace release.

---

## Checkpoint F — Release

Deliver:

```text
Integration tests
CI
README
CHANGELOG
VSIX
Marketplace metadata
```

---

# 39. First Codex Implementation Task

Begin with **Checkpoint A only**.

Do not attempt the complete implementation in a single coding pass.

For the first iteration:

1. Scaffold the TypeScript VS Code extension.
2. Set the extension working name to `Power Automate WDL Expression Tools`.
3. Register the language ID:

   ```text
   power-automate-wdl-expression
   ```

4. Register:

   ```text
   .wdlexpr
   ```

   as the canonical file extension.

5. Add:

   ```text
   language-configuration.json
   ```

6. Add:

   ```text
   power-automate-wdl-expression.tmLanguage.json
   ```

7. Implement:

   ```text
   Power Automate: New WDL Expression
   ```

8. Create initial unit and integration-test infrastructure.
9. Add an initial README.
10. Launch the extension successfully in the Extension Development Host.
11. Verify a `.wdlexpr` file automatically activates the correct language.
12. Verify basic WDL expression syntax highlighting.

At completion, provide a report containing:

```text
Files created
Architecture established
Commands registered
Language contributions registered
Tests implemented
Manual verification steps
Known limitations
Recommended next task
```

The recommended next task must be:

```text
Checkpoint B — WDL Lexer + AST + Fault-Tolerant Parser
```

Do not begin Checkpoint B until Checkpoint A is functioning.
