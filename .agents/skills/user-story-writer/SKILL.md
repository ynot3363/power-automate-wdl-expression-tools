---
name: user-story-writer
description: Craft and refine implementation-ready user stories for Power Automate WDL Expression Tools. Use when Codex is asked to draft a child issue, improve acceptance criteria, identify story dependencies, or prepare an ordered extension feature story for GitHub.
---

# User Story Writer

## Overview

Create implementation-ready child issues that match this repository's WDL
language-engine boundary, VS Code integration architecture, validation
workflow, and parent-plan conventions. GitHub issues are the canonical story
record unless the user explicitly requests local planning documents.

## Workflow

1. Read `AGENTS.md` completely.
2. Read
   [references/user-story-standards.md](references/user-story-standards.md)
   completely.
3. Read `docs/implementation-plan.md` and any repository documentation relevant
   to the requested language-engine, editor-integration, or release feature.
4. Inspect the parent plan and related child issues when they are available.
   Use the GitHub skill before reading or changing remote issue state.
5. Confirm the story has one independently deliverable outcome. Split it when
   its acceptance criteria require unrelated implementation work.
6. Identify affected language-engine components, VS Code contributions and
   providers, package or release configuration, tests, and documentation
   without prescribing implementation that has not been decided.
7. Capture dependencies, sequencing constraints, open decisions, and explicit
   exclusions.
8. Draft or refine the story using the standard's required shape.
9. If the story changes an assumption used by another issue, update or call
   out that related issue in the same planning pass.
10. When writing a local Markdown artifact at the user's request, run or report
   the repository's formatting check.
