# 0010 — Avatars in MongoDB rather than R2

**Status:** Accepted · 2026-09-01

## Context

Object storage is the obvious home for uploaded images, and R2 was the plan from
the start: it is Cloudflare's own, it sits beside the Worker, and its free tier is
10 GB of storage with ten million reads a month, which a demo could never exhaust.

Enabling R2 turned out to require a payment method on the account, even to use
only the free tier. `wrangler r2 bucket list` fails with `[code: 10042] Please
enable R2 through the Cloudflare Dashboard` until billing details are added.

"Every dependency and service is on a free tier" is a stated constraint of this
project, and a card on file is a different thing from a free tier.

## Decision

Store avatars in MongoDB Atlas, in an `avatars` collection, as a BSON binary
field keyed by `usernameLower`.

## Rationale

Atlas M0 is already provisioned, already free, and gives 512 MB. An avatar is
capped at 2 MB by [the upload rules](../ARCHITECTURE.md), so the ceiling is
comfortably beyond any plausible demo. Adding a second storage service to hold at
most a few hundred small files was never proportionate.

The swap cost almost nothing because the storage was already behind one module.
`app/lib/avatar.ts` changed; the route, the magic-number sniffing, the size cap
and the session gate did not. That containment is the reason this was a twenty
minute change rather than a rewrite, and it is worth preserving.

## Consequences

- **Every avatar view costs a database round trip.** R2 would have served bytes
  from the edge. This is mitigated by the URL carrying `?v=<updatedAt>`, which
  makes each version immutable and lets the response set a one year
  `Cache-Control`, so a returning visitor fetches it once.
- **Atlas bandwidth is now on the critical path for images**, and M0 has no
  published bandwidth allowance. If a real audience ever arrives, this is the
  first thing that will strain.
- **Documents carry binary.** The BSON limit is 16 MB and the cap is 2 MB, so
  there is headroom, but avatar bytes are deliberately kept in their own
  collection rather than on the profile so that reading a profile never drags an
  image along with it.
- **The driver's `Binary` is imported dynamically**, like the client itself, so
  the module stays out of the graph that Vite dev cannot bundle.

If the payment-method constraint ever stops mattering, R2 is the better answer
and this decision should be reversed. The module boundary makes that as cheap
going back as it was coming here.
