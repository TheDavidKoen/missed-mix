# 0009 — MongoDB Atlas over Cloudflare D1

**Status:** Accepted · 2026-08-31

## Context

Stage 2 needs persistence. Everything up to this point assumed Cloudflare D1 with
Drizzle: an edge-native SQLite reachable through a binding, with no network hop
and nothing exposed to the internet.

The app this replaces ran on MongoDB, the domain is document-shaped (a profile is
one document with arrays of taste picks and no joins worth having), and Atlas M0
is free permanently at 512 MB.

## Decision

MongoDB Atlas M0, reached with the official Node driver over TCP, under the
`nodejs_compat` compatibility flag.

## Rationale

The Atlas Data API, the HTTPS interface that used to make Mongo straightforward
from edge runtimes, was deprecated and shut down on 30 September 2025 along with
Atlas App Services. So the choice was the real driver or nothing.

That works, but it is not on Cloudflare's supported list: their "Connect to
databases" page mentions Atlas in prose and then omits it from every connection
table, and Hyperdrive covers Postgres and MySQL only. Community reports also
claimed the Pages runtime lagged Workers and could not do this at all.

So it was tested rather than assumed, against this project's actual Pages bundle.
The driver bundles into `_worker.js`, loads under `nodejs_compat`, and opens a
real TCP socket: a connection to an unroutable address failed with
`MongoServerSelectionError: Socket 'connect' timed out`, a network error rather
than a module or runtime error. The Pages limitation is stale. The driver costs
0.51 MB gzipped of the 3 MB free-plan worker budget.

## Consequences

Three of these are real losses and are the price of the decision.

- **No connection pooling across requests.** The Workers runtime ties open
  sockets to the I/O context of the request that opened them, so a `MongoClient`
  cannot be held in module scope and reused. Every request that touches the
  database pays a fresh TCP and TLS handshake, measured at 150 to 350 ms against
  Atlas. This is latency rather than CPU, and CPU is the metered resource, so it
  does not threaten the 10 ms limit. It does undercut the reason for being on the
  edge. Reuse *within* a request was recovered on 2026-09-02; see the amendment
  below. Reuse *across* requests still needs a Durable Object holding the
  connection, and stage 8 introduces Durable Objects for chat anyway.
- **Atlas must allow `0.0.0.0/0`.** Workers have no stable egress IPs, so no
  narrower rule exists. The cluster is reachable from the whole internet with
  credentials as the only defence, where D1 was reachable only through a binding.
  This is a genuine downgrade. It is mitigated, not solved, by a database user
  scoped to a single database, the connection string living only in Pages secrets
  and a gitignored `.dev.vars`, and the fact that nothing stored here is real.
- **"No third-party requests" stops being true.** It still holds for the browser,
  which contacts nothing but this origin. The server now talks to Atlas on most
  requests. `docs/ARCHITECTURE.md` says so rather than keeping the old claim.
- **Schema is not enforced by the platform.** SQLite would have rejected a
  duplicate username through a table constraint declared in a migration. Here
  uniqueness is an index, and an index can be absent without anything failing
  loudly: on 2026-08-31 this collection was found without it and two accounts
  shared a username. The registration path now asserts the index itself rather
  than trusting a setup script, which is the shape this class of problem takes on
  a schemaless store.

The upside beyond the domain fit: the failure modes here are ones a reviewer can
see being handled, which a binding to a managed SQLite would not have shown.

If Missed Mix ever stops being a demonstration, the `0.0.0.0/0` rule is the first
thing that has to change, and D1 becomes the better answer again.

## Amendment, 2026-09-02

The "no connection pooling" consequence was read as absolute, and the code took it
that way: `withDb` opened a connection, ran one query and closed it. A page whose
loaders each called it paid the handshake once per loader.

Only pooling *across requests* is actually forbidden. Within a request the socket
belongs to the live I/O context and is reusable, so `workers/app.ts` now opens one
session per request and `withDb` shares it through an `AsyncLocalStorage`. Measured
on production beforehand: 0.15 s for a page with no database call, 0.52 s with one,
0.60 s with two, 0.85 s with three. The slope of that line was the handshake, paid
again and again inside a single request.

Nothing else changed. Call sites still call `withDb(env, run)`, and one called
outside a request still opens and closes its own connection.

The Durable Object plan stands, and now buys less: it would remove the one
remaining handshake per request rather than three or four of them. That makes it a
stage 8 improvement rather than a latency fix the app is waiting on.
