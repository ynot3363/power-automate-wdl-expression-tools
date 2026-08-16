import type * as vscode from "vscode";
import { WdlAnalyzer, type WdlAnalysisResult } from "../../language";

/** Shared, cache-ready boundary for all editor consumers of WDL analysis. */
export class DocumentAnalysisService {
  public constructor(private readonly analyzer = new WdlAnalyzer()) {}

  public analyzeDocument(document: vscode.TextDocument): WdlAnalysisResult {
    return this.analyzeText(document.getText());
  }

  public analyzeText(source: string): WdlAnalysisResult {
    return this.analyzer.analyze(source);
  }
}
