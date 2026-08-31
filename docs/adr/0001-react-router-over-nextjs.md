# 0001 — React Router 8 over Next.js

**Status:** Accepted · 2026-08-28

## Context

Missed Mix replaces a React SPA talking to an Express API on MongoDB, three
deployables where the hosting for all three has lapsed. The rebuild has to run on
a free tier, keep server rendering, and put reads and writes somewhere that a
reviewer can find them.

Next.js is the default answer to this question. So the reason for not choosing it
needs to be written down.

## Decision

React Router 8 in framework mode, server rendered, deployed as a single
Cloudflare Pages project.

## Rationale

Next.js on Cloudflare means either OpenNext or the edge runtime, and both are an
adapter layer between the framework's assumptions and the platform's. That layer
is where the unpleasant surprises live, and it is maintained by neither party as a
first concern.

React Router 8 targets the Workers runtime directly. Loaders and actions are
ordinary web `Request` and `Response` handlers, so the code that runs at the edge
is the code as written, with nothing translating for it.

The data model matters more than the rendering model here. A loader reads and an
action writes, both colocated with the route that needs them. That removes the
separate API service the old build needed, and with it the second set of schemas,
the second auth check, and the possibility of the two disagreeing.

Server Components were not a factor. Nothing in this app needs to stream a
component tree from the server; it needs forms that validate and pages that
render fast.

## Consequences

- No Pages adapter exists, so the build is reshaped by a script we maintain. See
  [ADR 0002](0002-cloudflare-pages-over-workers.md).
- A smaller ecosystem than Next.js: fewer drop-in libraries assume this framework,
  and more will be written here.
- Roughly 95 KB gzip of React and router runtime arrives on every route. That is
  the floor, and `docs/PERFORMANCE.md` budgets around it rather than pretending it
  can be tuned away.
- Migrating away would mean rewriting route modules, though loaders and actions
  are close enough to plain handlers that the logic inside them would survive.
