# Function catalog

The WDL function catalog is maintained in
`src/language/functions/initialFunctionDefinitions.ts` and
`src/language/functions/microsoftFunctionDefinitions.ts`. The editor-independent
`wdlFunctionCatalog` singleton combines and validates those sources at startup.

## Provenance

- Source: [Microsoft's workflow expression function reference](https://learn.microsoft.com/en-us/azure/logic-apps/expression-functions-reference)
- Applies to: Power Automate cloud flows and Azure Logic Apps
- Reviewed: 2026-08-16

The catalog covers all 137 functions in the Microsoft reference reviewed above,
including the documented deprecated aliases `decodeBase64` and `parse`. The
`microsoftFunctionReferenceNames` snapshot is asserted against the loaded
catalog in unit tests so missing or extra names fail validation.

Signatures and return types are intentionally conservative where workflow data
is only known at runtime. The catalog powers function recognition, completion,
signature help, hover documentation, and static argument diagnostics without
making network requests while the editor is open.

Function names are matched case-insensitively because WDL expression function
names are case-insensitive. String values and property names remain
case-sensitive.

When Microsoft changes the reference, update the definitions and the reference
name snapshot together, then advance the reviewed date above.
