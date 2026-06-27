# V12 Signed-In Discover RC Setup

## Purpose

Use this guide to prepare a controlled signed-in/demo session for the Version 12 Discover RC pass.

The goal is to unblock manual verification of candidate cards, like/undo behavior, and the canonical handoff:

```text
discover -> /matches?match=id -> /messages?match=id
```

This guide does not add credentials, bypass auth, or change product behavior. It composes the existing local Supabase setup, internal seed template, readiness page, RC smoke check, and Discover checklist.

## Setup status

**READY FOR SIGNED-IN RC** when all of the following are true:

- `.env.local` or the shell environment points at the intended non-production Supabase project.
- `supabase-internal-setup.sql` has been run in that project.
- An internal test user exists through the app register flow or Supabase Auth.
- The test user has a profile with enough Discover-ready information.
- `/internal/readiness` shows no red backend errors for that signed-in user.

If any of those are unavailable, keep the signed-in RC as blocked and use the blocker labels below:

- **BLOCKED: NEED AUTH ENVIRONMENT** when Supabase URL/public anon or publishable key is missing.
- **BLOCKED: NEED DEMO USER SETUP** when no internal test user can be created or accessed.
- **BLOCKED: NEED LOCAL SEED DATA** when setup SQL or candidate seed data has not been applied.

## Prerequisites

Work from the `web` directory.

Required local files:

- `README.md`
- `INTERNAL_TEST_READINESS.md`
- `supabase-internal-setup.sql`
- `supabase-internal-user-seed-template.sql`
- `DISCOVER_REGRESSION_CHECKLIST.md`
- `V12_RC_HANDOFF.md`
- `V12_DISCOVER_RC_EVIDENCE.md`
- `V12_SIGNED_IN_DISCOVER_RC_EVIDENCE.md`

Local environment assumptions:

- `.env.local` exists locally or equivalent shell variables are set.
- Only public browser-safe Supabase config is used by the app:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- No service-role key is needed for the app, RC smoke, or browser pass.
- The Supabase project is an internal/local/demo project, not production.

Do not commit `.env.local`, real credentials, passwords, service-role keys, exported sessions, screenshots that reveal secrets, or production account details.

## Prepare the backend

1. Confirm that the target Supabase project is non-production.
2. Open the Supabase SQL editor for that project.
3. Run `supabase-internal-setup.sql`.
4. Confirm the setup created or updated:
   - `profiles`
   - `discover_candidates`
   - `matches`
   - `messages_demo`
   - media buckets for profile images, voice profiles, and video presentations
5. Confirm global Discover candidates exist for `anna`, `sara`, and `elin`.

The setup file is documented as safe to re-run for the internal test project. It also seeds global Discover candidates where `user_id is null`, which signed-in testers can read through the existing RLS policy.

## Create or identify the test user

Use one of these safe paths:

- Create an internal test user through `/register` in the local app.
- Create an internal test user through Supabase Auth.
- Reuse an existing internal test user if it is already approved for RC testing.

Do not document or commit the user's password. If credentials need to be shared, keep them outside the repo in the team's approved secret-sharing channel.

After the user exists:

1. Sign in locally through `/login`.
2. Complete enough profile data for Discover readiness:
   - name
   - city
   - bio, looking-for text, or interests
3. If email confirmation is enabled in the Supabase project, confirm the user's email according to that project's normal internal process.

## Optional user seed

Use `supabase-internal-user-seed-template.sql` only after the Auth user exists.

1. Copy the user's `auth.users.id` from Supabase.
2. Open `supabase-internal-user-seed-template.sql`.
3. Replace the placeholder UUID locally before running it in the Supabase SQL editor.
4. Run it against the intended non-production project.

The template is intentionally placeholder-based. Running it with the placeholder UUID inserts no rows.

The template seeds:

- a Discover-ready profile for the test user
- sample matches for `anna` and `sara`
- sample conversation rows in `messages_demo`

This is optional for Discover candidate cards because the global candidates from `supabase-internal-setup.sql` are enough for `/discover`. It is useful when the RC pass also wants pre-existing match and message data.

## Verify candidate availability

Before starting the signed-in Discover checklist:

1. Start the app locally:

```powershell
npm run dev
```

2. In a second terminal, run the local test suite if this is a fresh RC candidate:

```powershell
npm.cmd test
```

3. If the app is running on the default port, run the RC smoke check:

```powershell
npm.cmd run smoke:rc
```

4. Sign in as the internal test user.
5. Open `/internal/readiness`.
6. Run the readiness check.
7. Treat red backend errors as blockers before spending time on the manual Discover RC.

Expected readiness for this module:

- Supabase config is present.
- The current signed-in user is detected.
- `discover_candidates` can be read.
- Candidate seed appears available, either user-scoped or global.

## Reach `/discover`

1. Stay signed in as the internal test user.
2. Open `/discover`.
3. Use a mobile viewport around `390 x 844`.
4. Confirm the signed-in Discover state appears.
5. If the page says the profile needs more information, update `/profile` until Discover is ready.
6. If no candidates appear, re-check `supabase-internal-setup.sql` in the intended Supabase project and rerun `/internal/readiness`.

## Run the signed-in RC checklist

Use `DISCOVER_REGRESSION_CHECKLIST.md` as the checklist source.

For Version 12 signed-in RC, focus on:

- `V12-DISC-MOB-05`: candidate cards render with real candidate data.
- `V12-DISC-CARD-01`: `Varfor den har?` is visible and readable.
- `V12-DISC-CARD-02`: relevance and chemistry pills wrap cleanly.
- `V12-DISC-CARD-03`: direction, activity, and interests stay readable.
- `V12-DISC-CARD-04`: bio text remains scannable.
- `V12-DISC-CARD-05`: unliked CTA row is usable.
- `V12-DISC-CARD-06`: liked CTA row is usable.
- `V12-DISC-FLOW-01`: like saves the profile.
- `V12-DISC-FLOW-02`: undo removes the visible match state according to existing behavior.
- `V12-DISC-FLOW-03`: `Visa matchning` opens `/matches?match=id`.
- `V12-DISC-FLOW-04`: `Oppna samtal` opens `/messages?match=id`.

Record the actual test account label, Supabase project label, viewport, and outcome in a follow-up evidence note. Do not record passwords, tokens, session cookies, or private account details.

## Cleanup

For browser/local cleanup:

1. Open any app route with `?demoTools=1`.
2. Use `Nollstall testdata`.
3. Sign out through the app.

The local reset only clears browser-local app test/cache data. It does not delete Supabase Auth users or backend rows.

For backend cleanup, use Supabase dashboard or explicit SQL in the internal project only. Clean up only data that belongs to the internal test account. Do not run cleanup SQL against production.

## What not to commit

Do not commit:

- `.env.local`
- real email/password pairs
- Supabase service-role keys
- exported sessions or cookies
- production account details
- screenshots or logs that reveal secrets
- edited seed files containing real user ids if those ids should remain private
- `.next`, logs, temp files, or generated local artifacts

Do not add:

- hardcoded signed-in users
- auth bypasses
- production demo accounts
- insecure test backdoors
- changes to matching logic, candidate loading, like/undo behavior, or route architecture

## References

- `DISCOVER_REGRESSION_CHECKLIST.md`
- `V12_RC_HANDOFF.md`
- `V12_DISCOVER_RC_EVIDENCE.md`
- `V12_SIGNED_IN_DISCOVER_RC_EVIDENCE.md`
- `INTERNAL_TEST_READINESS.md`
- `supabase-internal-setup.sql`
- `supabase-internal-user-seed-template.sql`
