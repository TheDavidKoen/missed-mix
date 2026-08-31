# 0002 — Cloudflare Pages over Workers, with a generated edge entry

**Status:** Accepted · 2026-08-28

## Context

Cloudflare's own guidance is that new projects should start with Workers; Pages
continues to be supported but receives no new investment. React Router 8's
Cloudflare template targets Workers, and its `deploy` script runs `wrangler
deploy`.

## Decision

Cloudflare Pages. The Workers build is reshaped into a Pages bundle by
[`scripts/bundle-pages.mjs`](../../scripts/bundle-pages.mjs), which also generates
the edge entry.

## Rationale

The app's domain is a free `is-a.dev` subdomain, a zone owned by is-a.dev, not by
this account. **Workers cannot attach a custom domain on a zone the account does
not own. Pages can.** That single constraint decides it, and it was established by
testing rather than by reading: of the registrations in `is-a-dev/register`, the
ones pointing at `workers.dev` all use URL redirect records that drop the is-a.dev
name from the address bar, while several hundred CNAME straight to `pages.dev`.

`@react-router/cloudflare-pages` is unpublished, so there is no adapter. The
reshaping is mechanical: move the server build under `_worker.js/`, write an entry
beside it, drop the build metadata.

The entry has to exist because Pages advanced mode routes **every** request to the
worker and serves no static file on its own. Three things in it are load-bearing:

- The asset lookup is GET and HEAD only, so a `POST` whose path matched an asset
  still reaches its action.
- Requests under `/_worker.js/` are refused. The asset binding is backed by the
  output directory, which contains the compiled server bundle. Without this, the
  server code is readable over HTTP.
- Security response headers are set here, because a `_headers` file applies only
  to static responses and every SSR response would miss them.

## Consequences

- We are on a platform in maintenance rather than active development.
- The bundling script is ours to maintain, and a React Router release could change
  the build layout under it. It is small and it fails loudly.
- Two of the three properties above fail **silently** if the entry is edited
  carelessly: the site keeps serving and every page keeps rendering while the
  server bundle becomes public or the headers vanish. `scripts/check-budget.mjs`
  asserts all three against the built output, and CI runs it on every pull request.
- Attaching the domain cannot be done from the Cloudflare dashboard. `is-a.dev` is
  on the Public Suffix List, so the dashboard treats the subdomain as registrable
  and asks to transfer a zone belonging to someone else. It has to go through the
  Pages API. The command is in the README.
- If a domain is ever bought and its zone moved into the account, moving to
  Workers becomes a config change and the deletion of one script.
