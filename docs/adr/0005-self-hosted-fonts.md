# 0005 — Self-hosted fonts over Google Fonts

**Status:** Accepted · 2026-08-28

## Context

The design calls for Figtree, a geometric sans standing in for the proprietary
typeface the visual language borrows from. The React Router scaffold shipped with
Inter loaded from Google Fonts via two `preconnect` hints and a render-blocking
stylesheet, which is the path of least resistance.

## Decision

Self-host through `@fontsource-variable/figtree`, imported from `app/app.css`. No
external font requests.

## Rationale

A Google Fonts stylesheet costs a DNS lookup, a TLS handshake and a round trip to
a second origin before the first byte of font data, and it sits on the critical
path. Self-hosted files come from the same connection as everything else and are
fingerprinted and cached immutably by the same asset pipeline.

It is also a privacy question, and for this app that matters more than the
milliseconds. Missed Mix is a social app handling birth years, declared taste and
private conversations. Sending every visitor's IP address to a third party in
order to render text is inconsistent with the rest of the posture, and it has been
found unlawful under GDPR in at least one German court decision.

Fontsource subsets the variable font into `latin` and `latin-ext`, so a page
fetches only the range it uses: 19.7 KB and 10.1 KB gzipped respectively.

## Consequences

- Font updates arrive as a dependency bump rather than automatically.
- Roughly 30 KB of the performance budget is font data served from our own origin
  rather than someone else's cache.
- The regression is invisible: a stylesheet that reaches out to Google Fonts
  renders perfectly, so nothing looks wrong. `scripts/check-budget.mjs` greps the
  compiled CSS for `fonts.googleapis.com` and `fonts.gstatic.com` and fails the
  build, and also fails if no self-hosted font files are present at all.
