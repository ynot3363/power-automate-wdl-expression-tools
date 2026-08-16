# V1 VSIX smoke test

Record the VSIX filename, SHA-256 checksum, operating system, VS Code version,
and pass/fail result for every numbered section. Test the packaged VSIX, not an
Extension Development Host build.

## 1. Build and install

```sh
npm ci
npm run test:all
npm run package:vsix
npm run package:verify
code --install-extension ./power-automate-wdl-expression-tools-1.0.0.vsix --force
```

- Confirm all automated checks pass.
- Confirm the VSIX name is exactly
  `power-automate-wdl-expression-tools-1.0.0.vsix`.
- Restart VS Code and confirm **Power Automate WDL Expression Tools** version
  `1.0.0` appears in the installed extensions list with its icon, README,
  changelog, repository, and AGPL-3.0 license.

## 2. Language registration and editor behavior

1. Create `smoke.wdlexpr` and confirm the status bar selects
   **Power Automate WDL Expression** automatically.
2. Open the language picker and confirm that display name is available.
3. Confirm a `.wdl` and a `.paexpr` file remain plain text unless manually
   assigned a language.
4. Type `(`, `[`, and `'`; confirm each closes automatically.
5. Put the cursor beside matching parentheses and brackets; confirm VS Code
   highlights the matching delimiter.

Paste this expression and confirm functions, strings, numbers, booleans,
`null`, delimiters, and property/index access receive theme-aware highlighting:

```wdl
if(equals(toLower(variables('Status')),'approved'),body('Get_items')?['value'][0],null)
```

## 3. Scratch expression command

1. Run **Power Automate: New WDL Expression** from the Command Palette.
2. Confirm an untitled editor opens in the WDL expression language mode.
3. Confirm syntax highlighting, completion, hover, signature help, formatting,
   and diagnostics work in the untitled editor.

## 4. Formatting and minification

Paste this one-line expression:

```wdl
if(equals(1,1),concat('yes','!'),'no')
```

1. Run VS Code **Format Document** and confirm readable four-space nested
   indentation.
2. Undo once and confirm the original one-line expression returns; redo and
   confirm the formatted expression returns.
3. Set `powerAutomateWdlExpressions.format.indentSize` to `2`, format again,
   and confirm two-space indentation.
4. Set `powerAutomateWdlExpressions.format.useTabs` to `true`, format again,
   and confirm tab indentation. Reset both settings afterward.
5. Run **Power Automate: Minify WDL Expression** and confirm the expression
   becomes one compact line without changing string values.
6. Run **Power Automate: Format WDL Expression** and confirm it expands again.
7. Put two expressions on separate lines, select exactly the second expression,
   and confirm the format command changes only that selection.
8. Select an incomplete fragment such as `concat('yes'` and confirm formatting
   leaves it unchanged and explains why.
9. Add two cursors and run the command; confirm it leaves the document unchanged
   and explains the single-selection requirement.
10. Run format/minify in a plain-text file and with no active editor; confirm no
    text is changed and the extension gives appropriate feedback.

## 5. Hover, completion, and signature help

Use:

```wdl
if(equals(1,1),substring(toLower('HELLO'),1,3),'no')
```

1. Hover `if`, `equals`, `substring`, and `toLower`; confirm each hover shows a
   signature, description, parameters, return type, example, and Microsoft
   documentation link.
2. Hover function-like text inside a quoted string and an unknown function;
   confirm neither receives catalog documentation.
3. Type `sub` in an expression position; confirm completion includes `sub`,
   `substring`, and `subtractFromTime` with function details.
4. Accept `substring`; confirm a call snippet is inserted and Tab moves through
   `text`, `startIndex`, and optional `length` placeholders.
5. Confirm completion does not appear inside a string or after property access.
6. Type `concat(`; confirm signature help selects the first parameter.
7. Type `if(equals(1, `; confirm signature help selects the second `equals`
   parameter rather than the enclosing `if` call.
8. Move among arguments in a complete call and confirm the active parameter
   follows the cursor.

## 6. Diagnostics and lifecycle

Test each expression separately and confirm the Problems panel code family:

| Expression | Expected result |
| --- | --- |
| `concat('value',` | One or more `WDL1000` syntax diagnostics |
| `mystery()` | A `WDL1100`-family unknown-function diagnostic |
| `equals(1)` | A `WDL1200`-family argument-count diagnostic |
| `substring(true, 0)` | A `WDL1300`-family argument-type diagnostic |
| `substring(variables('Text'), 0)` | No speculative type diagnostic for the runtime value |

1. Fix each invalid expression and confirm its diagnostics clear after the
   short debounce.
2. Disable `powerAutomateWdlExpressions.diagnostics.enabled`; confirm all WDL
   diagnostics clear. Re-enable it and confirm invalid open documents are
   analyzed again.
3. Change an invalid document's language to Plain Text; confirm WDL diagnostics
   clear. Change it back and confirm they return.
4. Close an invalid WDL document and confirm it leaves no stale Problems entry.

## 7. Isolation, reload, and uninstall

1. Open JavaScript, JSON, and plain-text files and confirm the WDL extension
   adds no WDL diagnostics, hover, completion, or formatting to them.
2. Reload the VS Code window and repeat one hover, completion, format, and
   diagnostic check.
3. Disable the extension and confirm WDL provider behavior disappears; re-enable
   it and confirm behavior returns.
4. Uninstall the extension, restart VS Code, and confirm the extension is gone.
5. Reinstall the same VSIX and repeat the `.wdlexpr` recognition, formatting,
   and diagnostics checks.

Do not create or push a version tag, create a GitHub Release, or publish to the
Marketplace until every required item passes and any failures are resolved.
