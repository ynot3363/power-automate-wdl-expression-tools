# Commit standards

Use focused Conventional Commits that describe one coherent change.

## Format

```text
type(scope): imperative summary

Optional body explaining why the change is needed and any important tradeoffs.

Refs #123
```

Use a lowercase type and an optional concise scope. Keep the summary imperative,
specific, and free of a trailing period.

Common types:

- `feat`: user-facing functionality
- `fix`: defect correction
- `test`: test-only changes
- `docs`: documentation-only changes
- `refactor`: internal restructuring without a behavior change
- `chore`: repository, tooling, or maintenance work
- `ci`: continuous-integration or deployment workflow changes

## Boundaries

- Keep each child issue in its own commit unless the user requests a different
  boundary.
- Include implementation, tests, and directly related documentation together
  when they define one atomic contract.
- Do not mix unrelated cleanup or user-owned worktree changes into a commit.
- Stage explicit paths and inspect the complete staged diff before committing.
- Validate the changed surface and do not create a non-WIP commit when required
  checks fail.
- Do not amend, rebase, squash, or otherwise rewrite existing commits without
  explicit authorization.

Use `Refs #123` for local story commits. Put issue-closing keywords in the
eventual pull request only when that pull request fully satisfies the issue.
