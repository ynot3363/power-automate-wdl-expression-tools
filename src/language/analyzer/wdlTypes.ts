export const wdlTypes = [
  "string",
  "integer",
  "float",
  "number",
  "boolean",
  "array",
  "object",
  "null",
  "any",
  "unknown",
] as const;

export type WdlType = (typeof wdlTypes)[number];

const wdlTypeSet: ReadonlySet<unknown> = new Set(wdlTypes);

export function isWdlType(value: unknown): value is WdlType {
  return wdlTypeSet.has(value);
}
