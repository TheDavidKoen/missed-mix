# 0004 — OAuth-only identity, no passwords

**Status:** Superseded by [0008](0008-demo-credentials.md) · 2026-08-28, superseded 2026-08-31

> Superseded because Missed Mix is a demonstration rather than a service, and
> asking a reviewer to authorise a real Google or Discord identity against a
> throwaway project was the wrong trade. Everything below still holds for a real
> service, and 0008 inherits the obligations it lists rather than dismissing them.

## Context

The app this replaces stored password hashes, issued JWTs in cookies with no
`maxAge` and no revocation path, and had no password policy or rate limiting in
front of the login route. Every one of those is a well-understood problem with a
well-understood fix, and implementing all of them correctly is a project in itself.

Missed Mix is a portfolio piece. A reviewer will look at how identity is handled.

## Decision

Sign-in is Google or Discord OAuth. No password field exists anywhere in the app,
and none is accepted. Stored identity is a provider ID and an email address.

## Rationale

The strongest thing to demonstrate about credential storage is the judgement not
to do it. A password database that does not exist cannot leak, cannot be
brute-forced, and cannot be stuffed with credentials from someone else's breach.
Removing it also removes hashing parameters, reset email flows, password policy,
and the lockout logic that has to sit in front of all of it.

Two providers rather than one, because a visitor who has neither a Google nor a
Discord account is rare, and Discord fits an app about music taste. Both are free
and neither requires review to use.

`/login` and `/register` are kept as separate routes even though OAuth collapses
them into one mechanism. Visitors look for both, and a first-time account needs to
land on onboarding rather than the feed. The difference is copy and destination,
not machinery, which is why one `beginSignIn` function serves both.

Sign-in is initiated with `POST`, not a link. A `GET` route that starts an OAuth
redirect can be triggered by a browser prefetch, a link scanner or a chat client
unfurling a URL.

## Consequences

- Sign-in depends on two third parties. If Google is down, half the front door is
  down. Two providers is the mitigation.
- Anyone who wants an account has to have one of the two. There is no fallback,
  by design.
- An email address still arrives from the provider and is still personal data. It
  is never rendered to another user.
- Account deletion has to remove the provider link as well as the profile. That
  lands in stage 9 with the rest of the data-rights work.
- If a third provider is ever added, `providerSchema` in `app/lib/auth.ts` is the
  only list to change: the UI iterates the same schema the action validates
  against, so the two cannot drift.
