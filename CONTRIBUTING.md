# Contributing

## Branching

`main` is always deployable. Work happens on short-lived branches merged via
pull request. Pull requests are squash merged, so the pull request title becomes the commit
subject and must follow the commit format below.

| Prefix | For |
|---|---|
| `feat/` | New behaviour or content |
| `fix/` | Correcting broken behaviour |
| `chore/` | Tooling, dependencies, config |
| `docs/` | Documentation only |
| `refactor/` | Restructuring with no behaviour change |

Branches are deleted once merged, see
[ADR 0003](docs/adr/0003-github-flow.md). A merged branch is spent: GitHub will
not reopen its pull request for new commits, so further work starts a fresh
branch off `main`.

Always pull after switching:

```sh
git checkout main
git pull
git checkout -b feat/thing
```

## Commits

[Conventional Commits](https://www.conventionalcommits.org/). One short subject in the
imperative, under about 70 characters, naming the kind of change rather than listing every edit.
Authorship is visible on GitHub, so no author or co-author lines.

```
feat: add conversations to vibrations
docs: update the documentation
```

## Before opening a pull request

```sh
pnpm verify
```

That runs the type checks, Biome, the unit tests, the Pages bundle and the performance budget.
All must be clean. CI runs the same steps, then a dependency audit and Lighthouse, so a red check
means one of them failed. Reproduce it locally rather than pushing again to see.

Then check, by eye:

- The page at a narrow width, a laptop width, and something ultrawide
- Every control reachable by keyboard, with a visible focus ring
- Anything animated with reduced motion enabled in OS settings
- The rendered page through `pnpm preview`, not just `pnpm dev`, if the change touches
  response headers, the Content Security Policy, asset serving or the worker entry

## Code conventions

**Copy goes in `app/content.ts`,** not in components. Components receive it as data, so
changing a sentence is a data edit and no string exists in two places.

**Design tokens go in `@theme`** in `app/app.css`. No raw hex values or magic numbers in
components.

**Validate at the boundary, with Zod, before anything else runs.** Every value arriving from a
form, a query string, a cookie or a third-party API is untrusted until a schema has parsed it.

**Never widen what a query returns.** The legacy app this replaces had an endpoint that handed
every user's full record, message text included, to any authenticated caller. Select the fields
a screen needs.

**Prefer less code.** Reach for an array method or a named function before a hand-written loop,
and delete what nothing uses.

**Comments mark traps, not intentions.** Write one only where a developer could break something
without it: a cross-file contract, a load-bearing value, a non-obvious constraint. A file gets a
header only when its role is not clear from its name. Rationale belongs in an ADR. Prefer
expressive naming over a comment.

Good:

```ts
/* Visits every byte whatever it finds, so the time taken reveals nothing about where a
   guess first went wrong. An early return here would reopen a timing side channel. */
```

Not worth writing:

```ts
/* Render a label and an input for each field. */
```

**No emojis or em dashes anywhere:** code, comments, documentation, copy or commit messages.

**Tests sit beside the module they cover,** as `name.test.ts`.

**Animated components handle `prefers-reduced-motion` themselves.** Gate the transition, not
just its duration: shortening a duration parks an animation mid-cycle instead of stopping it.

## Recording a decision

Anything a future reader would otherwise reverse by accident gets an ADR in
`docs/adr/`, numbered in sequence, following the existing format. Superseded
records stay in place with their status changed.
