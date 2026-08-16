import { WdlParser } from "../src/language";

const expressionFlagIndex = process.argv.indexOf("--expression");
const expression =
  expressionFlagIndex === -1
    ? "if(equals(variables('Name'),'Anthony'),true,false)"
    : process.argv[expressionFlagIndex + 1];

if (expression === undefined) {
  throw new Error("Expected an expression after --expression.");
}

const result = new WdlParser(expression).parse();
console.log(JSON.stringify(result.expression, null, 2));

if (result.diagnostics.length > 0) {
  console.error("Parser diagnostics:");
  console.error(JSON.stringify(result.diagnostics, null, 2));
  process.exitCode = 1;
}
