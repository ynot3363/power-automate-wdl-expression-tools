import type { ExpressionNode, FunctionCallNode } from "../ast/nodes";
import {
  resolveFormatterOptions,
  type FormatterOptions,
} from "./formatterOptions";

type PrintMode = "pretty" | "compact";

export class WdlFormatter {
  private readonly options: FormatterOptions;

  public constructor(options: Partial<FormatterOptions> = {}) {
    this.options = resolveFormatterOptions(options);
  }

  /**
   * Format a complete expression, or return undefined when recovery nodes make
   * a meaning-preserving rewrite unsafe.
   */
  public format(expression: ExpressionNode): string | undefined {
    return isFormatSafe(expression)
      ? this.print(expression, 0, "pretty")
      : undefined;
  }

  /** Minify a complete expression without changing literal lexemes. */
  public minify(expression: ExpressionNode): string | undefined {
    return isFormatSafe(expression)
      ? this.print(expression, 0, "compact")
      : undefined;
  }

  private print(node: ExpressionNode, level: number, mode: PrintMode): string {
    switch (node.type) {
      case "FunctionCall":
        return this.printFunctionCall(node, level, mode);
      case "StringLiteral":
      case "NumberLiteral":
        return node.raw;
      case "BooleanLiteral":
        return node.value ? "true" : "false";
      case "NullLiteral":
        return "null";
      case "Identifier":
        return node.name;
      case "PropertyAccess": {
        const property =
          node.property.type === "Identifier" ? node.property.name : "";
        return `${this.print(node.target, level, mode)}${node.isSafe ? "?." : "."}${property}`;
      }
      case "IndexAccess":
        return `${this.print(node.target, level, mode)}${node.isSafe ? "?[" : "["}${this.print(node.index, level, mode)}]`;
      case "ParenthesizedExpression":
        return `(${this.print(node.expression, level, mode)})`;
      case "AtExpression":
        return `@${this.print(node.expression, level, mode)}`;
      case "MissingExpression":
        return "";
      case "Unknown":
        return node.raw;
    }
  }

  private printFunctionCall(
    node: FunctionCallNode,
    level: number,
    mode: PrintMode,
  ): string {
    if (node.arguments.length === 0) {
      return `${node.name}()`;
    }

    if (mode === "compact") {
      const argumentsText = node.arguments
        .map((argument) => this.print(argument, level, mode))
        .join(",");
      return `${node.name}(${argumentsText})`;
    }

    const shouldUseMultipleLines = node.arguments.some(containsFunctionCall);
    if (!shouldUseMultipleLines) {
      const argumentsText = node.arguments
        .map((argument) => this.print(argument, level, mode))
        .join(", ");
      return `${node.name}(${argumentsText})`;
    }

    const argumentsText = node.arguments
      .map(
        (argument) =>
          `${this.indent(level + 1)}${this.print(argument, level + 1, mode)}`,
      )
      .join(",\n");
    return `${node.name}(\n${argumentsText}\n${this.indent(level)})`;
  }

  private indent(level: number): string {
    return this.options.useTabs
      ? "\t".repeat(level)
      : " ".repeat(this.options.indentSize * level);
  }
}

function isFormatSafe(node: ExpressionNode): boolean {
  switch (node.type) {
    case "FunctionCall":
      return node.isClosed && node.arguments.every(isFormatSafe);
    case "PropertyAccess":
      return node.property.type === "Identifier" && isFormatSafe(node.target);
    case "IndexAccess":
      return node.isClosed && isFormatSafe(node.target) && isFormatSafe(node.index);
    case "ParenthesizedExpression":
      return node.isClosed && isFormatSafe(node.expression);
    case "AtExpression":
      return isFormatSafe(node.expression);
    case "MissingExpression":
    case "Unknown":
      return false;
    case "StringLiteral":
    case "NumberLiteral":
    case "BooleanLiteral":
    case "NullLiteral":
    case "Identifier":
      return true;
  }
}

function containsFunctionCall(node: ExpressionNode): boolean {
  switch (node.type) {
    case "FunctionCall":
      return true;
    case "PropertyAccess":
      return containsFunctionCall(node.target);
    case "IndexAccess":
      return containsFunctionCall(node.target) || containsFunctionCall(node.index);
    case "ParenthesizedExpression":
    case "AtExpression":
      return containsFunctionCall(node.expression);
    case "StringLiteral":
    case "NumberLiteral":
    case "BooleanLiteral":
    case "NullLiteral":
    case "Identifier":
    case "MissingExpression":
    case "Unknown":
      return false;
  }
}
