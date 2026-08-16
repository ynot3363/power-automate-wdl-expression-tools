import { describe, expect, it } from "vitest";
import { WdlAnalyzer, type WdlAnalysisResult } from "../../../../src/language";
import {
  DocumentAnalysisService,
  type WdlAnalysisEngine,
} from "../../../../src/extension/services/documentAnalysisService";

interface MutableDocument {
  readonly uri: { toString(): string };
  version: number;
  source: string;
  getText(): string;
}

class CountingAnalysisEngine implements WdlAnalysisEngine {
  public count = 0;
  private readonly analyzer = new WdlAnalyzer();

  public analyze(source: string): WdlAnalysisResult {
    this.count += 1;
    return this.analyzer.analyze(source);
  }
}

function document(uri: string, source: string, version = 1): MutableDocument {
  return {
    uri: { toString: () => uri },
    version,
    source,
    getText() {
      return this.source;
    },
  };
}

describe("DocumentAnalysisService", () => {
  it("reuses one result for the same URI, version, and source", () => {
    const engine = new CountingAnalysisEngine();
    const service = new DocumentAnalysisService(engine);
    const input = document("untitled:one", "concat('a', 'b')");

    const first = service.analyzeDocument(input);
    const second = service.analyzeDocument(input);
    expect(second).toBe(first);
    expect(engine.count).toBe(1);
  });

  it("invalidates when the document version changes", () => {
    const engine = new CountingAnalysisEngine();
    const service = new DocumentAnalysisService(engine);
    const input = document("untitled:one", "concat('a', 'b')");

    const first = service.analyzeDocument(input);
    input.version += 1;
    input.source = "toLower('VALUE')";
    const second = service.analyzeDocument(input);

    expect(second).not.toBe(first);
    expect(second.expression).not.toEqual(first.expression);
    expect(engine.count).toBe(2);
  });

  it("never reuses a result when source changes without a version change", () => {
    const engine = new CountingAnalysisEngine();
    const service = new DocumentAnalysisService(engine);
    const input = document("untitled:one", "concat('a', 'b')");

    service.analyzeDocument(input);
    input.source = "equals(1, 1)";
    service.analyzeDocument(input);
    expect(engine.count).toBe(2);
  });

  it("separates documents with different URIs", () => {
    const engine = new CountingAnalysisEngine();
    const service = new DocumentAnalysisService(engine);
    const first = document("untitled:one", "concat('a', 'b')");
    const second = document("untitled:two", "concat('a', 'b')");

    expect(service.analyzeDocument(first)).not.toBe(
      service.analyzeDocument(second),
    );
    expect(engine.count).toBe(2);
  });

  it("releases closed or language-changed document state by URI", () => {
    const engine = new CountingAnalysisEngine();
    const service = new DocumentAnalysisService(engine);
    const input = document("untitled:one", "concat('a', 'b')");

    service.analyzeDocument(input);
    service.releaseDocument(input.uri.toString());
    service.analyzeDocument(input);
    service.releaseDocument(input.uri.toString());
    service.analyzeDocument(input);
    expect(engine.count).toBe(3);
  });

  it("coalesces concurrent consumers onto the cached result", async () => {
    const engine = new CountingAnalysisEngine();
    const service = new DocumentAnalysisService(engine);
    const input = document("untitled:one", "concat('a', 'b')");

    const results = await Promise.all([
      Promise.resolve().then(() => service.analyzeDocument(input)),
      Promise.resolve().then(() => service.analyzeDocument(input)),
      Promise.resolve().then(() => service.analyzeDocument(input)),
    ]);
    expect(results[1]).toBe(results[0]);
    expect(results[2]).toBe(results[0]);
    expect(engine.count).toBe(1);
  });

  it("clears all cached state on disposal", () => {
    const engine = new CountingAnalysisEngine();
    const service = new DocumentAnalysisService(engine);
    const input = document("untitled:one", "concat('a', 'b')");

    service.analyzeDocument(input);
    service.dispose();
    service.analyzeDocument(input);
    expect(engine.count).toBe(2);
  });
});
