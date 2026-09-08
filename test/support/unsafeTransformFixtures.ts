import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface UnsafeTransformFixture {
  readonly source: string;
  readonly selectedText?: string;
}

export async function loadUnsafeTransformFixtures(
  repositoryRoot: string,
): Promise<readonly UnsafeTransformFixture[]> {
  return JSON.parse(await readFile(resolve(
    repositoryRoot,
    "test/fixtures/formatter/unsafe-transforms.json",
  ), "utf8")) as readonly UnsafeTransformFixture[];
}
