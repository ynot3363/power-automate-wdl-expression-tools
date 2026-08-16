import * as vscode from "vscode";
import type { WdlDiagnostic } from "../../language";
import type { DocumentAnalysisService } from "../services/documentAnalysisService";

const languageId = "power-automate-wdl-expression";
const configurationSection = "powerAutomateWdlExpressions.diagnostics";
const diagnosticSource = "Power Automate WDL";

export const diagnosticDebounceMilliseconds = 200;

export class WdlDiagnosticsManager implements vscode.Disposable {
  private readonly collection = vscode.languages.createDiagnosticCollection(
    "power-automate-wdl-expressions",
  );
  private readonly subscriptions: vscode.Disposable[] = [];
  private readonly pending = new Map<string, ReturnType<typeof setTimeout>>();
  private isDisposed = false;

  public constructor(private readonly analysis: DocumentAnalysisService) {
    this.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument((document) => {
        this.handleOpen(document);
      }),
      vscode.workspace.onDidChangeTextDocument(({ document }) => {
        this.handleChange(document);
      }),
      vscode.workspace.onDidCloseTextDocument((document) => {
        this.clearDocument(document);
      }),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(configurationSection)) {
          this.refreshConfiguration();
        }
      }),
    );

    for (const document of vscode.workspace.textDocuments) {
      this.handleOpen(document);
    }
  }

  public dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    this.cancelAll();
    for (const subscription of this.subscriptions) {
      subscription.dispose();
    }
    this.collection.clear();
    this.collection.dispose();
  }

  private handleOpen(document: vscode.TextDocument): void {
    if (!this.isApplicable(document)) {
      this.clearDocument(document);
      return;
    }
    this.publish(document, document.version);
  }

  private handleChange(document: vscode.TextDocument): void {
    if (!this.isApplicable(document)) {
      this.clearDocument(document);
      return;
    }
    this.schedule(document);
  }

  private schedule(document: vscode.TextDocument): void {
    const key = document.uri.toString();
    this.cancel(key);
    const version = document.version;
    const timer = setTimeout(() => {
      this.pending.delete(key);
      if (!this.isDisposed) {
        this.publish(document, version);
      }
    }, diagnosticDebounceMilliseconds);
    this.pending.set(key, timer);
  }

  private publish(document: vscode.TextDocument, expectedVersion: number): void {
    if (
      this.isDisposed ||
      document.version !== expectedVersion ||
      !this.isApplicable(document)
    ) {
      return;
    }

    const result = this.analysis.analyzeDocument(document);
    if (
      document.version !== expectedVersion ||
      !this.isApplicable(document)
    ) {
      return;
    }

    this.collection.set(
      document.uri,
      result.diagnostics.map((diagnostic) => mapDiagnostic(document, diagnostic)),
    );
  }

  private refreshConfiguration(): void {
    this.cancelAll();
    this.collection.clear();
    if (this.isDisposed) {
      return;
    }
    for (const document of vscode.workspace.textDocuments) {
      if (this.isApplicable(document)) {
        this.publish(document, document.version);
      }
    }
  }

  private isApplicable(document: vscode.TextDocument): boolean {
    return (
      document.languageId === languageId &&
      vscode.workspace
        .getConfiguration(configurationSection, document.uri)
        .get<boolean>("enabled", true)
    );
  }

  private clearDocument(document: vscode.TextDocument): void {
    const key = document.uri.toString();
    this.cancel(key);
    this.collection.delete(document.uri);
  }

  private cancel(key: string): void {
    const timer = this.pending.get(key);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.pending.delete(key);
    }
  }

  private cancelAll(): void {
    for (const timer of this.pending.values()) {
      clearTimeout(timer);
    }
    this.pending.clear();
  }
}

function mapDiagnostic(
  document: vscode.TextDocument,
  diagnostic: WdlDiagnostic,
): vscode.Diagnostic {
  const mapped = new vscode.Diagnostic(
    new vscode.Range(
      document.positionAt(diagnostic.range.start),
      document.positionAt(diagnostic.range.end),
    ),
    diagnostic.message,
    vscode.DiagnosticSeverity.Error,
  );
  mapped.code = diagnostic.code;
  mapped.source = diagnosticSource;
  return mapped;
}
