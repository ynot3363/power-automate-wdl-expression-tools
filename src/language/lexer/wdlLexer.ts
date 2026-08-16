import type { Token } from "./token";
import { TokenType } from "./tokenType";

const singleCharacterTokens: Readonly<Record<string, TokenType>> = {
  "(": TokenType.OpenParen,
  ")": TokenType.CloseParen,
  "[": TokenType.OpenBracket,
  "]": TokenType.CloseBracket,
  ",": TokenType.Comma,
  ".": TokenType.Dot,
  "?": TokenType.QuestionMark,
  "@": TokenType.AtSign,
};

export class WdlLexer {
  private readonly tokens: Token[] = [];
  private position = 0;

  public constructor(private readonly source: string) {}

  public tokenize(): readonly Token[] {
    while (!this.isAtEnd()) {
      const character = this.source[this.position];
      if (character === undefined) {
        break;
      }

      if (isWhitespace(character)) {
        this.position += 1;
      } else if (character === "'") {
        this.scanString();
      } else if (isIdentifierStart(character)) {
        this.scanIdentifier();
      } else if (
        isDigit(character) ||
        (character === "-" && isDigit(this.peek(1)))
      ) {
        this.scanNumber();
      } else {
        this.scanSingleCharacter();
      }
    }

    this.tokens.push({
      type: TokenType.EOF,
      value: "",
      lexeme: "",
      start: this.source.length,
      end: this.source.length,
    });

    return this.tokens;
  }

  private scanString(): void {
    const start = this.position;
    let value = "";
    this.position += 1;

    while (!this.isAtEnd()) {
      const character = this.source[this.position];
      if (character === undefined) {
        break;
      }

      if (character !== "'") {
        value += character;
        this.position += 1;
        continue;
      }

      if (this.peek(1) === "'") {
        value += "'";
        this.position += 2;
        continue;
      }

      this.position += 1;
      this.pushToken(TokenType.StringLiteral, start, this.position, value);
      return;
    }

    this.pushToken(
      TokenType.Unknown,
      start,
      this.position,
      this.source.slice(start, this.position),
    );
  }

  private scanIdentifier(): void {
    const start = this.position;
    this.position += 1;

    while (isIdentifierPart(this.peek())) {
      this.position += 1;
    }

    const value = this.source.slice(start, this.position);
    const type =
      value === "true" || value === "false"
        ? TokenType.BooleanLiteral
        : value === "null"
          ? TokenType.NullLiteral
          : TokenType.Identifier;

    this.pushToken(type, start, this.position, value);
  }

  private scanNumber(): void {
    const start = this.position;
    if (this.source[this.position] === "-") {
      this.position += 1;
    }

    while (isDigit(this.peek())) {
      this.position += 1;
    }

    let type = TokenType.IntegerLiteral;
    if (this.peek() === "." && isDigit(this.peek(1))) {
      type = TokenType.FloatLiteral;
      this.position += 1;
      while (isDigit(this.peek())) {
        this.position += 1;
      }
    }

    const value = this.source.slice(start, this.position);
    this.pushToken(type, start, this.position, value);
  }

  private scanSingleCharacter(): void {
    const start = this.position;
    const character = this.source[this.position];
    if (character === undefined) {
      return;
    }

    this.position += 1;
    this.pushToken(
      singleCharacterTokens[character] ?? TokenType.Unknown,
      start,
      this.position,
      character,
    );
  }

  private pushToken(
    type: TokenType,
    start: number,
    end: number,
    value: string,
  ): void {
    this.tokens.push({
      type,
      value,
      lexeme: this.source.slice(start, end),
      start,
      end,
    });
  }

  private peek(offset = 0): string | undefined {
    return this.source[this.position + offset];
  }

  private isAtEnd(): boolean {
    return this.position >= this.source.length;
  }
}

function isWhitespace(character: string): boolean {
  return (
    character === " " ||
    character === "\t" ||
    character === "\r" ||
    character === "\n"
  );
}

function isDigit(character: string | undefined): boolean {
  return character !== undefined && character >= "0" && character <= "9";
}

function isIdentifierStart(character: string): boolean {
  return (
    (character >= "a" && character <= "z") ||
    (character >= "A" && character <= "Z") ||
    character === "_"
  );
}

function isIdentifierPart(character: string | undefined): boolean {
  return (
    character !== undefined &&
    (isIdentifierStart(character) || isDigit(character))
  );
}
