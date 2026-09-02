# Performance

The budget is enforced in CI by [`scripts/check-budget.mjs`](../scripts/check-budget.mjs).
The numbers here and the numbers in that file are one fact stored twice; changing
one means changing the other.

Run it locally:

```sh
pnpm run pages:build
pnpm run budget
```

## Budget

Measured as gzipped bytes across everything in `build/client` that a browser can
download. The `_worker.js` directory is excluded: it runs on the server and is
never sent anywhere.

| Bucket | Budget | Measured |
|---|---|---|
| Client JavaScript | 125 KB | 105.6 KB |
| CSS | 8 KB | 4.3 KB |
| Fonts | 35 KB | 29.7 KB |

Measured 2026-09-01, at stage 5.

## Where the JavaScript goes

| Chunk | gzip | Loaded |
|---|---|---|
| `entry.client` | 56.6 KB | Every route |
| `jsx-runtime` | 37.2 KB | Every route |
| `lib` | 4.3 KB | Every route |
| `content` | 1.6 KB | Every route |
| `profile` | 2.0 KB | `/profile` only |
| `AuthPanel` | 0.8 KB | `/login`, `/register` only |
| `Field` | 0.5 KB | Wherever a form renders |
| `home`, `root`, `login`, `register`, `manifest` | 2.9 KB total | Per route |
| `api.search`, `avatar._username` | 0 KB | Server only, no client component |

About 98 KB of the total is React plus the React Router client runtime, which
arrives on any route. That is the floor for a hydrated React app and no amount of
tuning inside this repo moves it much. What the budget actually protects is the
gap between that floor and the ceiling: about 19 KB of headroom before a
dependency has to justify itself.

The mongodb driver adds nothing to these numbers. It is imported only from
`app/lib/mongo.ts`, which no component reaches, so it stays in the server bundle:
2.9 MB raw, 0.51 MB gzipped, against the 3 MB free-plan worker limit.

`AuthPanel` fell from 10.9 KB to 0.8 KB across two changes: dropping the Google and
Discord marks with [ADR 0008](adr/0008-demo-credentials.md), then moving its field
markup into the shared `Field` component that `/profile` also uses. Two inline
provider logos were an order of magnitude larger than the form that replaced them.

`api.search` and `avatar._username` are resource routes with no component, so they
contribute nothing to the client bundle at all.

The landing page loads none of the profile or auth chunks, because route-level code
splitting is automatic in framework mode. Keeping it that way means not importing
route components into each other.

## Fonts

Figtree, variable weight 300 to 900, self-hosted through
`@fontsource-variable/figtree` and subset by Fontsource into `latin` (19.7 KB) and
`latin-ext` (10.1 KB). Only the subsets a page actually needs are fetched.

Self-hosting is a correctness rule, not a preference, and the budget check fails
the build if the compiled CSS ever points at `fonts.googleapis.com` or
`fonts.gstatic.com`. See [ADR 0005](adr/0005-self-hosted-fonts.md).

`font-display: swap` comes from Fontsource. There is no font-loading JavaScript.

## What the budget check also guards

Three regressions that change nothing you can see. The site keeps serving, every
page keeps rendering, and something important is quietly gone:

1. **The `_worker.js` guard.** Without it the compiled server bundle is readable
   over HTTP.
2. **Security response headers.** Set at the edge entry, so an edit to
   `bundle-pages.mjs` can drop them silently.
3. **Google Fonts creeping back in.** A third-party connection on the critical
   path, and a visitor's IP address in someone else's log.

Each is asserted against the built output rather than the source, so the check
fails on what actually ships.

## Server response time

The budget above covers bytes sent to the browser. The other half of a page's cost
is the time the edge spends before the first byte, and here that is dominated by
one thing: every connection to Atlas is a fresh TLS handshake, 150 to 350 ms.

Measured on production, response time tracked the number of database calls a route
made almost exactly:

| Route | Database calls | Response time |
|---|---|---|
| `/` | 0 | 0.15 s |
| `/profile` | 1 | 0.52 s |
| `/mixers` | 2 | 0.60 s |
| `/mixers/:username` | 3 | 0.85 s |

Loaders now share one connection per request
([Architecture](ARCHITECTURE.md#database-connections)), so that slope flattens: a
route pays one handshake regardless of how many reads it makes. Locally, where the
hop to Atlas is longer and every figure is higher, `/mixers/:username` went from
costing 63% more than `/profile` to costing 5% more — the gap between one read and
three is now round trips over an open socket, not new connections.

Two rules follow, and they are worth keeping in mind when adding a route:

1. **Reads inside one request are cheap; requests are not.** Splitting work across
   two fetches costs a second handshake. Adding a query to a loader does not.
2. **Parallel reads are free.** `Promise.all` across the ambient session opens one
   connection, so there is no reason to sequence independent queries.

This is not asserted in CI. It depends on Atlas and the network between it and the
edge, so a threshold would fail for reasons unrelated to a change.

## Lighthouse

CI serves the real Pages bundle through Workerd and audits it three times on the
desktop preset. Assertions live in [`lighthouserc.json`](../lighthouserc.json).

| Category | Landing | `/register` |
|---|---|---|
| SEO | error below 1.0 | off |
| Accessibility | error below 0.95 | error below 0.95 |
| Best practices | error below 0.95 | error below 0.95 |
| Performance | warn below 0.9 | not asserted |
| CLS | error above 0.05 | not asserted |
| LCP | warn above 2000 ms | not asserted |

SEO is switched off for `/register` because that page is deliberately `noindex`,
which Lighthouse scores as a failure. Auditing it at all is for the accessibility
pass: it holds the only form in the app so far.

`csp-xss` is off until stage 9 adds a Content Security Policy.
