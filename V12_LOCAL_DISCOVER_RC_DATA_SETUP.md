# V12 Local Discover RC Data Setup

## Purpose

Use this guide to prepare a controlled, non-production signed-in state for the Version 12 Discover RC run.

The goal is to unblock verification of:

- candidate cards on `/discover`
- `Varför den här?`
- pills, interests, direction and activity labels
- the existing like/undo CTA row
- handoff to `/matches?match=id`
- continued handoff to `/messages?match=id`

Canonical flow:

```text
discover -> /matches?match=id -> /messages?match=id
```

## Final setup status

**READY FOR SIGNED-IN RC DATA RUN**

The repo already has the safest repeatable path for this setup:

- `supabase-internal-setup.sql` for schema, RLS, buckets and global Discover candidates
- `supabase-internal-user-seed-template.sql` for one existing internal Auth user
- `/internal/readiness` for session, table and seed checks
- `?demoTools=1` local reset for stale browser-local test/cache data

No local helper script is added in Module 9. Creating Auth users and copying `auth.users.id` still belongs in the Supabase dashboard or the app register/login flow so no passwords, service-role keys or auth bypasses enter the repo.

## Non-production warning

Run these steps only against an internal, local, staging or demo Supabase project.

Do not use production data. Do not commit:

- `.env.local`
- passwords
- Supabase service-role keys
- exported sessions or cookies
- edited seed files containing private user ids
- screenshots or logs that reveal account details
- `.next`, logs or temp files

## Required environment variables

The app needs browser-safe public Supabase config in `.env.local` or the shell environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

or:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Use names only in repo docs and evidence. Never record the values.

## Data requirements for `/discover`

To reach the signed-in candidate-card state, all of these must be true:

1. The tester is signed in through Supabase Auth.
2. The tester has enough profile data for Discover readiness:
   - `name`
   - `city`
   - at least one of `bio`, `looking_for` or `interests`
3. `discover_candidates` has active rows visible to the user:
   - user-scoped rows where `user_id = auth.uid()`, or
   - global rows where `user_id is null`
4. RLS allows the authenticated user to read the required tables.
5. Browser-local profile cache is not stale or incomplete.

`supabase-internal-setup.sql` seeds global Discover candidates for `anna`, `sara` and `elin`. Those global candidates are enough to show signed-in candidate cards once the user is authenticated and profile-ready.

`supabase-internal-user-seed-template.sql` is optional for candidate cards, but recommended for this RC because it also seeds profile, matches and messages for richer `/matches?match=id` and `/messages?match=id` handoff checks.

## Step 1: Prepare Supabase setup

1. Confirm the target Supabase project is not production.
2. Open the Supabase SQL editor for that project.
3. Run `supabase-internal-setup.sql`.
4. Confirm the setup includes:
   - `profiles`
   - `discover_candidates`
   - `matches`
   - `messages_demo`
   - `profile-images`
   - `voice-profiles`
   - `video-presentations`
5. Confirm global Discover candidates exist:
   - `anna`
   - `sara`
   - `elin`

Expected result: signed-in users can read active global Discover candidates.

## Step 2: Create or identify one internal test user

Use one of these safe paths:

- create a user through `/register` in the local app
- create a user through Supabase Auth
- reuse an approved internal test user

Do not write the password in repo files. Keep credentials in the team's approved secret-sharing channel.

If email confirmation is enabled, confirm the email through the project's normal internal process.

## Step 3: Seed the test user

Use this when you want a stable, repeatable RC user profile plus match/message data.

1. Copy the user's `auth.users.id` from Supabase.
2. In a scratch/local copy of `supabase-internal-user-seed-template.sql`, replace:

```text
00000000-0000-0000-0000-000000000000
```

with:

```text
<AUTH_USER_UUID>
```

3. Run the scratch SQL in the Supabase SQL editor.
4. Do not commit the edited scratch copy.

Expected result:

- `profiles` has a Discover-ready row for the test user.
- `matches` has active rows for `anna` and `sara`.
- `messages_demo` has conversation rows for `anna` and `sara`.
- global `discover_candidates` from setup still provide candidate cards for `/discover`.

## Step 4: Clear stale local app cache

Stale local profile cache can keep `/discover` in a profile-incomplete state even when the backend seed is ready.

After signing in, open:

```text
http://localhost:3000/?demoTools=1
```

Use `Nollställ testdata`.

This reset clears browser-local app test/cache data only. It does not remove:

- Supabase Auth users
- Supabase sessions
- backend rows in `profiles`
- backend rows in `discover_candidates`
- backend rows in `matches`
- backend rows in `messages_demo`

Then reload `/discover` while still signed in so the app can hydrate the backend profile.

## Step 5: Confirm `/internal/readiness`

Start the app locally:

```powershell
npm run dev
```

In a second terminal, run:

```powershell
npm.cmd run smoke:rc
```

Then in the browser:

1. Sign in with the internal test user.
2. Open `/internal/readiness`.
3. Run the readiness check.

Expected status for signed-in Discover RC:

| Check | Expected |
| --- | --- |
| Supabase configuration | Pass |
| Signed-in tester | Pass |
| `profiles` table | Pass |
| `discover_candidates` table | Pass |
| Global Discover seed | Pass for `anna`, `sara`, `elin` |
| Current user seed | Pass if the optional user seed was run; warning is acceptable only if candidate-card-only RC is being run |
| Red checks | None |

If `/internal/readiness` shows red backend errors, stop and fix setup before running signed-in Discover RC.

## Step 6: Confirm `/discover`

Stay signed in as the internal test user.

Open:

```text
http://localhost:3000/discover
```

Expected signed-in candidate-card state:

- the page does not show the signed-out login/register state
- the page does not stay on profile-incomplete copy
- at least one candidate card renders
- `Varför den här?` appears on each card
- relevance and chemistry pills are visible
- direction, activity and interests are visible
- the existing CTA row shows `Gilla`

If the page still says the profile needs more information:

1. Confirm the profile has `name`, `city`, and `bio` or `looking_for` or interests.
2. Use `?demoTools=1` and `Nollställ testdata`.
3. Reload `/discover`.
4. Re-check `/internal/readiness`.

If candidate cards still do not render:

1. Confirm `discover_candidates` has active global rows where `user_id is null`.
2. Confirm RLS policy `discover_candidates_select_internal` exists.
3. Confirm the user is still signed in.
4. Re-run `supabase-internal-setup.sql` in the intended non-production project.

## Step 7: Run the signed-in RC checks

Use `DISCOVER_REGRESSION_CHECKLIST.md` as the source checklist.

Recommended viewport:

```text
390 x 844
```

Verify:

- `/discover` loads while signed in
- candidate cards render
- `Varför den här?` is readable
- relevance and chemistry pills wrap cleanly
- direction, activity and interests remain readable
- bio text is scannable
- the unliked CTA row is usable
- `Gilla` saves the candidate
- liked state shows `Ångra gilla`, `Visa matchning` and `Öppna samtal`
- `Ångra gilla` removes the visible liked state according to existing behavior
- `Visa matchning` opens `/matches?match=id`
- `Öppna samtal` opens `/messages?match=id`

Note: this guide does not add a separate pass button. Verify the existing V12 behavior: unliked `Gilla`, liked `Ångra gilla`, and route handoff CTAs.

## Step 8: Record the RC run

After setup succeeds, rerun the signed-in RC evidence step and create a new run note rather than editing old blocked evidence.

Recommended evidence fields:

- date/time
- environment
- test user label, not password
- Supabase project label, not keys
- readiness result
- viewport
- checklist results
- route handoff results
- final status: `PASS`, `PASS WITH LIMITATIONS`, `BLOCKED` or `FAIL`

## Cleanup

For local browser cleanup:

1. Open any app route with `?demoTools=1`.
2. Use `Nollställ testdata`.
3. Sign out through the app.

For backend cleanup, use Supabase dashboard or explicit SQL in the internal project only. Limit cleanup to the internal test user.

Optional backend cleanup pattern:

```sql
-- Replace only in a local scratch SQL editor, never in a committed file.
delete from public.messages_demo where user_id = '<AUTH_USER_UUID>';
delete from public.matches where user_id = '<AUTH_USER_UUID>';
delete from public.profiles where id = '<AUTH_USER_UUID>';
```

Delete the Auth user from Supabase Auth only if the team wants a fully fresh test account.

## Blocker labels

Use these labels in follow-up evidence if setup cannot be completed:

- `BLOCKED: NEED SUPABASE ACCESS`
- `BLOCKED: NEED TEST USER`
- `BLOCKED: NEED CANDIDATE SEED DATA`
- `BLOCKED: NEED SCHEMA/DATA REQUIREMENTS CLARIFIED`

## Exact next run

1. Confirm `.env.local` points at the intended non-production Supabase project.
2. Run `supabase-internal-setup.sql`.
3. Create or identify one internal test user.
4. Run `supabase-internal-user-seed-template.sql` with that user's Auth UUID in a scratch SQL editor.
5. Start the app with `npm run dev`.
6. Sign in locally with the internal test user.
7. Use `?demoTools=1` and `Nollställ testdata`.
8. Open `/internal/readiness` and confirm no red checks.
9. Open `/discover` at mobile viewport `390 x 844`.
10. Run the signed-in Discover checklist.
11. Record the result in a new RC run evidence file.
