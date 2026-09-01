# 0006 — Declared taste over imported listening history

**Status:** Accepted · 2026-08-28

## Context

The obvious design is "connect your Spotify and we work out your taste". It needs
a user-authorised token and the `user-top-read` scope.

Spotify apps start in Development Mode, which caps user-authorised access to a
small allowlist of accounts added by hand in the dashboard. Lifting that cap
requires an extended quota request, which asks for a business case and is not
aimed at portfolio projects. An app that only works for a handful of manually
allowlisted people is not a demonstrable app.

## Decision

Reach Spotify with **Client Credentials** only, an app-level token with no user
context. Taste is declared: a person searches the catalogue and picks their own
artists and tracks during onboarding, and similarity is computed over those picks
and the genres behind them.

## Rationale

Client Credentials has no per-user cap, because there is no user in the exchange.
Search and artist metadata, which is all the matching needs, are available under
it. So the cap disappears entirely rather than being negotiated with.

Missed Mix therefore never holds a Spotify user token, never asks anyone for
access to their account, and stores no listening history. For an app whose whole
subject is what people listen to, holding less of that data is the better posture,
not a compromise.

The matching algorithm also becomes ours. Building a similarity score over genre
vectors is more interesting to read than a call to somebody's recommendations
endpoint, and it cannot be deprecated out from under us.

There is a product argument too. What someone chooses to show is a different thing
from what they happened to play, and for a social app the deliberate answer is the
more honest signal.

## Consequences

- Onboarding is longer. Picking artists is work that an import would have done.
- Cold start is worse: a profile with three picks matches poorly. Stage 5 needs a
  sensible minimum and a good picker.
- Nobody can be matched on a guilty pleasure they would not have listed. That is
  a real loss of signal, and accepted.
- Any future feature that assumes real listening data is incompatible with this
  decision and needs to reopen it, not work around it.
- **Attribution was removed from the profile page on 2026-09-01** at David's
  request. Spotify's developer terms ask for it wherever their content appears,
  so this is a known deviation on a demonstration rather than an oversight. It
  returns if the app ever becomes more than that.

## Amendment, 2026-09-01: Spotify no longer returns genres

The record above assumes similarity can be computed over "the genre vectors those
picks imply". Under Client Credentials that is no longer possible. Measured against
this project's own app:

| Endpoint | Result |
|---|---|
| `GET /v1/artists/{id}` | 200, but the object has no `genres`, `popularity` or `followers` |
| `GET /v1/artists?ids=` | 403 |
| `GET /v1/artists/{id}/related-artists` | 403 |
| `GET /v1/recommendations` | 404, removed |
| `GET /v1/albums/{id}` | 200, no `genres` |

What remains is search returning an id, a name and artwork. Spotify is a catalogue
and an image source for this project now, and nothing more.

The decision in this record stands: taste is still declared rather than imported,
and Client Credentials still sidesteps the user cap. What changes is that the
similarity signal has to come from somewhere else. Exact Spotify ID overlap is the
only thing available without adding a service, and across six picks and a small
population that will be zero almost every time.
