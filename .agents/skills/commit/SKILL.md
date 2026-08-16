---
name: commit
description: Create focused, validated commits for this repository. Use whenever Codex is asked or authorized to stage changes, create a commit, organize completed work into commits, or finish a user story at a commit boundary.
---

# Commit changes

1. Read [references/commit-standards.md](references/commit-standards.md)
   completely.
2. Read `AGENTS.md` and preserve its working-tree safety rules.
3. Inspect `git status --short` and the complete diff.
4. Identify changes that belong to the requested commit. Preserve unrelated
   user changes.
5. Select validation for the changed surface. Use focused checks while
   iterating, then run `npm run validate` before a final implementation-story
   commit. For documentation-only or workflow-only changes, run the applicable
   formatting or syntax checks. Do not commit on failure unless the user
   explicitly requests a WIP commit.
6. Stage files explicitly by path or coherent change group. Never use
   `git add .`.
7. Inspect `git diff --cached` and confirm the staged change is coherent.
8. Write a Conventional Commit title and body following
   [references/commit-standards.md](references/commit-standards.md).
9. Create the commit without amending or rewriting existing history unless the
    user explicitly authorizes it.
10. Report the commit SHA, title, included files or scope, and validation
    results.

If the task contains multiple independently reviewable changes, propose or
create multiple semantic commits. Keep implementation, tests, stories, and
documentation together when they define one atomic contract.

Repository workflow, documentation, and policy updates may be committed
together after focused validation. Keep language-engine behavior, VS Code
integration, function-catalog data, and release configuration in separate
commits when they represent independently reviewable outcomes.
