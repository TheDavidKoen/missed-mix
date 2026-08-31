# missed-mix

Missed Mix is a social app that matches people on music taste. You declare what
you listen to, the app ranks the profiles closest to yours, and you send a
**vibration** — a nudge the other person can accept before any conversation opens.

Built by **David Koen** as a portfolio piece. The repository is part of the
deliverable: the branch history, pull requests and decision records are meant to
be read alongside the running app.

> **Status: in build.** Stage 1 of eleven. The logged-out entry is live; the pages
> at `/login` and `/register` return `501` until OAuth lands. See
> [Build stages](#build-stages).

## Stack

| Layer | Choice |
|---|---|
| Framework | React Router 8, framework mode, SSR |
| Language | TypeScript, `strict` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Validation | Zod, one schema per boundary |
| Database | Cloudflare D1 with Drizzle *(stage 2)* |
| Object storage | Cloudflare R2 *(stage 4)* |
| Realtime | Durable Objects, one per accepted pair *(stage 8)* |
| Identity | Google and Discord OAuth, no passwords |
| Catalogue | Spotify Web API, Client Credentials only |
| Lint + format | Biome |
| Fonts | Figtree, self-hosted via Fontsource |
| Host | Cloudflare Pages |

Every dependency and service is on a free tier. See [`docs/adr/`](docs/adr) for
why each was chosen.

## Getting started

```sh
pnpm install
pnpm dev
```

The dev server runs at **http://localhost:5173**.

`pnpm dev` serves the app through Vite, which does **not** apply the security
response headers. Those are set at the Pages edge entry. Use `pnpm preview` for
anything that depends on them.

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | Vite dev server with HMR |
| `pnpm build` | Production build to `build/` |
| `pnpm run pages:build` | `build`, then reshape it into a Pages bundle |
| `pnpm preview` | Build the Pages bundle and serve it through Workerd |
| `pnpm run typecheck` | Wrangler types, React Router typegen, `tsc -b` |
| `pnpm lint` | Biome lint + format check |
| `pnpm run lint:fix` | Apply Biome's safe fixes |
| `pnpm verify` | `typecheck` then `lint` — run before opening a PR |
| `pnpm run budget` | Assert the performance budget and the edge guards |

## Project structure

```text
app/
├── components/     UI components, one concern each
├── lib/            Boundary logic: schemas, validation, auth
├── routes/         Route modules, one file per URL
├── content.ts      All user-facing copy
├── app.css         Design tokens in @theme
├── root.tsx        Document shell and error boundary
└── routes.ts       Route table
workers/            Worker entry for the React Router request handler
scripts/
├── bundle-pages.mjs  Reshapes the Workers build into a Pages bundle
└── check-budget.mjs  Performance budget and edge regression guards
docs/
├── adr/            Architecture decision records
├── ARCHITECTURE.md How the pieces fit
└── PERFORMANCE.md  Budget and measurements
```

**Copy lives in `app/content.ts`, not in components.** Headlines, step
descriptions and auth panel wording are typed exports consumed as data. Changing
a sentence is a data edit, and the same string cannot drift between two pages.

**Design tokens live in `@theme`** in `app/app.css`. No raw hex values in
components.

## Build stages

Each stage is one branch and one pull request. `main` stays deployable at every
boundary.

| # | Stage | State |
|---|---|---|
| 0 | Scaffold, toolchain, CI, docs | Done |
| 1 | Logged-out entry: landing, `/login`, `/register` | Done |
| 2 | OAuth, sessions, `accounts` in D1 | Next |
| 3 | Onboarding and profiles |  |
| 4 | Avatars on R2 |  |
| 5 | Spotify catalogue and the taste picker |  |
| 6 | Similarity scoring and discovery |  |
| 7 | Vibrations: send, accept, decline |  |
| 8 | Conversations on Durable Objects |  |
| 9 | Hardening: rate limits, CSP, export and delete |  |
| 10 | Docs, seed data, launch |  |

## Identity

There is no password field anywhere in this app, and there never will be. Sign-in
goes through Google or Discord, and the only identity data stored is a provider
ID and an email address. A password database that does not exist cannot leak, and
the whole category of hashing, reset flows and credential stuffing goes with it.
See [ADR 0004](docs/adr/0004-oauth-only-identity.md).

`/login` and `/register` are the same mechanism. With OAuth there is no separate
registration step: the difference is the wording and where a first-time account
lands afterwards. Both are offered because visitors look for both.

## Music data

Spotify is reached with **Client Credentials**, an app-level token with no user
context. That sidesteps the Development Mode user cap, which would otherwise limit
the app to a handful of allowlisted testers, and it means Missed Mix never holds a
Spotify user token.

The cost is that the app cannot read anyone's listening history. Taste is
**declared**: you search the catalogue and pick your own artists and tracks, and
similarity is computed over those picks. See
[ADR 0006](docs/adr/0006-declared-taste-over-listening-history.md).

Missed Mix is not affiliated with Spotify. It borrows the visual language of a
dark music app, and none of Spotify's marks: no logo, no wordmark, no Circular.
Attribution for catalogue data appears wherever that data is shown, from stage 5.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, commit format and the
pre-PR checklist.

## Continuous integration

Every pull request into `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

| Job | Does |
|---|---|
| `verify` | `tsc`, Biome, production build, Pages bundle, budget and edge guards |
| `lighthouse` | Audits the served Pages bundle, three runs, desktop preset |

The budget step enforces [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) and guards
three regressions that are otherwise invisible: the server bundle becoming
publicly readable, SSR responses losing their security headers, and the
stylesheet quietly reaching out to Google Fonts.

## Deployment

Cloudflare Pages, built from `main` on every push. Pull requests get their own
preview URL.

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `pnpm run pages:build` |
| Output directory | `build/client` |
| Node version | `.node-version` (24.14.1) |

React Router 8 has no Cloudflare Pages adapter, so
[`scripts/bundle-pages.mjs`](scripts/bundle-pages.mjs) reshapes the Workers build
into the `_worker.js` directory Pages expects, and writes the edge entry that does
the asset lookup, blocks access to the server bundle, and sets the security
headers. See [ADR 0002](docs/adr/0002-cloudflare-pages-over-workers.md).

The domain will be a free `is-a.dev` subdomain, registered by pull request against
[is-a-dev/register](https://github.com/is-a-dev/register). **Attaching it cannot
be done from the Cloudflare dashboard**: `is-a.dev` is on the
[Public Suffix List](https://publicsuffix.org/), so the dashboard treats the
subdomain as registrable in its own right and demands a zone transfer that is
impossible. Use the Pages API instead:

```sh
curl -X POST "https://api.cloudflare.com/client/v4/accounts/<account-id>/pages/projects/<project>/domains" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"missedmix.davidkoen.is-a.dev"}'
```

The token needs only **Account → Cloudflare Pages → Edit**.

## Known issues

**`pnpm install` needs two build scripts approved.** pnpm 11 blocks postinstall
scripts by default and only warns. `esbuild` and `workerd` both need theirs to
fetch platform binaries, so `pnpm-workspace.yaml` sets `allowBuilds` for both. A
clone that skips this fails at build time, not install time.

**`pnpm create cloudflare` fails on Windows.** It shells out to `pnpm dlx`, which
trips over a stale symlink in the pnpm store. Use `npm create cloudflare` and swap
the lockfile afterwards.

**Biome cannot parse Tailwind v4 CSS by default.** `@theme` and the
`@import "tailwindcss" source(".")` modifier are parse errors until
`css.parser.tailwindDirectives` is enabled in `biome.json`.

**The step expanders need a recent browser.** Exclusive `<details name>` and the
`::details-content` transition need Chrome 131, Safari 18.4 or Firefox 139 and
later. Older browsers open every card at once, instantly. Nothing breaks. See
[ADR 0007](docs/adr/0007-native-details-over-js-accordion.md).
