import { describe, expect, it } from "vitest";
import { TokenType, WdlLexer, type Token } from "../../../../src/language";

function tokens(source: string): readonly Token[] {
  return new WdlLexer(source).tokenize();
}

function tokenSummary(source: string): readonly [TokenType, string][] {
  return tokens(source).map(({ type, value }) => [type, value]);
}

describe("WdlLexer", () => {
  it("tokenizes a simple call", () => {
    expect(tokenSummary("substring('Anthony', 0, 3)")).toEqual([
      [TokenType.Identifier, "substring"],
      [TokenType.OpenParen, "("],
      [TokenType.StringLiteral, "Anthony"],
      [TokenType.Comma, ","],
      [TokenType.IntegerLiteral, "0"],
      [TokenType.Comma, ","],
      [TokenType.IntegerLiteral, "3"],
      [TokenType.CloseParen, ")"],
      [TokenType.EOF, ""],
    ]);
  });

  it("tokenizes nested calls and literals", () => {
    expect(tokenSummary("if(empty(null), true, false)")).toEqual([
      [TokenType.Identifier, "if"],
      [TokenType.OpenParen, "("],
      [TokenType.Identifier, "empty"],
      [TokenType.OpenParen, "("],
      [TokenType.NullLiteral, "null"],
      [TokenType.CloseParen, ")"],
      [TokenType.Comma, ","],
      [TokenType.BooleanLiteral, "true"],
      [TokenType.Comma, ","],
      [TokenType.BooleanLiteral, "false"],
      [TokenType.CloseParen, ")"],
      [TokenType.EOF, ""],
    ]);
  });

  it("decodes doubled apostrophes while retaining the source lexeme", () => {
    const string = tokens("'It''s working'")[0];
    expect(string).toEqual({
      type: TokenType.StringLiteral,
      value: "It's working",
      lexeme: "'It''s working'",
      start: 0,
      end: 15,
    });
  });

  it("tokenizes negative integers and floating-point values", () => {
    expect(tokenSummary("-123, 1.25, -0.5")).toEqual([
      [TokenType.IntegerLiteral, "-123"],
      [TokenType.Comma, ","],
      [TokenType.FloatLiteral, "1.25"],
      [TokenType.Comma, ","],
      [TokenType.FloatLiteral, "-0.5"],
      [TokenType.EOF, ""],
    ]);
  });

  it("retains original offsets across whitespace and newlines", () => {
    const result = tokens(" \n  concat(\n    'x'\n  )");
    expect(result.map(({ type, start, end }) => ({ type, start, end }))).toEqual([
      { type: TokenType.Identifier, start: 4, end: 10 },
      { type: TokenType.OpenParen, start: 10, end: 11 },
      { type: TokenType.StringLiteral, start: 16, end: 19 },
      { type: TokenType.CloseParen, start: 22, end: 23 },
      { type: TokenType.EOF, start: 23, end: 23 },
    ]);
  });

  it("tokenizes property, index, and safe access structurally", () => {
    expect(tokenSummary("@outputs('Get_User')?['body/Email'].value")).toEqual([
      [TokenType.AtSign, "@"],
      [TokenType.Identifier, "outputs"],
      [TokenType.OpenParen, "("],
      [TokenType.StringLiteral, "Get_User"],
      [TokenType.CloseParen, ")"],
      [TokenType.QuestionMark, "?"],
      [TokenType.OpenBracket, "["],
      [TokenType.StringLiteral, "body/Email"],
      [TokenType.CloseBracket, "]"],
      [TokenType.Dot, "."],
      [TokenType.Identifier, "value"],
      [TokenType.EOF, ""],
    ]);
  });

  it("returns EOF for an empty expression", () => {
    expect(tokens("")).toEqual([
      {
        type: TokenType.EOF,
        value: "",
        lexeme: "",
        start: 0,
        end: 0,
      },
    ]);
  });

  it("returns recoverable unknown tokens for unexpected input", () => {
    expect(tokenSummary("concat($, 'unterminated")).toEqual([
      [TokenType.Identifier, "concat"],
      [TokenType.OpenParen, "("],
      [TokenType.Unknown, "$"],
      [TokenType.Comma, ","],
      [TokenType.Unknown, "'unterminated"],
      [TokenType.EOF, ""],
    ]);
  });
});
