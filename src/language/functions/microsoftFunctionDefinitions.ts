import { isWdlType, type WdlType } from "../analyzer/wdlTypes";
import type {
  WdlFunctionCategory,
  WdlFunctionDefinition,
  WdlFunctionParameter,
  WdlFunctionSignature,
} from "./functionDefinition";

const referenceUrl =
  "https://learn.microsoft.com/en-us/azure/logic-apps/expression-functions-reference";

interface MicrosoftFunctionSpec {
  readonly name: string;
  readonly category: WdlFunctionCategory;
  readonly description: string;
  readonly signatures: readonly string[];
  readonly example?: string;
  readonly deprecated?: boolean;
}

const additionalFunctionSpecs = [
  { name: "action", category: "Workflow", description: "Returns the current action output at runtime.", signatures: ["->object"] },
  { name: "actions", category: "Workflow", description: "Returns the runtime output for a named action.", signatures: ["actionName:string->object"] },
  { name: "add", category: "Math", description: "Adds two numbers.", signatures: ["left:number,right:number->number"] },
  { name: "addDays", category: "DateTime", description: "Adds days to a timestamp.", signatures: ["timestamp:string,days:integer,format?:string->string"] },
  { name: "addHours", category: "DateTime", description: "Adds hours to a timestamp.", signatures: ["timestamp:string,hours:integer,format?:string->string"] },
  { name: "addMinutes", category: "DateTime", description: "Adds minutes to a timestamp.", signatures: ["timestamp:string,minutes:integer,format?:string->string"] },
  { name: "addProperty", category: "JSON/XML", description: "Adds a property and value to a JSON object.", signatures: ["object:object,property:string,value:any->object"], example: "addProperty(json('{}'), 'name', 'Ada')" },
  { name: "addSeconds", category: "DateTime", description: "Adds seconds to a timestamp.", signatures: ["timestamp:string,seconds:integer,format?:string->string"] },
  { name: "addToTime", category: "DateTime", description: "Adds a number of time units to a timestamp.", signatures: ["timestamp:string,interval:integer,timeUnit:string,format?:string->string"] },
  { name: "and", category: "Logical", description: "Returns true when every supplied expression is true.", signatures: ["expression:boolean,additionalExpressions...:boolean->boolean"] },
  { name: "array", category: "Conversion", description: "Returns an array containing one specified value.", signatures: ["value:any->array"] },
  { name: "base64", category: "Conversion", description: "Returns a base64-encoded string.", signatures: ["value:string->string"] },
  { name: "base64ToBinary", category: "Conversion", description: "Returns binary content from a base64-encoded string.", signatures: ["value:string->any"] },
  { name: "base64ToJson", category: "Conversion", description: "Returns a JSON value from a base64-encoded string.", signatures: ["value:string->any"] },
  { name: "base64ToString", category: "Conversion", description: "Returns decoded text from a base64-encoded string.", signatures: ["value:string->string"] },
  { name: "binary", category: "Conversion", description: "Returns the binary representation of an input value.", signatures: ["value:any->any"] },
  { name: "bool", category: "Conversion", description: "Returns the Boolean representation of an input value.", signatures: ["value:any->boolean"] },
  { name: "chunk", category: "Collection", description: "Splits a string or array into equal-length chunks.", signatures: ["collection:string/array,length:integer->array"] },
  { name: "contains", category: "Collection", description: "Tests whether a string, array, or object contains a value.", signatures: ["collection:string/array/object,value:any->boolean"] },
  { name: "convertFromUtc", category: "DateTime", description: "Converts a UTC timestamp to a target time zone.", signatures: ["timestamp:string,destinationTimeZone:string,format?:string->string"] },
  { name: "convertTimeZone", category: "DateTime", description: "Converts a timestamp between time zones.", signatures: ["timestamp:string,sourceTimeZone:string,destinationTimeZone:string,format?:string->string"] },
  { name: "convertToUtc", category: "DateTime", description: "Converts a timestamp from a source time zone to UTC.", signatures: ["timestamp:string,sourceTimeZone:string,format?:string->string"] },
  { name: "createArray", category: "Conversion", description: "Creates an array from multiple values.", signatures: ["value:any,additionalValues...:any->array"] },
  { name: "dataUri", category: "Conversion", description: "Returns a data URI for an input value.", signatures: ["value:string->string"] },
  { name: "dataUriToBinary", category: "Conversion", description: "Returns binary content from a data URI.", signatures: ["value:string->any"] },
  { name: "dataUriToString", category: "Conversion", description: "Returns decoded text from a data URI.", signatures: ["value:string->string"] },
  { name: "dateDifference", category: "DateTime", description: "Returns the difference between two dates as a timespan.", signatures: ["startDate:string,endDate:string->string"] },
  { name: "dayOfMonth", category: "DateTime", description: "Returns the day-of-month component of a timestamp.", signatures: ["timestamp:string->integer"] },
  { name: "dayOfWeek", category: "DateTime", description: "Returns the day-of-week component of a timestamp.", signatures: ["timestamp:string->integer"] },
  { name: "dayOfYear", category: "DateTime", description: "Returns the day-of-year component of a timestamp.", signatures: ["timestamp:string->integer"] },
  { name: "decimal", category: "Conversion", description: "Returns a decimal number from a decimal string.", signatures: ["value:string->number"] },
  { name: "decodeBase64", category: "Conversion", description: "Returns decoded text from a base64-encoded string.", signatures: ["value:string->string"], deprecated: true },
  { name: "decodeDataUri", category: "Conversion", description: "Returns decoded binary content from a data URI.", signatures: ["value:string->any"] },
  { name: "decodeUriComponent", category: "Conversion", description: "Decodes escape characters in a URI component.", signatures: ["value:string->string"] },
  { name: "decodeXmlName", category: "JSON/XML", description: "Decodes an encoded XML element name.", signatures: ["name:string->string"] },
  { name: "decodeXmlValue", category: "JSON/XML", description: "Decodes an encoded XML element value.", signatures: ["value:string->string"] },
  { name: "div", category: "Math", description: "Divides one number by another.", signatures: ["dividend:number,divisor:number->number"] },
  { name: "encodeBase64", category: "Conversion", description: "Returns a base64-encoded string.", signatures: ["value:string->string"] },
  { name: "encodeUriComponent", category: "Conversion", description: "Escapes URL-unsafe characters in a string.", signatures: ["value:string->string"] },
  { name: "encodeXmlName", category: "JSON/XML", description: "Encodes a string for use as an XML element name.", signatures: ["name:string->string"] },
  { name: "encodeXmlValue", category: "JSON/XML", description: "Encodes a string for use as an XML element value.", signatures: ["value:string->string"] },
  { name: "endsWith", category: "String", description: "Tests whether a string ends with specified text.", signatures: ["text:string,searchText:string->boolean"] },
  { name: "float", category: "Conversion", description: "Returns a floating-point number from an input value.", signatures: ["value:integer/float/string,locale?:string->float"] },
  { name: "formatDateTime", category: "DateTime", description: "Formats a timestamp using a date and time format.", signatures: ["timestamp:string,format?:string,locale?:string->string"] },
  { name: "formatNumber", category: "String", description: "Formats a number as a string.", signatures: ["number:number,format:string,locale?:string->string"] },
  { name: "formatTimeSpan", category: "DateTime", description: "Formats a timespan using a specified format.", signatures: ["timeSpan:string,format:string,locale?:string->string"] },
  { name: "formDataMultiValues", category: "Workflow", description: "Returns all form-data values matching a key in an action output.", signatures: ["actionName:string,key:string->array"] },
  { name: "formDataValue", category: "Workflow", description: "Returns one form-data value matching a key in an action output.", signatures: ["actionName:string,key:string->string"] },
  { name: "getFutureTime", category: "DateTime", description: "Returns the current timestamp plus specified time units.", signatures: ["interval:integer,timeUnit:string,format?:string->string"] },
  { name: "getPastTime", category: "DateTime", description: "Returns the current timestamp minus specified time units.", signatures: ["interval:integer,timeUnit:string,format?:string->string"] },
  { name: "greater", category: "Logical", description: "Tests whether the first value is greater than the second.", signatures: ["value:number/string,compareTo:number/string->boolean"] },
  { name: "greaterOrEquals", category: "Logical", description: "Tests whether the first value is greater than or equal to the second.", signatures: ["value:number/string,compareTo:number/string->boolean"] },
  { name: "guid", category: "String", description: "Generates a globally unique identifier string.", signatures: ["format?:string->string"] },
  { name: "indexOf", category: "String", description: "Returns the index of the first occurrence of text.", signatures: ["text:string,searchText:string->integer"] },
  { name: "int", category: "Conversion", description: "Returns an integer from a string value.", signatures: ["value:string->integer"] },
  { name: "intersection", category: "Collection", description: "Returns items common to all supplied collections.", signatures: ["collection:array/object,additionalCollections...:array/object->any"] },
  { name: "isFloat", category: "Logical", description: "Tests whether a string represents a floating-point number.", signatures: ["value:string,locale?:string->boolean"] },
  { name: "isInt", category: "Logical", description: "Tests whether a string represents an integer.", signatures: ["value:string->boolean"] },
  { name: "item", category: "Workflow", description: "Returns the current item from a repeating array action.", signatures: ["->any"] },
  { name: "iterationIndexes", category: "Workflow", description: "Returns the current iteration index for a named Until loop.", signatures: ["loopName:string->integer"] },
  { name: "join", category: "Collection", description: "Joins array items into a delimited string.", signatures: ["collection:array,delimiter:string->string"] },
  { name: "last", category: "Collection", description: "Returns the last item from a string or array.", signatures: ["collection:string->string", "collection:array->any"] },
  { name: "lastIndexOf", category: "String", description: "Returns the index of the last occurrence of text.", signatures: ["text:string,searchText:string->integer"] },
  { name: "length", category: "Collection", description: "Returns the number of items in a string or array.", signatures: ["collection:string/array->integer"] },
  { name: "less", category: "Logical", description: "Tests whether the first value is less than the second.", signatures: ["value:number/string,compareTo:number/string->boolean"] },
  { name: "lessOrEquals", category: "Logical", description: "Tests whether the first value is less than or equal to the second.", signatures: ["value:number/string,compareTo:number/string->boolean"] },
  { name: "listCallbackUrl", category: "Workflow", description: "Returns the callback URL for the current webhook trigger or action.", signatures: ["->string"] },
  { name: "max", category: "Math", description: "Returns the highest number from values or an array.", signatures: ["value:number,additionalValues...:number->number", "collection:array->number"] },
  { name: "mergeObjects", category: "JSON/XML", description: "Merges two JSON objects.", signatures: ["object1:object,object2:object->object"] },
  { name: "min", category: "Math", description: "Returns the lowest number from values or an array.", signatures: ["value:number,additionalValues...:number->number", "collection:array->number"] },
  { name: "mod", category: "Math", description: "Returns the remainder from dividing two numbers.", signatures: ["dividend:number,divisor:number->number"] },
  { name: "mul", category: "Math", description: "Multiplies two numbers.", signatures: ["multiplicand1:number,multiplicand2:number->number"] },
  { name: "multipartBody", category: "Workflow", description: "Returns the body for one part of a multipart action output.", signatures: ["actionName:string,index:integer->any"] },
  { name: "not", category: "Logical", description: "Returns the inverse of a Boolean expression.", signatures: ["expression:boolean->boolean"] },
  { name: "nthIndexOf", category: "String", description: "Returns the index of the specified occurrence of text.", signatures: ["text:string,searchText:string,occurrence:integer->integer"] },
  { name: "or", category: "Logical", description: "Returns true when at least one supplied expression is true.", signatures: ["expression:boolean,additionalExpressions...:boolean->boolean"] },
  { name: "parameters", category: "Workflow", description: "Returns a workflow parameter value.", signatures: ["parameterName:string->any"] },
  { name: "parse", category: "Conversion", description: "Returns a JSON value or object from a string or XML value.", signatures: ["value:string/object->any"], deprecated: true },
  { name: "parseDateTime", category: "DateTime", description: "Parses a timestamp string using optional locale and format values.", signatures: ["timestamp:string,locale?:string,format?:string->string"] },
  { name: "pow", category: "Math", description: "Raises a number to a specified power.", signatures: ["base:number,exponent:number->number"] },
  { name: "rand", category: "Math", description: "Returns a random integer within a specified range.", signatures: ["minValue:integer,maxValue:integer->integer"] },
  { name: "range", category: "Math", description: "Returns an integer array beginning at a specified value.", signatures: ["startIndex:integer,count:integer->array"] },
  { name: "removeProperty", category: "JSON/XML", description: "Removes a property from a JSON object.", signatures: ["object:object,property:string->object"] },
  { name: "replace", category: "String", description: "Replaces matching text in a string.", signatures: ["text:string,oldText:string,newText:string->string"] },
  { name: "result", category: "Workflow", description: "Returns inputs and outputs from actions inside a scoped action.", signatures: ["scopedActionName:string->array"] },
  { name: "reverse", category: "Collection", description: "Reverses the order of items in an array.", signatures: ["collection:array->array"] },
  { name: "setProperty", category: "JSON/XML", description: "Sets a property value on a JSON object.", signatures: ["object:object,property:string,value:any->object"] },
  { name: "skip", category: "Collection", description: "Skips items at the start of an array.", signatures: ["collection:array,count:integer->array"] },
  { name: "slice", category: "String", description: "Returns text between start and optional end indexes.", signatures: ["text:string,startIndex:integer,endIndex?:integer->string"] },
  { name: "sort", category: "Collection", description: "Sorts items in an array, optionally by an object property.", signatures: ["collection:array,sortBy?:string->array"] },
  { name: "split", category: "String", description: "Splits text into an array using a delimiter.", signatures: ["text:string,delimiter:string->array"] },
  { name: "startOfDay", category: "DateTime", description: "Returns the start of the day for a timestamp.", signatures: ["timestamp:string,format?:string->string"] },
  { name: "startOfHour", category: "DateTime", description: "Returns the start of the hour for a timestamp.", signatures: ["timestamp:string,format?:string->string"] },
  { name: "startOfMonth", category: "DateTime", description: "Returns the start of the month for a timestamp.", signatures: ["timestamp:string,format?:string->string"] },
  { name: "startsWith", category: "String", description: "Tests whether a string starts with specified text.", signatures: ["text:string,searchText:string->boolean"] },
  { name: "strongEquals", category: "Logical", description: "Tests whether two or more values of the same type are equivalent.", signatures: ["value:any,additionalValues...:any->boolean"] },
  { name: "take", category: "Collection", description: "Returns items from the start of a string or array.", signatures: ["collection:string,count:integer->string", "collection:array,count:integer->array"] },
  { name: "ticks", category: "DateTime", description: "Returns the ticks value for a timestamp.", signatures: ["timestamp:string->integer"] },
  { name: "trigger", category: "Workflow", description: "Returns the trigger output at runtime.", signatures: ["->object"] },
  { name: "triggerFormDataMultiValues", category: "Workflow", description: "Returns all trigger form-data values matching a key.", signatures: ["key:string->array"] },
  { name: "triggerFormDataValue", category: "Workflow", description: "Returns one trigger form-data value matching a key.", signatures: ["key:string->string"] },
  { name: "triggerMultipartBody", category: "Workflow", description: "Returns one part from a multipart trigger output.", signatures: ["index:integer->any"] },
  { name: "triggerOutputs", category: "Workflow", description: "Returns the trigger output at runtime.", signatures: ["->object"] },
  { name: "trimByteOrderMark", category: "String", description: "Removes a byte order mark from text or binary content.", signatures: ["content:string/any->string"] },
  { name: "union", category: "Collection", description: "Returns one collection containing all items from supplied collections.", signatures: ["collection:array/object,additionalCollections...:array/object->any"] },
  { name: "uriComponentToBinary", category: "URI", description: "Returns binary content from a URI-encoded string.", signatures: ["value:string->any"] },
  { name: "uriComponentToString", category: "URI", description: "Returns decoded text from a URI-encoded string.", signatures: ["value:string->string"] },
  { name: "uriHost", category: "URI", description: "Returns the host component of a URI.", signatures: ["uri:string->string"] },
  { name: "uriPath", category: "URI", description: "Returns the path component of a URI.", signatures: ["uri:string->string"] },
  { name: "uriPathAndQuery", category: "URI", description: "Returns the path and query components of a URI.", signatures: ["uri:string->string"] },
  { name: "uriPort", category: "URI", description: "Returns the port component of a URI.", signatures: ["uri:string->integer"] },
  { name: "uriQuery", category: "URI", description: "Returns the query component of a URI.", signatures: ["uri:string->string"] },
  { name: "uriScheme", category: "URI", description: "Returns the scheme component of a URI.", signatures: ["uri:string->string"] },
  { name: "utcNow", category: "DateTime", description: "Returns the current UTC timestamp.", signatures: ["format?:string->string"] },
  { name: "workflow", category: "Workflow", description: "Returns details about the current workflow at runtime.", signatures: ["->object"] },
  { name: "xml", category: "JSON/XML", description: "Returns an XML value from a string or JSON object.", signatures: ["value:any->any"] },
  { name: "xpath", category: "JSON/XML", description: "Returns XML nodes or values matching an XPath expression.", signatures: ["xml:any,xpath:string->any"] },
] as const satisfies readonly MicrosoftFunctionSpec[];

export const microsoftFunctionDefinitions = additionalFunctionSpecs.map(
  createDefinition,
);

export const microsoftFunctionReferenceNames = [
  "action", "actions", "add", "addDays", "addHours", "addMinutes",
  "addProperty", "addSeconds", "addToTime", "and", "array", "base64",
  "base64ToBinary", "base64ToJson", "base64ToString", "binary", "body",
  "bool", "chunk", "coalesce", "concat", "contains", "convertFromUtc",
  "convertTimeZone", "convertToUtc", "createArray", "dataUri",
  "dataUriToBinary", "dataUriToString", "dateDifference", "dayOfMonth",
  "dayOfWeek", "dayOfYear", "decimal", "decodeBase64", "decodeDataUri",
  "decodeUriComponent", "decodeXmlName", "decodeXmlValue", "div",
  "empty", "encodeBase64", "encodeUriComponent", "encodeXmlName",
  "encodeXmlValue", "endsWith", "equals", "first", "float",
  "formatDateTime", "formatNumber", "formatTimeSpan", "formDataMultiValues",
  "formDataValue", "getFutureTime", "getPastTime", "greater",
  "greaterOrEquals", "guid", "if", "indexOf", "int", "intersection",
  "isFloat", "isInt", "item", "items", "iterationIndexes", "join", "json",
  "last", "lastIndexOf", "length", "less", "lessOrEquals",
  "listCallbackUrl", "max", "mergeObjects", "min", "mod", "mul",
  "multipartBody", "not", "nthIndexOf", "or", "outputs", "parameters",
  "parse", "parseDateTime", "pow", "rand", "range", "removeProperty",
  "replace", "result", "reverse", "setProperty", "skip", "slice", "sort",
  "split", "startOfDay", "startOfHour", "startOfMonth", "startsWith",
  "string", "strongEquals", "sub", "substring", "subtractFromTime", "take",
  "ticks", "toLower", "toUpper", "trigger", "triggerBody",
  "triggerFormDataMultiValues", "triggerFormDataValue", "triggerMultipartBody",
  "triggerOutputs", "trim", "trimByteOrderMark", "union", "uriComponent",
  "uriComponentToBinary", "uriComponentToString", "uriHost", "uriPath",
  "uriPathAndQuery", "uriPort", "uriQuery", "uriScheme", "utcNow",
  "variables", "workflow", "xml", "xpath",
] as const;

function createDefinition(
  spec: MicrosoftFunctionSpec,
): WdlFunctionDefinition {
  const signatures = spec.signatures.map(parseSignature);
  return {
    name: spec.name,
    category: spec.category,
    description: spec.deprecated
      ? `Deprecated: ${spec.description}`
      : spec.description,
    signatures,
    examples: [
      {
        expression: spec.example ?? createExample(spec.name, signatures[0]),
        description: `Shows the ${spec.name} function syntax.`,
      },
    ],
    documentationUrl: `${referenceUrl}#${spec.name}`,
  };
}

function parseSignature(source: string): WdlFunctionSignature {
  const separatorIndex = source.indexOf("->");
  if (separatorIndex < 0) {
    throw new Error(`Invalid function signature: ${source}`);
  }

  const parametersSource = source.slice(0, separatorIndex);
  const returnType = parseType(source.slice(separatorIndex + 2));
  const parameters = parametersSource.length === 0
    ? []
    : parametersSource.split(",").map(parseParameter);
  return { parameters, returnType };
}

function parseParameter(source: string): WdlFunctionParameter {
  const separatorIndex = source.indexOf(":");
  if (separatorIndex < 0) {
    throw new Error(`Invalid function parameter: ${source}`);
  }

  const encodedName = source.slice(0, separatorIndex);
  const variadic = encodedName.endsWith("...");
  const optional = encodedName.endsWith("?");
  const suffixLength = variadic ? 3 : optional ? 1 : 0;
  const name = encodedName.slice(0, encodedName.length - suffixLength);
  const types = source.slice(separatorIndex + 1).split("/").map(parseType);
  return {
    name,
    types,
    required: !optional,
    ...(variadic ? { variadic: true } : {}),
    description: `${humanize(name)} supplied to the function.`,
  };
}

function parseType(source: string): WdlType {
  if (!isWdlType(source)) {
    throw new Error(`Unsupported WDL type in function catalog: ${source}`);
  }
  return source;
}

function humanize(name: string): string {
  const spaced = name.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("-", " ");
  return `${spaced.charAt(0).toLocaleUpperCase("en-US")}${spaced.slice(1)}`;
}

function createExample(
  name: string,
  signature: WdlFunctionSignature | undefined,
): string {
  const argumentsSource = signature?.parameters
    .filter(({ required }) => required)
    .map(({ types }) => exampleValue(types[0] ?? "any"))
    .join(", ") ?? "";
  return `${name}(${argumentsSource})`;
}

function exampleValue(type: WdlType): string {
  switch (type) {
    case "string":
      return "'value'";
    case "integer":
    case "float":
    case "number":
      return "1";
    case "boolean":
      return "true";
    case "array":
      return "createArray(1, 2)";
    case "object":
      return "json('{}')";
    case "null":
    case "any":
    case "unknown":
      return "null";
  }
}
