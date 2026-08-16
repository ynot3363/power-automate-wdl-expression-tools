# User Story Standards

**Status:** Required repository standard

**Last reviewed:** August 11, 2026

## Contents

- [Purpose](#purpose)
- [Canonical Story Record](#canonical-story-record)
- [Story Shape](#story-shape)
- [Writing Requirements](#writing-requirements)
- [Workflow for Agents](#workflow-for-agents)

## Purpose

User stories are implementation contracts. Give a future maintainer or agent
enough context to build, test, document, and validate a feature without
re-litigating product intent.

A good story must be:

- scoped to one independently deliverable outcome;
- specific enough to implement and small enough to test independently;
- explicit about language behavior, editor behavior, accessibility, security,
  packaging, and validation expectations where relevant;
- connected to its parent plan, dependencies, and durable repository
  documentation; and
- clear about deferred decisions and excluded work.

## Canonical Story Record

GitHub issues are the canonical story record. Use a parent issue for the plan
and child issues for independently implementable stories. Let GitHub assign
issue numbers; do not invent a separate identifier or renumber existing
issues.

Treat the parent plan and its linked child issues as future-agent memory. For
this project's initial backlog, create child issues in implementation order so
their GitHub issue numbers communicate sequence; do not add a competing story
identifier.
Record decisions that affect more than one story in the relevant issues or in
durable documentation under `docs/`. Cross-reference affected issues when a
new decision changes an assumption, dependency, or constraint they rely on.

## Story Shape

Every child issue must have a concise, outcome-oriented title and include
these sections in this order:

1. `## User Story`
2. `## Description`
3. `## Acceptance Criteria`
4. `## Tests`
5. `## Documentation`
6. `## Dependencies`
7. `## Out of Scope`
8. `## Implementation Notes`

Omit a section only when it truly does not apply, and briefly explain why.

## Writing Requirements

### User Story

Use one concise paragraph in this form:

```text
As a [specific person], I want [capability] so I can [outcome].
```

Prefer a concrete actor such as a Power Automate maker, WDL expression author,
extension user, or maintainer. Avoid “user” when a more precise role is known.

### Description

Explain the current state, intended change, affected engine or extension area,
and meaningful product motivation. Include existing repository conventions
that shape the work.

For language-engine stories, address when relevant:

- the `src/language` boundary and prohibition on `vscode` imports;
- source ranges, incomplete input, parser recovery, and semantic preservation;
- data-driven function metadata and conservative WDL type inference;
- stable diagnostic codes and avoidance of false positives; and
- focused unit, golden-fixture, idempotency, round-trip, or regression tests.

For VS Code integration stories, address when relevant:

- native language, command, provider, settings, and diagnostic APIs;
- mapping engine offsets and results to native VS Code ranges and objects;
- nested cursor context, snippets, keyboard behavior, and accessible editor
  output;
- activation, document lifecycle, debounce, and cache invalidation behavior;
  and
- extension-host integration coverage without duplicating engine logic.

For build, packaging, or release stories, address when relevant:

- supported VS Code engines and current Node.js/tool versions;
- lint, strict type checking, unit tests, builds, and extension-host tests;
- Marketplace metadata, VSIX contents, and manual installation smoke tests;
- GitHub Actions permissions, artifacts, secrets, and failure behavior; and
- the rule that Marketplace publication remains manual until proven.

### Acceptance Criteria

Write acceptance criteria as observable behavior. Cover applicable success,
empty, invalid, loading, error, responsive, keyboard, and assistive-technology
states. Include architecture, compatibility, security, packaging, and release
boundaries when relevant.

Avoid criteria that prescribe private implementation details unless they
protect an architectural rule, compatibility guarantee, or security boundary.

### Tests

Describe the tests needed to protect the changed behavior. Select applicable
unit, golden-fixture, grammar, extension-host, accessibility, build, package,
or generated-output coverage. Tests should assert behavior and public output
rather than incidental object shape, broad snapshots, or internal call counts.

Name focused checks useful during development and require `npm run validate`
before a final implementation-story commit.

### Documentation

List usage guidance, setup instructions, architecture decisions, examples, or
operational notes that must change. Update the README when prerequisites,
setup, supported behavior, commands, or validation steps change. Record durable
architecture and language decisions under `docs/`.

### Dependencies

Record prerequisite issues, implementation-plan decisions, engine contracts,
provider dependencies, release configuration, or external setup. Distinguish
between:

- work that must exist before implementation;
- behavior that may be completed inside the story; and
- future extraction or enhancement points that are intentionally deferred.

### Out of Scope

State nearby work that the story does not deliver. Keep deferred features out
of acceptance criteria and identify a follow-up issue when one exists.

### Implementation Notes

Capture decisions that make the story implementable without prescribing every
line of code. Include selected defaults, rejected alternatives, test seams,
migration concerns, and constraints that prevent accidental scope growth.
Keep unresolved product choices explicit rather than silently choosing them.

## Workflow for Agents

1. Use the repository `user-story-writer` skill.
2. Read this standard and the root `AGENTS.md` completely.
3. Read `docs/implementation-plan.md` and documentation relevant to the
   affected engine, extension, or release area.
4. Inspect the parent plan and related child issues using the GitHub skill.
5. Identify the smallest independently testable outcome.
6. Infer decisions from repository evidence and ask only for product choices
   that materially change the outcome.
7. Draft or update the child issue using the required story shape.
8. Update or cross-reference issues whose assumptions or dependencies change.
9. Record durable decisions under `docs/` when they affect future work beyond
   the story.
10. Run or report a Markdown formatting check for local story artifacts.
