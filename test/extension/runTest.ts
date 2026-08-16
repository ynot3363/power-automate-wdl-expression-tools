import * as path from "node:path";
import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
  const extensionDevelopmentPath = path.resolve(__dirname, "../../..");
  const extensionTestsPath = path.resolve(__dirname, "suite/index");

  // An invoking VS Code extension host sets this for its own child processes.
  // The downloaded Electron application must run as Electron, not as Node.js.
  delete process.env.ELECTRON_RUN_AS_NODE;

  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
    version: "1.133.0",
    launchArgs: [
      "--disable-extensions",
      "--disable-gpu",
      "--disable-workspace-trust",
      "--skip-release-notes",
      "--skip-welcome",
    ],
  });
}

main().catch((error: unknown) => {
  console.error("Extension integration tests failed.", error);
  process.exitCode = 1;
});
