import type * as vscode from "vscode";
import { WdlAnalyzer, type WdlAnalysisResult } from "../../language";

export interface WdlAnalysisEngine {
  analyze(source: string): WdlAnalysisResult;
}

export interface WdlAnalyzableDocument {
  readonly uri: { toString(): string };
  readonly version: number;
  getText(): string;
}

interface CachedDocumentAnalysis {
  readonly version: number;
  readonly source: string;
  readonly result: WdlAnalysisResult;
}

/** Shared URI/version cache boundary for all editor consumers of WDL analysis. */
export class DocumentAnalysisService implements vscode.Disposable {
  private readonly cachedByUri = new Map<string, CachedDocumentAnalysis>();

  public constructor(private readonly analyzer: WdlAnalysisEngine = new WdlAnalyzer()) {}

  public analyzeDocument(document: WdlAnalyzableDocument): WdlAnalysisResult {
    const key = document.uri.toString();
    const source = document.getText();
    const cached = this.cachedByUri.get(key);
    if (cached?.version === document.version && cached.source === source) {
      return cached.result;
    }

    const result = this.analyzeText(source);
    this.cachedByUri.set(key, {
      version: document.version,
      source,
      result,
    });
    return result;
  }

  public analyzeText(source: string): WdlAnalysisResult {
    return this.analyzer.analyze(source);
  }

  public releaseDocument(uri: vscode.Uri | string): void {
    this.cachedByUri.delete(typeof uri === "string" ? uri : uri.toString());
  }

  public dispose(): void {
    this.cachedByUri.clear();
  }
}
