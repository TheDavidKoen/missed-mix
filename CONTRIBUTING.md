# Contributing

## Branching

`main` is always deployable. Work happens on short-lived branches merged via
pull request.

| Prefix | For |
|---|---|
| `feat/` | New behaviour or content |
| `fix/` | Correcting broken behaviour |
| `chore/` | Tooling, dependencies, config |
| `docs/` | Documentation only |
| `refactor/` | Restructuring without behaviour change |

Branches are deleted once merged — see
[ADR 0003](docs/adr/0003-github-flow.md). A merged branch is spent: GitHub will
not reopen its pull request for new commits, so further work starts a fresh
branch off `main`.

Always pull after switching:

```sh
git checkout main
git pull
git checkout -b feat/thing
```

One build stage is one branch and one pull request. The stage list is in the
[README](README.md#build-stages).

## Commits

[Conventional Commits](https://www.conventionalcommits.org/). Subject in the
imperative, under ~70 characters. Use the body to explain *why*, not what.

```
feat: send vibrations from the discovery feed

A vibration is an insert plus a rate limit check, not a message. The
recipient sees it as a notification and the conversation row is only
created on accept, so a declined vibration leaves nothing behind.
```

## Before opening a pull request

```sh
pnpm verify
```

That runs the type checks then Biome. Both must be clean. Also build the Pages
bundle and run the budget, since some failures only surface there:

```sh
pnpm run pages:build
pnpm run budget
```

CI runs all of this plus Lighthouse on every pull request, so a red check means
one of these failed. Reproduce it locally rather than pushing again to see.

Then check, by eye:

- The page at a narrow width, a laptop width, and something ultrawide
- Every control reachable by keyboard, with a visible focus ring
- Anything animated with reduced motion enabled in OS settings
- The rendered page through `pnpm preview`, not just `pnpm dev`, if the change
  touches response headers, asset serving or the worker entry

## Code conventions

**Copy goes in `app/content.ts`,** not in components. Components receive it as
data. Changing a sentence should be a data edit, and no string should exist in
two places.

**Design tokens go in `@theme`** in `app/app.css`. No raw hex values or magic
numbers in components. The accent is one token: moving the whole app off its
current green is a one-line change.

**Validate at the boundary, with Zod, before anything else runs.** Every value
arriving from a form, a query string, a cookie or a third-party API is untrusted
until a schema has parsed it. Schemas live in `app/lib/` so the same one can be
reused by the form, the action and the database layer.

**Never widen what a query returns.** The legacy app this replaces had an
endpoint that handed every user's full record, message text included, to any
authenticated caller. Select the columns a screen needs.

**Comments mark traps, not intentions.** Write one only where a developer could
break something without it — a cross-file contract, a load-bearing value, a
non-obvious constraint. Rationale belongs in an ADR. Prefer expressive naming
over a comment.

Good:

```js
/* The asset lookup is GET and HEAD only. A POST whose path matched an asset
   would otherwise be answered with the asset and never reach a route action. */
```

Not worth writing:

```js
/* Render a label and an input for each field. */
```

**Prose in rendered copy, comments and metadata uses no em dashes.** Markdown
documentation is exempt and uses them freely.

**Animated components handle `prefers-reduced-motion` themselves.** Gate the
transition, not just its duration: shortening a duration parks an animation
mid-cycle instead of stopping it.

## Recording a decision

Anything a future reader would otherwise reverse by accident gets an ADR in
`docs/adr/`, numbered in sequence, following the existing format. Superseded
records stay in place with their status changed.

Two of the current ADRs are enforced by `pnpm run budget` rather than by review,
because breaking them changes nothing you can see: the site keeps serving and
every page keeps rendering.
