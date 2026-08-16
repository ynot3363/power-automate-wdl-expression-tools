import type { TokenType } from "./tokenType";

/** A half-open source token whose offsets refer to the original input. */
export interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly lexeme: string;
  readonly start: number;
  readonly end: number;
}
