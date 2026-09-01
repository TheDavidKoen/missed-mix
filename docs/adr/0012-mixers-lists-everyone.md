# 0012 — Mixers lists everyone, and ranks nobody

**Status:** Accepted · 2026-09-01 · supersedes [0011](0011-musicbrainz-for-genres.md)

## Context

Mixers was specified as a ranked feed of the profiles closest to yours. Delivering
that needed a similarity signal, and [ADR 0011](0011-musicbrainz-for-genres.md)
had just added MusicBrainz to supply genres after Spotify withdrew them.

Two things then became clear. The genre pipeline was a service dependency, a cache
collection, a warming call, a backfill script and a rate limit to respect, all in
service of ordering a list that, at demo scale, holds four people. And a score
presented next to somebody's face implies a confidence that four profiles and a
handful of shared tags cannot support.

## Decision

Mixers lists every profile except your own, most recently updated first, showing
each person's six picks in full. There is no score and no ranking.

MusicBrainz, the `artistGenres` cache, the warming endpoint and the backfill
script are removed, along with `genres` and `artistId` on picks.

## Rationale

The six answers are the interesting content. Seeing what somebody chose for "an
artist that reminds you of your childhood" tells a reader more than a percentage
would, and it lets them judge for themselves rather than trusting a number.

Removing the pipeline removes a third-party dependency, a rate limit, a cache to
keep warm and a migration script, in exchange for a Mongo query with a `$ne`. That
is a straightforwardly better trade while the population is small.

## Consequences

- **The product no longer claims to match on taste.** The landing page said Missed
  Mix "scores every profile against your taste and ranks the closest", which is now
  untrue, so that copy changed with this decision rather than being left to drift.
- **Listing does not scale**, and is capped at 60 profiles. Past that this needs
  pagination and, at that point, ranking becomes worth having again.
- **Bringing ranking back means reopening 0011**, not starting fresh. Its
  measurements of what Spotify withdrew remain accurate and are the reason any
  future ranking needs an outside genre source.
