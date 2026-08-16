# Packaging and publishing

This project separates reproducible packaging, GitHub Releases, and Visual
Studio Marketplace publication. A VSIX must be installed and smoke-tested
before either release or publication.

## Build the release candidate

Use Node.js 24 and a clean checkout:

```sh
npm ci
npm run test:all
npm run package:vsix
npm run package:verify
shasum -a 256 power-automate-wdl-expression-tools-0.1.0.vsix
```

The expected artifact is
`power-automate-wdl-expression-tools-0.1.0.vsix`. The verifier rejects a
different filename, mismatched packaged metadata, or any file outside the
release allowlist.

Install the candidate in VS Code without publishing it:

```sh
code --install-extension ./power-automate-wdl-expression-tools-0.1.0.vsix --force
```

Restart VS Code and complete [the full smoke test](smoke-test.md). Keep the
VSIX and its checksum until the test result is recorded.

## Create a GitHub Release after approval

Before tagging, replace `Unreleased` in the matching `CHANGELOG.md` heading
with the release date. Confirm that `package.json`, the root package in
`package-lock.json`, and the changelog heading all use the same stable SemVer.

After the smoke test passes and the approved release commit is on `main`, push
the matching tag, for example `v0.1.0`. The `Release VSIX` workflow then:

1. Rejects a tag, manifest, lockfile, or changelog mismatch.
2. Runs lint, typecheck, unit tests, build, and headless Extension Host tests.
3. Packages and verifies the exact VSIX contents.
4. Generates a SHA-256 checksum.
5. Creates the GitHub Release from the existing tag and attaches both files.

The workflow has `contents: write` only in its release job. It does not publish
to the Visual Studio Marketplace.

## First Marketplace publication

For V1, publish manually after the GitHub Release artifact has passed the smoke
test:

1. Sign in to the [Visual Studio Marketplace publisher management page](https://marketplace.visualstudio.com/manage).
2. Create or select the publisher whose identifier is exactly `aepcodes`.
3. Choose **New extension** and **Visual Studio Code**.
4. Upload the already-tested VSIX from the GitHub Release; do not rebuild it.
5. Review the rendered README, icon, categories, repository, license, version,
   and install requirements, then publish.
6. Install the public listing into a clean VS Code profile and repeat the short
   install/language/format/diagnostics subset of the smoke test.

The official [`vsce` publishing guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
documents both manual VSIX upload and CLI publication.

## Future GitHub Actions Marketplace publishing

Automated publication is supported, but it remains intentionally disabled
until the manual process above has succeeded. Current `vsce` supports trusted
publishing from GitHub Actions with `vsce publish --oidc`, avoiding a stored
Personal Access Token.

After the first manual release:

1. Add a trusted publishing policy for this repository and the chosen workflow
   in the Marketplace publisher settings.
2. Protect a GitHub `marketplace` environment with required reviewers.
3. Add a manual-dispatch workflow with `contents: read` and `id-token: write`.
4. Download or rebuild-and-verify the exact approved VSIX, then run:

   ```sh
   npx vsce publish --packagePath power-automate-wdl-expression-tools-0.1.0.vsix --oidc
   ```

5. Keep version/tag checks and every validation gate ahead of the publish step.

The [`@vscode/vsce` trusted-publishing documentation](https://github.com/microsoft/vscode-vsce#trusted-publishing)
describes the Marketplace policy and GitHub OIDC exchange. Do not add a
long-lived `VSCE_PAT` unless trusted publishing is unavailable and the security
tradeoff is explicitly accepted.
