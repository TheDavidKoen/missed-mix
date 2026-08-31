# Architecture decision records

One file per decision, numbered in the order taken. Each records the context,
what was decided, and what it costs.

| # | Decision |
|---|---|
| [0001](0001-react-router-over-nextjs.md) | React Router 8 over Next.js |
| [0002](0002-cloudflare-pages-over-workers.md) | Cloudflare Pages over Workers, with a generated edge entry |
| [0003](0003-github-flow.md) | GitHub Flow, branches deleted after merge |
| [0004](0004-oauth-only-identity.md) | OAuth-only identity, no passwords |
| [0005](0005-self-hosted-fonts.md) | Self-hosted fonts over Google Fonts |
| [0006](0006-declared-taste-over-listening-history.md) | Declared taste over imported listening history |
| [0007](0007-native-details-over-js-accordion.md) | Native `<details>` over a JavaScript accordion |

Superseded records stay in place with their status changed, rather than being
deleted.

Two of these, 0002 and 0005, are enforced by `pnpm run budget` rather than by
review, because breaking them produces no visible symptom.
