# MVP Completion Audit

## Current App Status

**Date/time:** 2026-07-19 15:09:13 +02:00  
**Branch audited:** `main`  
**Audit type:** Documentation-only MVP completion audit  
**Current conclusion:** The app has the main MVP surfaces in place, but it is not ready for real user testing until local/internal auth, Supabase readiness, and signed-in seeded data are proven end to end.

Canonical flow remains:

```text
discover -> /matches?match=id -> /messages?match=id
```

Version 12 made Discover more testable and more readable, but signed-in Discover RC is still blocked by missing/unfinished real authenticated test conditions. The next work should not start with new product features. It should first prove a stable signed-in internal environment, test user, profile, candidates, matches, and messages.

## Verification Baseline

Commands run during this audit:

| Check | Result | Notes |
| --- | --- | --- |
| `git status --short` | PASS | Clean before this document was added. |
| `git diff` | PASS | No source diff before this document was added. |
| `npm.cmd run lint` | PASS WITH WARNINGS | 0 errors, 6 existing `<img>` warnings. |
| `npx.cmd tsc --noEmit --incremental false` | PASS | No output. |
| `npm.cmd test` | PASS | 77/77 tests passed. |

`npm.cmd run build` was not run in this audit because no source code changed and the task asked for a documentation-only audit. It should be included before pilot readiness.

## Route Inventory

| Route | File | Status | MVP notes |
| --- | --- | --- | --- |
| `/` | `app/page.tsx` | Present | Marketing/start surface with CTAs. Risk: uses legacy `truekindAccount` localStorage state rather than Supabase auth for the primary account-aware CTA. |
| `/login` | `app/login/page.tsx` | Present | Supabase email/password login, config error handling, redirects to `/discover` on success. |
| `/register` | `app/register/page.tsx` | Present | Supabase signup with first name metadata and email-confirmation copy. Needs pilot confirmation against actual Supabase email settings. |
| `/onboarding` | `app/onboarding/page.tsx` | Present | Guides account, profile, image, voice, video, Discover, matches, and messages. Mostly local/profile-state driven. |
| `/profile` | `app/profile/page.tsx` | Present, protected | Profile edit, image upload, video upload, local cache, Supabase profile upsert. Needs real signed-in media/storage RC. |
| `/voice` | `app/voice/page.tsx` | Present, protected | Browser microphone recording, voice upload, profile link update. Needs real browser/device/storage RC. |
| `/discover` | `app/discover/page.tsx` | Present | V12 refined Discover states, candidate cards, relevance context, like/unlike, `/matches` and `/messages` handoff links. Signed-in candidate-card RC remains blocked. |
| `/matches` | `app/matches/page.tsx` | Present | Signed-in match list/detail backed by saved matches and conversation previews; signed-out empty/auth state exists. |
| `/messages` | `app/messages/page.tsx` | Present | Signed-in conversation list/detail, send message to `messages_demo`, read-state updates, query handoff. Needs end-to-end signed-in RC. |
| `/match` | `app/match/page.tsx` | Present redirect | Legacy redirect to `/matches`. Good enough as compatibility shim. |
| `/internal/readiness` | `app/internal/readiness/page.tsx` | Present | Internal Supabase/session/table/bucket/seed readiness page. Useful for Phase 1, but should be treated as internal-only for pilot. |

## Feature Inventory

| Area | Current state | MVP assessment |
| --- | --- | --- |
| Auth | Supabase login/register/logout and session listeners are present. | Good enough for internal MVP if actual project email confirmation and test credentials are verified. |
| Account gating | `RequireAccount` protects profile and voice; Discover/matches/messages show signed-out states. | Good enough for internal testing. Consider protected-content flash and public internal route before pilot. |
| Onboarding | Route exists and points users through the intended flow. | Good enough for MVP guidance, but needs real flow RC from fresh signup. |
| Profile | Rich profile fields, image, voice, video, local cache, backend upsert. | Feature-complete enough for MVP, but media/storage and fresh-user persistence need real RC. |
| Discover | Candidate loading, readiness states, empty states, relevance context, mobile work, like/unlike and route handoff are present. | Structurally ready, but signed-in candidate-card interaction is not verified. |
| Matches | Loads saved matches, supports `?match=id`, empty/unavailable states, conversation context. | Structurally ready, but depends on successful Discover like/save and seeded backend data. |
| Messages | Loads conversations, supports `?match=id`, sends messages, marks read state. | MVP-capable for internal pilot, but still uses `messages_demo` naming/model and needs signed-in RC. |
| Backend setup | SQL setup and user seed template exist for profiles, discover candidates, matches, messages, buckets, and RLS. | Good enough for internal setup, not yet proven in the current environment. |
| Readiness | Internal readiness helpers and page exist; tests cover helper logic. | Strong MVP support, but must be run while signed in with real test data. |
| Test coverage | Unit tests cover readiness helpers, data normalization, local fallback, match/message/profile helpers. | Good base for utilities. Missing end-to-end browser coverage is expected for this stage. |
| RC docs | V12 checklist, handoff, setup, and blocked evidence files exist. | Good audit trail. Next evidence must show a real signed-in run or a clearly documented blocker. |

## MVP-Ready Areas

- Main route skeleton exists for the full product flow.
- Supabase client/server config handling exists and fails with user-facing configuration messages.
- Auth screens are practical and route users to Discover.
- Profile creation/editing has the core MVP data model: name, age, city, intent, activity, interests, bio, prompt, favorites, image, voice, and video.
- Discover has signed-out, profile-incomplete, empty, fallback, candidate-card, relevance-context, and like/unlike states.
- Matches and messages both support `?match=id`, which preserves the canonical handoff path.
- Internal backend readiness checks exist and are covered by tests.
- Repeatable SQL setup exists for internal schema, RLS, storage buckets, global candidates, and optional user seed data.
- Lint, TypeScript, and unit tests pass on the current branch.

## Incomplete Or Blocked

| Item | Type | Status | Why it matters |
| --- | --- | --- | --- |
| Real signed-in Discover RC | RC verification | BLOCKED | Candidate-card readability, `Varför den här?`, like/unlike, and handoff have not been proven in a real authenticated browser state. |
| Internal test user | Data/setup | BLOCKED | Need one approved test account with credentials handled outside repo files. |
| Non-production Supabase confirmation | Data/setup | BLOCKED | The repo cannot prove the configured project is local/staging/demo without external context. |
| SQL setup execution | Data/setup | BLOCKED | `supabase-internal-setup.sql` and user seed template are ready but not proven against the active project during the latest RC attempts. |
| Signed-in `/internal/readiness` pass | RC verification | BLOCKED | HTTP 200 was verified in V12 evidence, but signed-in readiness with no red checks still needs a real session. |
| Fresh signup-to-profile RC | RC verification | NOT DONE | Register/login/email confirmation/profile completion must be tested as one clean-user journey. |
| Profile media RC | RC verification | NOT DONE | Image, voice, and video upload rely on storage buckets, browser permissions, and RLS. |
| Messages send/read RC | RC verification | NOT DONE | Unit tests pass, but live insert/read-state behavior needs a signed-in seeded account. |
| Production/pilot readiness | Deployment/setup | NOT DONE | Build, environment review, deployment route checks, and internal route safety need a separate pass. |

## Broken Or Risky

- **MVP blocker:** The app cannot be called real-user-test-ready until at least one signed-in test account reaches `/discover`, sees candidate cards, likes a candidate, opens `/matches?match=id`, and opens/sends in `/messages?match=id`.
- **Environment ambiguity:** Existing docs correctly warn not to use production Supabase, but the repo cannot independently verify the current `.env.local` target without reading values or using external project access.
- **Internal route exposure:** `/internal/readiness` is intentionally not linked from product flow, but it is still a public route. Before a pilot, decide whether this route should be disabled, hidden behind auth, or accepted as internal-only in the deployment environment.
- **Legacy local account signal:** `/` reads `truekindAccount` from localStorage, while real auth is Supabase. This can make the start page CTA state drift from actual auth state.
- **Protected-content flash:** `RequireAccount` renders children until the session check finishes. This may briefly show protected profile/voice UI before redirecting signed-out users.
- **Demo naming in data model:** `messages_demo` is usable for MVP testing, but the table name signals internal/demo status. Decide whether to keep it for pilot or migrate later.
- **Media flows need device/browser proof:** Microphone, image compression, video upload, storage cleanup, and public URLs are implemented but not yet pilot-proven.
- **Lint warnings remain:** Existing `<img>` warnings are not blockers, but they should be reviewed before performance-focused launch work.

## Required Before Real User Testing

1. Confirm `.env.local` points to an approved non-production Supabase project without recording secret values.
2. Run or verify `supabase-internal-setup.sql` in that project.
3. Create or identify one approved internal test user.
4. Run the user seed template in a scratch SQL editor with that user's Auth UUID, without committing the edited file.
5. Sign in locally as that user.
6. Run `/internal/readiness` while signed in and confirm no red checks.
7. Run the canonical flow in browser:
   `signup/login -> onboarding/profile -> discover -> /matches?match=id -> /messages?match=id`.
8. Record the result in a new evidence file without editing old blocked evidence.

## Required Before Soft Launch Or Pilot

1. Complete the real signed-in RC and resolve any blockers found.
2. Run `npm.cmd run lint`, `npx.cmd tsc --noEmit --incremental false`, `npm.cmd test`, and `npm.cmd run build`.
3. Verify deployed environment variables, Supabase RLS, storage buckets, and auth email settings.
4. Decide what to do with `/internal/readiness` in pilot deployment.
5. Verify first-user and returning-user flows on desktop and mobile.
6. Verify media permissions and upload limits on target browsers.
7. Verify message send, unread/read state, and follow-up copy in seeded and empty states.
8. Prepare a short pilot test script and bug triage workflow.

## Product Features Vs Setup Issues

**Mostly setup/data/RC issues:**

- Test user creation and credential handling.
- Non-production Supabase confirmation.
- SQL setup and seed execution.
- Signed-in readiness proof.
- Signed-in Discover candidate-card and handoff RC.
- Media upload proof with real storage buckets.
- Build/deployment verification.

**Product/code issues or likely future fixes:**

- Align `/` account-aware CTA with Supabase auth instead of legacy localStorage.
- Avoid protected-content flash in `RequireAccount`.
- Decide whether `/internal/readiness` should be guarded or excluded in pilot deployments.
- Decide whether `messages_demo` remains acceptable for pilot naming/data shape.
- Address existing `<img>` warnings if performance/image optimization becomes launch-critical.
- Improve any mobile/layout issues found during real signed-in RC.

## Recommended Build Sequence

### Phase 1: Local Environment, Auth, Test User, Readiness, Seed Data

Goal: Make the current app testable with a real signed-in internal user.

- Confirm non-production Supabase target.
- Run/verify internal setup SQL.
- Create or identify the internal test user.
- Seed profile, matches, and messages for that user.
- Run signed-in `/internal/readiness`.
- Document exact evidence.

### Phase 2: Core User Flow

Goal: Prove the canonical MVP journey end to end.

- Fresh signup/login.
- Onboarding/profile completion.
- Discover candidate-card view.
- Like/unlike existing behavior.
- Handoff to `/matches?match=id`.
- Handoff to `/messages?match=id`.
- Send and read a message.

### Phase 3: MVP Polish

Goal: Fix only issues found during real RC.

- Copy and empty-state polish.
- Mobile layout fixes for actual crowded surfaces.
- Error handling for auth/profile/media/message operations.
- Small route/state consistency fixes.

### Phase 4: Pilot Readiness

Goal: Prepare a controlled pilot without broad redesign.

- Production/staging environment review.
- Build/deployment checks.
- Internal route safety decision.
- Manual RC evidence for pilot build.
- Basic analytics/logging review only if already present or easy to add safely.

## Recommended Next Modules

| Module | Goal | Likely files | Risk | Verification | Type |
| --- | --- | --- | --- | --- | --- |
| Module 11: Non-production Supabase readiness confirmation | Confirm the active environment, setup SQL, test user, and `/internal/readiness` with no secrets committed. | `V12_LOCAL_DISCOVER_RC_DATA_SETUP.md`, `supabase-internal-setup.sql`, `supabase-internal-user-seed-template.sql`, new evidence file | Low | `git status --short`, readiness screenshot-free notes, no env/secrets changed | Data/setup + RC |
| Module 12: Signed-in Discover RC rerun | Complete the previously blocked signed-in Discover checks with candidate cards. | New evidence file, `DISCOVER_REGRESSION_CHECKLIST.md` | Low | Browser signed-in `/discover`, mobile viewport, like/unlike, route handoff | RC verification |
| Module 13: Fresh user core flow RC | Test signup/login through onboarding/profile and into Discover. | New evidence file, maybe no code | Low | Fresh account run, email confirmation behavior, profile save, Discover readiness | RC verification |
| Module 14: Matches and Messages RC | Verify saved match detail, conversation handoff, send/read behavior. | New evidence file, `app/matches/page.tsx`, `app/messages/page.tsx` only if blocker found | Medium | `/matches?match=id`, `/messages?match=id`, send message, read-state refresh | RC first; code only if needed |
| Module 15: Profile media RC | Verify image, voice, and video upload/remove behavior against storage. | New evidence file, `app/profile/page.tsx`, `app/voice/page.tsx`, profile media helpers only if blocker found | Medium | Upload/remove image, record/save/remove voice, upload/remove video, storage URL readback | RC first; code only if needed |
| Module 16: MVP polish fixes | Fix only issues proven by Modules 12-15. | Targeted app files from evidence | Medium | Lint, TypeScript, tests, focused browser checks | Code |
| Module 17: Pilot readiness pass | Build and deployment readiness check. | Docs/evidence, deployment config if present | Medium | `npm.cmd run build`, deployed route smoke, Supabase/RLS/storage review | RC/setup |

## What Should Not Be Touched Yet

- Do not redesign the product IA, visual system, or canonical flow.
- Do not change matching logic until real signed-in data proves a product need.
- Do not migrate schema or rename tables before the signed-in MVP flow is verified.
- Do not add analytics/logging unless pilot readiness specifically requires it and the privacy approach is clear.
- Do not add heavy automation before the manual RC blockers are removed.
- Do not edit `.env`, `.env.local`, generated logs, `.next`, screenshots, or scratch SQL with real Auth UUIDs.

## Suggested MVP Definition Of Done

TrueKind MVP is done when:

- A new user can register or log in through the intended Supabase flow.
- The user can complete enough profile data to become Discover-ready.
- `/discover` shows signed-in candidate cards with readable mobile layout and `Varför den här?`.
- The user can like a candidate and see the existing liked/undo state.
- `/matches?match=id` opens the selected match detail from Discover.
- `/messages?match=id` opens the selected conversation from match detail or Discover.
- The user can send a message and see it persist after reload.
- Signed-out, profile-incomplete, no-candidate, no-match, and no-conversation states are understandable.
- Profile image, voice, and video either work reliably or are clearly marked as optional/non-blocking for the pilot.
- `npm.cmd run lint`, `npx.cmd tsc --noEmit --incremental false`, `npm.cmd test`, and `npm.cmd run build` pass.
- A final RC evidence file records browser checks on desktop and mobile with no fake passes.

## Recommended Immediate Next Step

Start with **Module 11: Non-production Supabase readiness confirmation**.

Reason: the app already has enough product surface to test, but the current blocker is not another feature. The fastest path to MVP completion is to establish one safe signed-in test environment and prove readiness before changing code.
