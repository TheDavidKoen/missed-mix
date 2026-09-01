# 0011 — MusicBrainz for genres, because Spotify stopped supplying them

**Status:** Superseded by [0012](0012-mixers-lists-everyone.md) · 2026-09-01

> Superseded the same day it was accepted. Mixers no longer ranks profiles, so
> nothing consumed the genre data and the whole dependency became dead weight.
> The measurements below still stand and are the reason a future ranking cannot
> use Spotify for genres.

## Context

[ADR 0006](0006-declared-taste-over-listening-history.md) established that taste is
declared rather than imported, and that similarity would be computed over "the
genre vectors those picks imply". That assumed Spotify returns genres on an artist.

It no longer does. Measured against this project's own Client Credentials app on
2026-09-01:

| Endpoint | Result |
|---|---|
| `GET /v1/artists/{id}` | 200, but no `genres`, `popularity` or `followers` |
| `GET /v1/artists?ids=` | 403 |
| `GET /v1/artists/{id}/related-artists` | 403 |
| `GET /v1/recommendations` | 404, removed |
| `GET /v1/albums/{id}` | 200, no `genres` |

What survives is search returning an id, a name and artwork. Spotify is a
catalogue and an image source now, and nothing else.

Without a genre signal the only similarity available is exact Spotify ID overlap.
Across six picks and a demo-sized population that is zero almost every time, so
Mixers would list people in arbitrary order while claiming they matched.

## Decision

MusicBrainz supplies genres. Spotify remains the source of identity and artwork.

An artist is resolved by its **Spotify URL relationship**, not by name:

```
/ws/2/url?query=url:"https://open.spotify.com/artist/{id}"&inc=artist-rels
  → MBID
/ws/2/artist/{mbid}?inc=genres
  → ["alternative rock", "art rock", "britpop", …]
```

Results are cached in an `artistGenres` collection keyed by the Spotify artist ID,
so any given artist is fetched once across all users, ever.

## Rationale

MusicBrainz needs no API key, no account and no payment method, which keeps the
free-tier constraint intact where Last.fm would have added another credential to
manage and push to Pages.

Resolving through the URL relationship rather than by name is what makes this
trustworthy. Name matching would have quietly attached the wrong genres to any
artist with a common name, and nothing in the interface would have revealed it.
Both artists tested resolved exactly: Radiohead and Billie Eilish.

## Consequences

- **One request per second, enforced.** MusicBrainz answers 503 above it, which
  this project hit immediately during testing. Two requests are needed per artist,
  so a cold profile of six artists would be roughly twelve seconds of blocking work
  if it were done at save time.
- **The cache is warmed when a pick is selected**, not when the profile is saved.
  The picker already calls this app's API, so choosing an artist fires a
  one-artist lookup in the background. The rate limit is then spread across the
  minutes someone spends choosing, and by the time they save it is a cache read.
  Measured: 9.1s cold, 1.0s warm, where the remaining second is the Mongo
  connection ([ADR 0009](0009-mongodb-atlas-over-d1.md)).
- **Saving never calls MusicBrainz.** It reads whatever the cache holds and stores
  an empty array otherwise, so a save is never slow and never fails because a third
  party is down.
- **A 503 is not cached, a genuine miss is.** Caching a rate-limit response would
  poison that artist permanently.
- **Coverage is not total.** An artist with no Spotify link in MusicBrainz gets an
  empty genre list and simply contributes nothing to matching. Mixers has to rank
  gracefully with partial data rather than assume every profile is comparable.
- **A third party is now on the critical path for match quality**, though not for
  the app working. If MusicBrainz disappeared, existing genres remain cached and
  only new artists would stop enriching.

`scripts/backfill-genres.mjs` fills picks saved before this existed, running
strictly in sequence with a pause between artists.
