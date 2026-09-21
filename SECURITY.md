# Security

## Reporting a vulnerability

Report privately through GitHub: the repository's **Security** tab, then **Report a
vulnerability**. Please do not open a public issue.

Only the version deployed from `main` is supported.

## What the application can do

Missed Mix holds accounts, profiles, avatars, vibrations and private messages in MongoDB
Atlas, and every page is rendered on Cloudflare's edge per request. It is a demonstration:
accounts are disposable and nothing stored is real ([ADR 0008](docs/adr/0008-demo-credentials.md)).

## Protections

| Layer | Protection | Where |
|---|---|---|
| Credentials | PBKDF2-HMAC-SHA-256 with a per-user salt, compared in constant time; the iteration count is stored in each hash | `app/lib/password.ts` |
| Credentials | Sign-in failures are generic, and a missing account costs the same time as a wrong password | `app/lib/auth.ts` |
| Session | Signed cookie, `HttpOnly`, `Secure`, `SameSite=Lax`, expiring after seven days | `app/lib/session.ts` |
| Access | One middleware guards every signed-in loader and action; avatars and search refuse unauthenticated requests | `app/lib/session.ts`, `app/routes/` |
| Input | Every form field, query string, cookie and API response is parsed by a Zod schema before use | `app/lib/` |
| Input | Avatars are identified by magic number, never by declared type, and capped at 2 MB | `app/lib/avatar.ts` |
| Input | Saved artwork must come from Spotify's image host, so a profile cannot embed a tracking URL | `app/lib/spotify.ts` |
| Data | Uniqueness of usernames and vibration pairs is enforced by database indexes, not prior lookups | `app/lib/mongo.ts` |
| Data | Messages are readable only by the two participants | `app/lib/vibrations.ts` |
| Transport | Sign-in is rate limited per client address and username, search per address, both per isolate | `app/lib/rate-limit.ts` |
| Browser | Content Security Policy trusting only scripts that carry a fresh per-response nonce | `scripts/bundle-pages.mjs` |
| Browser | HSTS, frame denial, `nosniff`, strict referrer policy, permissions policy, cross-origin opener isolation | `scripts/bundle-pages.mjs` |
| Edge | The compiled server bundle is not publicly readable, and local secrets are stripped from the upload | `scripts/bundle-pages.mjs` |
| Secrets | Connection string, session secret and Spotify credentials live in Cloudflare Pages settings | Cloudflare Pages settings |

## Known limits

- The password work factor is far below current guidance, because the free plan allows about
  10 ms of CPU per request. Acceptable only because accounts are disposable.
- Rate limits live in one isolate's memory, so they slow a single client rather than enforce a
  global ceiling.
- There are no CSRF tokens. `SameSite=Lax` keeps the session cookie off cross-site form posts,
  which covers the attack these routes are exposed to.
- Atlas accepts connections from any address, because Workers have no stable egress IPs. The
  database user is scoped to this application's database only.
- A person cannot yet export or delete their own record, or block another account.

## Privacy

No analytics and no tracking. Fonts are self-hosted, and the browser requests nothing outside
this origin except album and artist artwork, which loads from Spotify's image host. No email
address is collected. The only cookie is the session. The rate limiter holds a client address in
memory for one minute and never writes it anywhere.

## Supply chain

- CI installs with `--frozen-lockfile`, runs with a read-only token, does not persist checkout credentials, and fails on high or critical advisories in production dependencies
- Dependency build scripts run only when allowed by name in `pnpm-workspace.yaml`
- GitHub Actions are pinned to commit SHAs, and Dependabot keeps them and the npm dependencies current
- No deploy credential exists in this repository: deployments are made with Wrangler, authenticated on the machine that runs them
