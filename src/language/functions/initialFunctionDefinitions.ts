import type { WdlFunctionDefinition } from "./functionDefinition";
import { microsoftFunctionDefinitions } from "./microsoftFunctionDefinitions";

const referenceUrl =
  "https://learn.microsoft.com/en-us/azure/logic-apps/expression-functions-reference";

const curatedFunctionDefinitions = [
  {
    name: "body",
    category: "Workflow",
    description: "Returns an action's body output at runtime.",
    signatures: [
      {
        parameters: [
          {
            name: "actionName",
            types: ["string"],
            required: true,
            description: "The name of the action whose body to return.",
          },
        ],
        returnType: "any",
      },
    ],
    examples: [{ expression: "body('Get_items')", description: "Gets an action body." }],
    documentationUrl: `${referenceUrl}#body`,
  },
  {
    name: "coalesce",
    category: "Logical",
    description: "Returns the first non-null value from one or more values.",
    signatures: [
      {
        parameters: [
          {
            name: "value",
            types: ["any"],
            required: true,
            description: "The first value to test for null.",
          },
          {
            name: "additionalValues",
            types: ["any"],
            required: true,
            variadic: true,
            description: "Additional values to test in order.",
          },
        ],
        returnType: "any",
      },
    ],
    examples: [{ expression: "coalesce(null, 'fallback')", result: "fallback" }],
    documentationUrl: `${referenceUrl}#coalesce`,
  },
  {
    name: "concat",
    category: "String",
    description: "Combines two or more strings and returns the combined string.",
    signatures: [
      {
        parameters: [
          {
            name: "text",
            types: ["string"],
            required: true,
            description: "The first string to combine.",
          },
          {
            name: "additionalText",
            types: ["string"],
            required: true,
            variadic: true,
            description: "One or more additional strings to combine.",
          },
        ],
        returnType: "string",
      },
    ],
    examples: [{ expression: "concat('Hello', ' ', 'world')", result: "Hello world" }],
    documentationUrl: `${referenceUrl}#concat`,
  },
  {
    name: "empty",
    category: "Logical",
    description: "Tests whether a string, array, or object is empty.",
    signatures: [
      {
        parameters: [
          {
            name: "collection",
            types: ["string", "array", "object"],
            required: true,
            description: "The collection to test.",
          },
        ],
        returnType: "boolean",
      },
    ],
    examples: [{ expression: "empty('')", result: "true" }],
    documentationUrl: `${referenceUrl}#empty`,
  },
  {
    name: "equals",
    category: "Logical",
    description: "Tests whether two values are equivalent.",
    signatures: [
      {
        parameters: [
          {
            name: "left",
            types: ["any"],
            required: true,
            description: "The first value to compare.",
          },
          {
            name: "right",
            types: ["any"],
            required: true,
            description: "The second value to compare.",
          },
        ],
        returnType: "boolean",
      },
    ],
    examples: [{ expression: "equals(1, 1)", result: "true" }],
    documentationUrl: `${referenceUrl}#equals`,
  },
  {
    name: "first",
    category: "Collection",
    description: "Returns the first item from a string or array.",
    signatures: [
      {
        parameters: [
          {
            name: "collection",
            types: ["string"],
            required: true,
            description: "The string whose first character to return.",
          },
        ],
        returnType: "string",
      },
      {
        parameters: [
          {
            name: "collection",
            types: ["array"],
            required: true,
            description: "The array whose first item to return.",
          },
        ],
        returnType: "any",
      },
    ],
    examples: [{ expression: "first(createArray(0, 1, 2))", result: "0" }],
    documentationUrl: `${referenceUrl}#first`,
  },
  {
    name: "if",
    category: "Logical",
    description: "Returns one of two values based on whether an expression is true or false.",
    signatures: [
      {
        parameters: [
          {
            name: "expression",
            types: ["boolean"],
            required: true,
            description: "The condition to evaluate.",
          },
          {
            name: "valueIfTrue",
            types: ["any"],
            required: true,
            description: "The value returned when the condition is true.",
          },
          {
            name: "valueIfFalse",
            types: ["any"],
            required: true,
            description: "The value returned when the condition is false.",
          },
        ],
        returnType: "any",
      },
    ],
    examples: [{ expression: "if(equals(1, 1), 'yes', 'no')", result: "yes" }],
    documentationUrl: `${referenceUrl}#if`,
  },
  {
    name: "items",
    category: "Workflow",
    description: "Returns the current item from a specified Foreach or Until loop.",
    signatures: [
      {
        parameters: [
          {
            name: "loopName",
            types: ["string"],
            required: true,
            description: "The name of the loop.",
          },
        ],
        returnType: "any",
      },
    ],
    examples: [{ expression: "items('Apply_to_each')", description: "Gets the current loop item." }],
    documentationUrl: `${referenceUrl}#items`,
  },
  {
    name: "json",
    category: "JSON/XML",
    description: "Returns the JSON value or object for a string or XML value.",
    signatures: [
      {
        parameters: [
          {
            name: "value",
            types: ["string", "object"],
            required: true,
            description: "The string or XML-compatible object to convert.",
          },
        ],
        returnType: "any",
      },
    ],
    examples: [{ expression: "json('{\"name\":\"Ada\"}')", result: "{\"name\":\"Ada\"}" }],
    documentationUrl: `${referenceUrl}#json`,
  },
  {
    name: "outputs",
    category: "Workflow",
    description: "Returns an action's output at runtime.",
    signatures: [
      {
        parameters: [
          {
            name: "actionName",
            types: ["string"],
            required: true,
            description: "The name of the action whose output to return.",
          },
        ],
        returnType: "any",
      },
    ],
    examples: [{ expression: "outputs('Compose')", description: "Gets an action output." }],
    documentationUrl: `${referenceUrl}#outputs`,
  },
  {
    name: "string",
    category: "Conversion",
    description: "Returns the string version of a value.",
    signatures: [
      {
        parameters: [
          {
            name: "value",
            types: ["any"],
            required: true,
            description: "The value to convert to a string.",
          },
        ],
        returnType: "string",
      },
    ],
    examples: [{ expression: "string(10)", result: "10" }],
    documentationUrl: `${referenceUrl}#string`,
  },
  {
    name: "sub",
    category: "Math",
    description: "Subtracts the second number from the first number.",
    signatures: [
      {
        parameters: [
          {
            name: "minuend",
            types: ["number"],
            required: true,
            description: "The number from which to subtract.",
          },
          {
            name: "subtrahend",
            types: ["number"],
            required: true,
            description: "The number to subtract.",
          },
        ],
        returnType: "number",
      },
    ],
    examples: [{ expression: "sub(10.3, 0.3)", result: "10" }],
    documentationUrl: `${referenceUrl}#sub`,
  },
  {
    name: "substring",
    category: "String",
    description: "Returns characters from a string starting at a zero-based index.",
    signatures: [
      {
        parameters: [
          {
            name: "text",
            types: ["string"],
            required: true,
            description: "The source string.",
          },
          {
            name: "startIndex",
            types: ["integer"],
            required: true,
            description: "The zero-based starting index.",
          },
          {
            name: "length",
            types: ["integer"],
            required: false,
            description: "The optional number of characters to return.",
          },
        ],
        returnType: "string",
      },
    ],
    examples: [{ expression: "substring('hello world', 6, 5)", result: "world" }],
    documentationUrl: `${referenceUrl}#substring`,
  },
  {
    name: "subtractFromTime",
    category: "DateTime",
    description: "Subtracts a number of time units from a timestamp.",
    signatures: [
      {
        parameters: [
          {
            name: "timestamp",
            types: ["string"],
            required: true,
            description: "The timestamp to update.",
          },
          {
            name: "interval",
            types: ["integer"],
            required: true,
            description: "The number of time units to subtract.",
          },
          {
            name: "timeUnit",
            types: ["string"],
            required: true,
            description: "The time unit, such as Day, Hour, or Minute.",
          },
          {
            name: "format",
            types: ["string"],
            required: false,
            description: "An optional .NET date and time format string.",
          },
        ],
        returnType: "string",
      },
    ],
    examples: [
      {
        expression: "subtractFromTime('2018-01-02T00:00:00Z', 1, 'Day')",
        result: "2018-01-01T00:00:00.0000000Z",
      },
    ],
    documentationUrl: `${referenceUrl}#subtractfromtime`,
  },
  {
    name: "toLower",
    category: "String",
    description: "Returns a string in lowercase form.",
    signatures: [
      {
        parameters: [
          {
            name: "text",
            types: ["string"],
            required: true,
            description: "The string to convert.",
          },
        ],
        returnType: "string",
      },
    ],
    examples: [{ expression: "toLower('Hello World')", result: "hello world" }],
    documentationUrl: `${referenceUrl}#tolower`,
  },
  {
    name: "toUpper",
    category: "String",
    description: "Returns a string in uppercase form.",
    signatures: [
      {
        parameters: [
          {
            name: "text",
            types: ["string"],
            required: true,
            description: "The string to convert.",
          },
        ],
        returnType: "string",
      },
    ],
    examples: [{ expression: "toUpper('Hello World')", result: "HELLO WORLD" }],
    documentationUrl: `${referenceUrl}#toupper`,
  },
  {
    name: "triggerBody",
    category: "Workflow",
    description: "Returns the trigger's body output at runtime.",
    signatures: [{ parameters: [], returnType: "any" }],
    examples: [{ expression: "triggerBody()", description: "Gets the current trigger body." }],
    documentationUrl: `${referenceUrl}#triggerbody`,
  },
  {
    name: "trim",
    category: "String",
    description: "Removes leading and trailing whitespace from a string.",
    signatures: [
      {
        parameters: [
          {
            name: "text",
            types: ["string"],
            required: true,
            description: "The string to trim.",
          },
        ],
        returnType: "string",
      },
    ],
    examples: [{ expression: "trim('  Hello World  ')", result: "Hello World" }],
    documentationUrl: `${referenceUrl}#trim`,
  },
  {
    name: "uriComponent",
    category: "URI",
    description: "Returns a URI-encoded version of a string.",
    signatures: [
      {
        parameters: [
          {
            name: "value",
            types: ["string"],
            required: true,
            description: "The string to encode for use in a URI.",
          },
        ],
        returnType: "string",
      },
    ],
    examples: [{ expression: "uriComponent('https://example.com/a b')", result: "https%3A%2F%2Fexample.com%2Fa%20b" }],
    documentationUrl: `${referenceUrl}#uricomponent`,
  },
  {
    name: "variables",
    category: "Workflow",
    description: "Returns the value of a specified variable.",
    signatures: [
      {
        parameters: [
          {
            name: "variableName",
            types: ["string"],
            required: true,
            description: "The name of the variable to return.",
          },
        ],
        returnType: "any",
      },
    ],
    examples: [{ expression: "variables('customerName')", description: "Gets a workflow variable." }],
    documentationUrl: `${referenceUrl}#variables`,
  },
] as const satisfies readonly WdlFunctionDefinition[];

export const initialFunctionDefinitions = [
  ...curatedFunctionDefinitions,
  ...microsoftFunctionDefinitions,
] satisfies readonly WdlFunctionDefinition[];
