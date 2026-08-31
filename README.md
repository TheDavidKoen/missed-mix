# missed-mix

Missed Mix is a social app that matches people on music taste. You declare what
you listen to, the app ranks the profiles closest to yours, and you send a
**vibration** — a nudge the other person can accept before any conversation opens.

Built by **David Koen** as a portfolio piece. The repository is part of the
deliverable: the branch history, pull requests and decision records are meant to
be read alongside the running app.

> **Status: in build.** Stage 2 of eleven. Registration and sign-in work, live at
> [missed-mix.pages.dev](https://missed-mix.pages.dev). The Vite dev server cannot
> load the mongodb driver, so the auth routes run only in a Pages build for now.
> See [Known issues](#known-issues).

## Stack

| Layer | Choice |
|---|---|
| Framework | React Router 8, framework mode, SSR |
| Language | TypeScript, `strict` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Validation | Zod, one schema per boundary |
| Database | MongoDB Atlas M0, official driver over TCP |
| Object storage | Cloudflare R2 *(stage 4)* |
| Realtime | Durable Objects, one per accepted pair *(stage 8)* |
| Identity | Username and password, no email, no third party |
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

**The auth routes do not work under `pnpm dev` today.** See
[Known issues](#known-issues). The landing page does.

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
| 2 | Credentials, sessions, rate limiting, `accounts` in Atlas | In progress |
| 3 | Onboarding and profiles |  |
| 4 | Avatars on R2 |  |
| 5 | Spotify catalogue and the taste picker |  |
| 6 | Similarity scoring and discovery |  |
| 7 | Vibrations: send, accept, decline |  |
| 8 | Conversations on Durable Objects |  |
| 9 | Hardening: rate limits, CSP, export and delete |  |
| 10 | Docs, seed data, launch |  |

## Identity

Registration takes a username and a password. That is the whole account: no email
address, no OAuth, no third-party identity, nothing linking a profile here to a
real account anywhere else.

This is a deliberate reversal. [ADR 0004](docs/adr/0004-oauth-only-identity.md)
originally chose OAuth on the grounds that the safest credential store is the one
you never build, which is correct for a real service. Missed Mix is not one, and
asking somebody assessing a portfolio project to authorise it against their real
Google account was the wrong trade. See
[ADR 0008](docs/adr/0008-demo-credentials.md) for the reasoning and, more
importantly, for the obligations that holding credentials creates.

**Missed Mix is a demonstration. Do not enter a password you use anywhere else.**
The auth pages say so too.

Holding credentials means doing it properly, and the Workers runtime constrains
how. bcrypt and Argon2 need WASM, so stage 2 uses PBKDF2-HMAC-SHA-256 through Web
Crypto with a per-user salt, digest comparison rather than string comparison,
failure messages that do not reveal whether a username exists, and rate limiting
on the sign-in route. That last one moves forward from stage 9, because a password
endpoint without a rate limit is precisely the flaw in the app this replaces.

Password policy is enforced on registration only. Signing in checks that the
fields are present and nothing else: telling a stranger which rules a stored
password breaks is free reconnaissance.

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

**The Vite dev server cannot load the mongodb driver.** Any request to `/login`,
`/register` or `/account` fails with `Calling require for "punycode/punycode.js"
in an environment that doesn't expose the require function`. It comes from
`tr46`, reached through `whatwg-url` and `mongodb-connection-string-url`. The
production build resolves it at build time and is unaffected, so this is dev only.
`patches/tr46@5.1.1.patch` rewrites the specifier and every resolution path points
at the patched copy, but Vite still emits the old require. Unresolved. Until it is,
verify auth against a Pages preview deployment rather than locally.

**`wrangler pages dev` does not inject `.dev.vars`.** It prints "Using secrets
defined in .dev.vars" and lists them, then hands an advanced-mode `_worker.js` an
env containing only `CF_PAGES*` and `ASSETS`. So the second local route to
testing auth is closed too.

Together those two mean **auth is verified by deploying, not locally**. A deployed
Pages project injects secrets normally and has none of these problems.

```sh
pnpm run pages:build
pnpm exec wrangler pages deploy build/client --project-name missed-mix --branch main
```

Secrets go up with `wrangler pages secret put <KEY> --project-name missed-mix`,
which reads the value from stdin and writes to **production only**; Preview
secrets have to be set in the dashboard.

**Node's SRV lookup can fail on Windows.** `pnpm run init-db` dies with
`querySrv ECONNREFUSED` when c-ares falls back to `127.0.0.1`. Set
`DNS_SERVERS` in `.dev.vars`.

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
