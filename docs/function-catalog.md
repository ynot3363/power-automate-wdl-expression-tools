# Function catalog

The initial WDL function catalog is maintained in
`src/language/functions/initialFunctionDefinitions.ts`. The editor-independent
`wdlFunctionCatalog` singleton loads and validates that source at startup.

## Provenance

- Source: [Microsoft's workflow expression function reference](https://learn.microsoft.com/en-us/azure/logic-apps/expression-functions-reference)
- Applies to: Power Automate cloud flows and Azure Logic Apps
- Reviewed: 2026-08-16

The initial scope favors common Power Automate expressions. It includes the
functions named by the implementation plan and at least one definition in every
planned category. Later catalog stories can expand coverage without changing
the catalog API.

Function names are matched case-insensitively because WDL expression function
names are case-insensitive. String values and property names remain
case-sensitive.
