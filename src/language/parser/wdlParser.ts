import type {
  ExpressionNode,
  FunctionCallNode,
  IdentifierNode,
  MissingExpressionNode,
} from "../ast/nodes";
import { sourceRange } from "../ast/sourceRange";
import type { Token } from "../lexer/token";
import { TokenType } from "../lexer/tokenType";
import { WdlLexer } from "../lexer/wdlLexer";
import type { ParseResult } from "./parseResult";
import type {
  WdlParserDiagnostic,
  WdlParserDiagnosticCode,
} from "./parserError";

export class WdlParser {
  private readonly tokens: readonly Token[];
  private readonly diagnostics: WdlParserDiagnostic[] = [];
  private position = 0;

  public constructor(private readonly source: string) {
    this.tokens = new WdlLexer(source).tokenize();
  }

  public parse(): ParseResult {
    const expression = this.parseExpression();

    while (!this.check(TokenType.EOF)) {
      const token = this.advance();
      this.report(
        "WDL1003",
        `Unexpected token ${JSON.stringify(token.lexeme)} after the expression.`,
        token.start,
        token.end,
      );
    }

    return {
      expression,
      diagnostics: this.diagnostics,
      tokens: this.tokens,
    };
  }

  private parseExpression(): ExpressionNode {
    let expression = this.parsePrimary();

    for (;;) {
      if (this.match(TokenType.Dot)) {
        expression = this.finishPropertyAccess(expression, false, this.previous());
        continue;
      }

      if (this.check(TokenType.QuestionMark)) {
        const questionMark = this.advance();
        if (this.match(TokenType.OpenBracket)) {
          expression = this.finishIndexAccess(
            expression,
            true,
            questionMark.start,
            this.previous(),
          );
          continue;
        }

        if (this.match(TokenType.Dot)) {
          expression = this.finishPropertyAccess(
            expression,
            true,
            questionMark,
          );
          continue;
        }

        this.report(
          "WDL1002",
          "Expected '[' or '.' after '?'.",
          questionMark.start,
          questionMark.end,
        );
        continue;
      }

      if (this.match(TokenType.OpenBracket)) {
        const bracket = this.previous();
        expression = this.finishIndexAccess(
          expression,
          false,
          bracket.start,
          bracket,
        );
        continue;
      }

      return expression;
    }
  }

  private parsePrimary(): ExpressionNode {
    const token = this.current();

    switch (token.type) {
      case TokenType.Identifier:
        this.advance();
        if (this.match(TokenType.OpenParen)) {
          return this.finishFunctionCall(token, this.previous());
        }
        return {
          type: "Identifier",
          name: token.value,
          range: sourceRange(token.start, token.end),
        };
      case TokenType.StringLiteral:
        this.advance();
        return {
          type: "StringLiteral",
          value: token.value,
          raw: token.lexeme,
          range: sourceRange(token.start, token.end),
        };
      case TokenType.IntegerLiteral:
      case TokenType.FloatLiteral:
        this.advance();
        return {
          type: "NumberLiteral",
          value: Number(token.value),
          raw: token.lexeme,
          numberKind:
            token.type === TokenType.IntegerLiteral ? "integer" : "float",
          range: sourceRange(token.start, token.end),
        };
      case TokenType.BooleanLiteral:
        this.advance();
        return {
          type: "BooleanLiteral",
          value: token.value === "true",
          range: sourceRange(token.start, token.end),
        };
      case TokenType.NullLiteral:
        this.advance();
        return {
          type: "NullLiteral",
          range: sourceRange(token.start, token.end),
        };
      case TokenType.OpenParen:
        this.advance();
        return this.finishParenthesized(token);
      case TokenType.AtSign:
        this.advance();
        return this.finishAtExpression(token);
      case TokenType.Unknown:
        this.advance();
        this.report(
          "WDL1003",
          `Unexpected input ${JSON.stringify(token.lexeme)}.`,
          token.start,
          token.end,
        );
        return {
          type: "Unknown",
          raw: token.lexeme,
          range: sourceRange(token.start, token.end),
        };
      case TokenType.EOF:
      case TokenType.Comma:
      case TokenType.CloseParen:
      case TokenType.CloseBracket:
      case TokenType.Dot:
      case TokenType.QuestionMark:
      case TokenType.OpenBracket:
        return this.missingExpression("expression");
    }
  }

  private finishFunctionCall(
    nameToken: Token,
    openParen: Token,
  ): FunctionCallNode {
    const argumentsList: ExpressionNode[] = [];

    if (this.check(TokenType.EOF)) {
      argumentsList.push(this.missingExpression("argument"));
    } else if (!this.check(TokenType.CloseParen)) {
      while (!this.check(TokenType.CloseParen) && !this.check(TokenType.EOF)) {
        argumentsList.push(this.parseExpression());

        if (!this.match(TokenType.Comma)) {
          if (!this.check(TokenType.CloseParen) && !this.check(TokenType.EOF)) {
            const unexpected = this.advance();
            this.report(
              "WDL1002",
              "Expected ',' or ')' after the function argument.",
              unexpected.start,
              unexpected.end,
            );
          }
          continue;
        }

        if (this.check(TokenType.CloseParen) || this.check(TokenType.EOF)) {
          argumentsList.push(this.missingExpression("argument"));
          break;
        }
      }
    }

    const closeParen = this.finishClosingDelimiter(
      TokenType.CloseParen,
      "Expected ')' to close the function call.",
    );
    const end = closeParen.isClosed
      ? closeParen.range.end
      : this.lastMeaningfulEnd(argumentsList, openParen.end);

    return {
      type: "FunctionCall",
      name: nameToken.value,
      arguments: argumentsList,
      nameRange: sourceRange(nameToken.start, nameToken.end),
      openParenRange: sourceRange(openParen.start, openParen.end),
      closeParenRange: closeParen.range,
      isClosed: closeParen.isClosed,
      range: sourceRange(nameToken.start, end),
    };
  }

  private finishPropertyAccess(
    target: ExpressionNode,
    isSafe: boolean,
    operatorStart: Token,
  ): ExpressionNode {
    const dot = this.previous();
    let property: IdentifierNode | MissingExpressionNode;

    if (this.check(TokenType.Identifier)) {
      const identifier = this.advance();
      property = {
        type: "Identifier",
        name: identifier.value,
        range: sourceRange(identifier.start, identifier.end),
      };
    } else {
      property = this.missingExpression("property name");
    }

    return {
      type: "PropertyAccess",
      target,
      property,
      operatorRange: sourceRange(operatorStart.start, dot.end),
      isSafe,
      range: sourceRange(target.range.start, property.range.end || dot.end),
    };
  }

  private finishIndexAccess(
    target: ExpressionNode,
    isSafe: boolean,
    operatorStart: number,
    openBracket: Token,
  ): ExpressionNode {
    const index = this.check(TokenType.CloseBracket)
      ? this.missingExpression("index expression")
      : this.parseExpression();
    const closeBracket = this.finishClosingDelimiter(
      TokenType.CloseBracket,
      "Expected ']' to close the index access.",
    );
    const end = closeBracket.isClosed
      ? closeBracket.range.end
      : Math.max(index.range.end, openBracket.end);

    return {
      type: "IndexAccess",
      target,
      index,
      operatorRange: sourceRange(operatorStart, openBracket.end),
      closeBracketRange: closeBracket.range,
      isSafe,
      isClosed: closeBracket.isClosed,
      range: sourceRange(target.range.start, end),
    };
  }

  private finishParenthesized(openParen: Token): ExpressionNode {
    const expression = this.check(TokenType.CloseParen)
      ? this.missingExpression("expression")
      : this.parseExpression();
    const closeParen = this.finishClosingDelimiter(
      TokenType.CloseParen,
      "Expected ')' to close the parenthesized expression.",
    );

    return {
      type: "ParenthesizedExpression",
      expression,
      openParenRange: sourceRange(openParen.start, openParen.end),
      closeParenRange: closeParen.range,
      isClosed: closeParen.isClosed,
      range: sourceRange(
        openParen.start,
        closeParen.isClosed
          ? closeParen.range.end
          : Math.max(openParen.end, expression.range.end),
      ),
    };
  }

  private finishAtExpression(atSign: Token): ExpressionNode {
    const expression = this.parseExpression();
    return {
      type: "AtExpression",
      expression,
      atSignRange: sourceRange(atSign.start, atSign.end),
      range: sourceRange(atSign.start, Math.max(atSign.end, expression.range.end)),
    };
  }

  private finishClosingDelimiter(
    type: TokenType,
    message: string,
  ): { readonly range: ReturnType<typeof sourceRange>; readonly isClosed: boolean } {
    if (this.match(type)) {
      const token = this.previous();
      return {
        range: sourceRange(token.start, token.end),
        isClosed: true,
      };
    }

    const position = this.current().start;
    this.report("WDL1002", message, position, position);
    return { range: sourceRange(position, position), isClosed: false };
  }

  private missingExpression(expected: string): MissingExpressionNode {
    const position = this.current().start;
    this.report(
      "WDL1001",
      `Expected ${expected}.`,
      position,
      position,
    );
    return {
      type: "MissingExpression",
      expected,
      range: sourceRange(position, position),
    };
  }

  private lastMeaningfulEnd(
    expressions: readonly ExpressionNode[],
    fallback: number,
  ): number {
    const last = expressions.at(-1);
    return last === undefined ? fallback : Math.max(fallback, last.range.end);
  }

  private report(
    code: WdlParserDiagnosticCode,
    message: string,
    start: number,
    end: number,
  ): void {
    this.diagnostics.push({
      code,
      message,
      severity: "error",
      range: sourceRange(start, end),
    });
  }

  private match(type: TokenType): boolean {
    if (!this.check(type)) {
      return false;
    }

    this.advance();
    return true;
  }

  private check(type: TokenType): boolean {
    return this.current().type === type;
  }

  private advance(): Token {
    const token = this.current();
    if (token.type !== TokenType.EOF) {
      this.position += 1;
    }
    return token;
  }

  private previous(): Token {
    return this.tokens[Math.max(0, this.position - 1)] ?? this.eofToken();
  }

  private current(): Token {
    return this.tokens[this.position] ?? this.eofToken();
  }

  private eofToken(): Token {
    return {
      type: TokenType.EOF,
      value: "",
      lexeme: "",
      start: this.source.length,
      end: this.source.length,
    };
  }
}
