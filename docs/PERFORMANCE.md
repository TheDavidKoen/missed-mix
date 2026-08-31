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
| Client JavaScript | 125 KB | 112.4 KB |
| CSS | 8 KB | 4.0 KB |
| Fonts | 35 KB | 29.7 KB |

Measured 2026-08-31, at stage 1.

## Where the JavaScript goes

| Chunk | gzip | Loaded |
|---|---|---|
| `entry.client` | 56.6 KB | Every route |
| `jsx-runtime` | 37.2 KB | Every route |
| `lib` | 3.9 KB | Every route |
| `AuthPanel` | 10.9 KB | `/login`, `/register` only |
| `content` | 1.2 KB | Every route |
| `home`, `root`, `login`, `register`, `manifest` | 2.7 KB total | Per route |

About 95 KB of the total is React plus the React Router client runtime, which
arrives on any route. That is the floor for a hydrated React app and no amount of
tuning inside this repo moves it much. What the budget actually protects is the
gap between that floor and the ceiling: roughly 30 KB of headroom before a
dependency has to justify itself.

The landing page needs none of the 10.9 KB `AuthPanel` chunk, because route-level
code splitting is automatic in framework mode. Keeping it that way means not
importing route components into each other.

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
