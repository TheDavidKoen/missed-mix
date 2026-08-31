# 0003 — GitHub Flow, branches deleted after merge

**Status:** Accepted · 2026-08-28

## Context

Solo project, continuously deployed, no release trains. The app it replaces lived
on a single `main` branch with zero pull requests, which is the thing being
corrected.

## Decision

GitHub Flow: `main` always deployable, short-lived `feat/`, `fix/`, `chore/`,
`docs/` and `refactor/` branches merged via pull request. Branches are deleted
once merged.

One build stage is one branch and one pull request.

## Rationale

The `develop` and `release` layers of heavier models exist to coordinate versioned
releases across teams. Adopting them here would be cargo cult. Choosing the
simpler process for a stated reason is a stronger signal than choosing the
elaborate one.

Merged branches are deleted because a branch is a workspace, not storage. The
commits remain reachable from `main`, and GitHub retains merged pull requests and
their diffs permanently. Stale branches invite work from an outdated base.

Splitting the build into eleven staged pull requests rather than one large drop is
deliberate. Each stage is reviewable on its own, and the sequence is the record of
how the app was reasoned about.

## Consequences

- Every change is reviewable as a self-contained diff.
- The pull request trail is the durable record, not the branch list.
- A branch that has already been merged is spent: further work starts a new one,
  because GitHub will not reopen a merged PR for new commits.
- Stage 0 and stage 1 landed together in the root commit rather than as two pull
  requests, because the repository did not exist yet when the scaffold was
  reshaped. The convention starts from stage 2.
