# Architecture decision records

One file per decision, numbered in the order taken. Each records the context,
what was decided, and what it costs.

| # | Decision | Status |
|---|---|---|
| [0001](0001-react-router-over-nextjs.md) | React Router 8 over Next.js | Accepted |
| [0002](0002-cloudflare-pages-over-workers.md) | Cloudflare Pages over Workers, with a generated edge entry | Accepted |
| [0003](0003-github-flow.md) | GitHub Flow, branches deleted after merge | Accepted |
| [0004](0004-oauth-only-identity.md) | OAuth-only identity, no passwords | Superseded by 0008 |
| [0005](0005-self-hosted-fonts.md) | Self-hosted fonts over Google Fonts | Accepted |
| [0006](0006-declared-taste-over-listening-history.md) | Declared taste over imported listening history | Accepted |
| [0007](0007-native-details-over-js-accordion.md) | Native `<details>` over a JavaScript accordion | Accepted |
| [0008](0008-demo-credentials.md) | Username and password credentials for the demo | Accepted |
| [0009](0009-mongodb-atlas-over-d1.md) | MongoDB Atlas over Cloudflare D1 | Accepted |
| [0010](0010-avatars-in-mongodb-not-r2.md) | Avatars in MongoDB rather than R2 | Accepted |

Superseded records stay in place with their status changed, rather than being
deleted. 0004 is worth reading alongside 0008: the argument it makes is sound for
a real service, and 0008 exists because this is not one.

Two of these, 0002 and 0005, are enforced by `pnpm run budget` rather than by
review, because breaking them produces no visible symptom.
