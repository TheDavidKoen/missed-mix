# 0007 — Native `<details>` over a JavaScript accordion

**Status:** Accepted · 2026-08-31

## Context

The landing page explains the product in three steps that expand on click to show
a fuller description, one open at a time, animating smoothly.

The reflex implementation is `useState` in the route component, `aria-expanded` on
each trigger, and a wrapper transitioning `grid-template-rows` from `0fr` to `1fr`.

## Decision

Native `<details>` elements sharing a `name` attribute, expanded with the
`::details-content` pseudo-element and `interpolate-size: allow-keywords`.

## Rationale

A shared `name` on `<details>` is the platform's own exclusive accordion:
opening one closes the others, with no state to hold and no handler to write.

Everything the hand-rolled version needs to get right is free here. The disclosure
is keyboard operable, announced correctly by screen readers, and works before
hydration, which matters on the one page whose entire job is to load fast for
someone who has never visited before. It also survives JavaScript failing.

Animating it is not automatic, because a closed `<details>` sets its content to
`display: none` and nothing can transition from that. `::details-content` provides
a box to animate, `interpolate-size: allow-keywords` makes `block-size` reach
`auto` as a real interpolation, and `transition-behavior: allow-discrete` keeps
the content visible on the way out so closing eases rather than vanishing.

## Consequences

- Exclusive opening needs Chrome 120, Safari 17.2 or Firefox 130. The animation
  needs Chrome 131, Safari 18.4 or Firefox 139.
- Older browsers ignore both: every card can be open at once and expansion is
  instant. Nothing breaks and no content is unreachable, which is why this is
  acceptable for a landing page rather than for core functionality.
- `interpolate-size` is one line and the entire animation depends on it, which is
  why it carries one of the few comments in the codebase.
- Reduced motion is handled by scoping the transition inside
  `@media (prefers-reduced-motion: no-preference)` rather than by overriding
  durations with `!important`. Someone with reduced motion set gets an instant
  open, which is the correct behaviour rather than a degraded one.
- If a future accordion needs to work in older browsers or to be controlled from
  application state, this decision does not generalise and should be revisited for
  that component alone.
