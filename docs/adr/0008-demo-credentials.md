# 0008 — Username and password credentials for the demo

**Status:** Accepted · 2026-08-31 · supersedes [0004](0004-oauth-only-identity.md)

## Context

[ADR 0004](0004-oauth-only-identity.md) chose Google and Discord OAuth and argued
that the strongest thing to demonstrate about credential storage is the judgement
not to do it. That reasoning still holds for a real service.

Missed Mix is not a real service. It exists to be opened, clicked through and
closed by someone assessing the work. Two things about OAuth turned out to sit
badly with that:

- Signing in with Google or Discord hands a real identity to a demo. Anyone
  evaluating this app has to authorise a throwaway project against an account
  that matters to them, and the app collects an email address it has no use for.
- It makes the app dependent on two external services, and on OAuth applications
  registered against a personal account, in order to be reviewable at all.

## Decision

Username and password. No email address, no OAuth, no third-party identity.
Registration takes exactly two fields.

The auth pages carry a standing notice that this is a portfolio demonstration and
that accounts on it are throwaway.

## Rationale

An account here is meant to be disposable, and a username with no email attached
is the most disposable credential there is. It also means the app now stores
**less** personal data than the OAuth design did: no email address, no provider
identity, nothing that links a Missed Mix profile to a real account anywhere else.

Choosing to hold credentials also puts the interesting problem back on the table.
Storing a password correctly on the Workers runtime is a real constraint worth
demonstrating rather than sidestepping, and doing it visibly and well is a better
answer here than avoiding it.

## Consequences

This decision creates obligations that did not exist under 0004. None is optional,
and each lands with the stage that first makes it reachable.

- **Hashing, stage 2.** PBKDF2-HMAC-SHA-256 through Web Crypto, with a per-user
  random salt. bcrypt and Argon2 are not available on the Workers runtime without
  shipping WASM, so PBKDF2 is the pragmatic choice rather than the ideal one. On
  the iteration count, see the amendment below.
- **Constant-time comparison, stage 2.** Verification compares digests, never
  strings.
- **Generic failures, stage 2.** A failed sign-in says the same thing whether the
  username exists or not. Registration cannot avoid revealing that a username is
  taken, which is the argument for usernames rather than email addresses being the
  identifier.
- **Rate limiting, stage 2 rather than stage 9.** A password endpoint without one
  is the flaw the app this replaces actually had. It cannot wait for the general
  hardening pass.
- **Policy on registration only.** Sign-in validates that fields are present and
  nothing more. Telling a stranger which rules a stored password breaks is free
  reconnaissance.
- **The password is never echoed.** A failed submit repopulates the username and
  leaves the password field empty.

The cost is honest: this app now has a credential store, and a credential store is
a liability that ADR 0004 correctly identified. The mitigation is that nothing in
it is real, and the interface says so on every auth page. If Missed Mix ever stops
being a demonstration, this decision is the first one to reverse.

## Amendment, 2026-08-31: the iteration count is 5,000, not a high one

The original text above promised "a high iteration count". That cannot be
delivered on the plan this project is committed to, and pretending otherwise
would be worse than saying so.

The Workers **free plan allows 10 ms of CPU per request**. Waiting on I/O does
not count, so the Atlas round trip is irrelevant here, but PBKDF2 is pure CPU.
Measured in the Workers runtime on this project's own bundle:

| Iterations | Time |
|---|---|
| 10,000 | 14 ms |
| 50,000 | 43 ms |
| 100,000 | 108 ms |
| 200,000 | 209 ms |

Even 10,000 iterations exceeds the whole budget. OWASP's floor for
PBKDF2-SHA-256 is 600,000. There is no key derivation function that is both
meaningfully expensive to attack and cheap enough to fit in 10 ms, because those
are the same property.

Three commitments collide: everything on a free tier, store passwords, hash them
properly. Any two are achievable. The chosen resolution is to keep the free tier,
use **5,000 iterations**, which measures around 7 ms and leaves headroom for
rendering a failed sign-in, and to be explicit that this is weak.

What makes it defensible here and nowhere else: every account is disposable, no
email address is collected, and nothing stored is real. The auth pages say plainly
that this is a demonstration and that accounts are throwaway. An earlier version
also told visitors never to reuse a password; that sentence was removed on
2026-09-01, so the warning is now implicit in "not a real service" rather than
explicit. What would make this indefensible: the app becoming a real service
without this line changing first.

One thing keeps the door open: the iteration count is stored inside each hash
string rather than assumed, so raising it leaves every existing account still able
to sign in, because verification reads the count from the hash it is checking.

Re-hashing those accounts in place is **not** possible on this plan, and an earlier
draft of this record wrongly implied it was. Verifying an old hash and deriving a
new one in the same request costs both derivations, which exceeds 10 ms on its own.
Migrating stored hashes therefore requires the paid plan, where the ceiling rises
to 5 minutes of CPU and 600,000 iterations become trivial. It costs 5 USD per
month, and that is the entire distance between this and a properly hashed
credential store.
