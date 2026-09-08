import type { SourceRange } from "../ast/sourceRange";
import type { Token } from "../lexer/token";
import { TokenType } from "../lexer/tokenType";

export interface WdlFunctionCompletionContext {
  readonly prefix: string;
  readonly replacementRange: SourceRange;
  readonly hasArgumentList: boolean;
}

export function getWdlFunctionCompletionContext(
  tokens: readonly Token[],
  offset: number,
): WdlFunctionCompletionContext | undefined {
  const significant = tokens.filter(({ type }) => type !== TokenType.EOF);
  const containing = significant.find(
    ({ type, start, end }) =>
      type === TokenType.Identifier && offset >= start && offset <= end,
  ) ?? significant.find(
    ({ start, end }) => offset >= start && offset <= end,
  );

  if (containing?.type === TokenType.StringLiteral) {
    return undefined;
  }
  if (
    containing?.type === TokenType.Unknown &&
    containing.lexeme.startsWith("'")
  ) {
    return undefined;
  }

  if (containing?.type === TokenType.Identifier) {
    const previous = previousToken(significant, containing.start);
    if (!isFunctionPosition(previous)) {
      return undefined;
    }
    return {
      prefix: containing.value.slice(0, Math.max(0, offset - containing.start)),
      replacementRange: { start: containing.start, end: containing.end },
      hasArgumentList: significant.find(({ start }) => start >= containing.end)?.type
        === TokenType.OpenParen,
    };
  }

  if (containing !== undefined && offset > containing.start && offset < containing.end) {
    return undefined;
  }

  const previous = previousToken(significant, offset);
  if (!isFunctionPosition(previous)) {
    return undefined;
  }
  return {
    prefix: "",
    replacementRange: { start: offset, end: offset },
    hasArgumentList: significant.find(({ start }) => start >= offset)?.type
      === TokenType.OpenParen,
  };
}

function previousToken(
  tokens: readonly Token[],
  offset: number,
): Token | undefined {
  return tokens.filter(({ end }) => end <= offset).at(-1);
}

function isFunctionPosition(previous: Token | undefined): boolean {
  return (
    previous === undefined ||
    previous.type === TokenType.AtSign ||
    previous.type === TokenType.Comma ||
    previous.type === TokenType.OpenParen
  );
}
