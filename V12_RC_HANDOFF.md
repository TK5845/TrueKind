# TrueKind V12 RC handoff

## Purpose

Short handoff note for Version 12 Modules 1-4. Use this as the quick tester and future-development entry point before running the fuller Discover checklist.

Canonical flow remains:

`discover -> /matches?match=id -> /messages?match=id`

## What changed

- Module 1: Discover cards now include relevance context with `Varför den här?` using `buildDiscoverCardContext(...)`.
- Module 2: Discover readiness and empty states were tightened for signed-out users, profile-incomplete users, no-candidate states and backend/fallback empty states.
- Module 3: Discover card mobile readability was improved so card content, pills, relevance context and CTA rows scan better on narrow screens.
- Module 4: Added `DISCOVER_REGRESSION_CHECKLIST.md` as the focused manual regression checklist for Discover mobile and flow checks.

## Tester focus

Start with `/discover` and verify:

- signed-out state shows the expected login/register guidance.
- profile-incomplete state is clear, if a suitable account is available.
- no-candidate or backend/fallback copy is clear, if the state can be reached.
- candidate-card readability on mobile, especially around pills, bio, CTA rows and wrapping.
- `Varför den här?` is visible, readable and relevant.
- like/pass or like/undo-like behavior still works as before.
- route handoff from Discover to `/matches?match=id` still works.
- conversation handoff from matches to `/messages?match=id` still works.

For the detailed pass, use `DISCOVER_REGRESSION_CHECKLIST.md`.

## Risk and unchanged areas

- No backend or schema changes are part of V12 Modules 1-4.
- No matching logic changes are intended.
- No routing architecture changes are intended.
- No like/pass behavior changes are intended.
- App tests are not required for this Module 5 note because it changes documentation only.

## Recommended RC decision input

V12 is ready for a focused Discover RC pass when the checklist confirms:

- no blocking Discover empty-state regressions.
- no mobile readability regressions on candidate cards.
- `Varför den här?` is useful without crowding the card.
- the canonical flow still reaches matches and messages with the same `match=id` handoff.
