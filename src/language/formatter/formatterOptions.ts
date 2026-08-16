export interface FormatterOptions {
  readonly indentSize: number;
  readonly useTabs: boolean;
}

export const defaultFormatterOptions: FormatterOptions = {
  indentSize: 4,
  useTabs: false,
};

export function resolveFormatterOptions(
  options: Partial<FormatterOptions> = {},
): FormatterOptions {
  const indentSize = options.indentSize ?? defaultFormatterOptions.indentSize;
  if (!Number.isInteger(indentSize) || indentSize < 1) {
    throw new RangeError("Formatter indentSize must be a positive integer.");
  }

  return {
    indentSize,
    useTabs: options.useTabs ?? defaultFormatterOptions.useTabs,
  };
}
