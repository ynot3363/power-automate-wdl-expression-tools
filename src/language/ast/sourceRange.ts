/** A zero-based, half-open UTF-16 range in the original source text. */
export interface SourceRange {
  readonly start: number;
  readonly end: number;
}

export function sourceRange(start: number, end: number): SourceRange {
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    throw new TypeError("Source range offsets must be integers.");
  }

  if (start < 0 || end < start) {
    throw new RangeError(
      `Invalid source range [${String(start)}, ${String(end)}).`,
    );
  }

  return { start, end };
}

export function spanRanges(first: SourceRange, second: SourceRange): SourceRange {
  return sourceRange(
    Math.min(first.start, second.start),
    Math.max(first.end, second.end),
  );
}
