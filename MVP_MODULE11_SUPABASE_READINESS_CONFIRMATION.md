# MVP Module 11: Supabase Readiness Confirmation

## Status

**Result:** FAIL  
**Primary blocker:** `/internal/readiness` returned HTTP 404 during local RC smoke and direct HTTP checks.  
**Module:** Module 11: Non-production Supabase readiness confirmation  
**Date/time:** 2026-07-19 16:13:30 +02:00  
**Environment:** Local Windows development environment  
**Branch:** `main`  
**Baseline:** `ebe1626 Add MVP completion audit`

This was a setup/readiness evidence pass only. No source code, backend schema, auth behavior, matching logic, routing logic, candidate loading, like/pass behavior, UI, tests, environment files, secrets, screenshots, or logs were changed.

## References inspected

- `MVP_COMPLETION_AUDIT.md`
- `V12_LOCAL_DISCOVER_RC_DATA_SETUP.md`
- `V12_SIGNED_IN_RC_SETUP.md`
- `INTERNAL_TEST_READINESS.md`
- `supabase-internal-setup.sql`
- `supabase-internal-user-seed-template.sql`
- `app/internal/readiness/page.tsx`
- `middleware.ts`
- `next.config.ts`

## Repo and environment checks

| Check | Result | Notes |
| --- | --- | --- |
| Current branch | PASS | `main` |
| Latest baseline | PASS | History includes `ebe1626 Add MVP completion audit`. |
| Initial worktree | PASS | `git status --short` was clean. |
| `.env.local` presence | PASS | File exists locally. Values were not printed, copied, or recorded. |
| Public Supabase env key names | PASS | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are present. |
| Supabase anon key name | NOT PRESENT | `NEXT_PUBLIC_SUPABASE_ANON_KEY` is not present, but publishable key is present. |
| Non-production project identity | BLOCKED | Repo-safe checks cannot prove whether the configured Supabase project is non-production without external project context. |
| Internal test user | BLOCKED | No approved test credentials, active signed-in browser session, or Auth user id was available in this pass. |
| Setup SQL execution in Supabase | BLOCKED | Requires Supabase dashboard/SQL editor access to the intended non-production project. |
| User seed SQL execution | BLOCKED | Requires an existing Auth user id and Supabase dashboard/SQL editor access. |

No credential values, passwords, tokens, cookies, service-role keys, Supabase URLs, or Supabase key values were recorded.

## SQL readiness inspection

`supabase-internal-setup.sql` contains the expected internal setup for:

- `profiles`
- `discover_candidates`
- `matches`
- `messages_demo`
- `profile-images`
- `voice-profiles`
- `video-presentations`
- authenticated RLS policies for profile, match, message, media, and Discover candidate reads
- global Discover candidates for `anna`, `sara`, and `elin`

`supabase-internal-user-seed-template.sql` contains the expected placeholder-based user seed. The committed template still uses the safe placeholder UUID, so running it unchanged inserts no user rows.

## Local app checks

The app was started locally with Next dev in the background. Logs were redirected to `%TEMP%`:

- `%TEMP%\truekind-module11-dev.out.log`
- `%TEMP%\truekind-module11-dev.err.log`

The temporary dev server processes were stopped after route checks. No logs were written to the repo.

| Check | Result | Notes |
| --- | --- | --- |
| `/discover` direct HTTP | PASS | Returned HTTP 200. |
| `/internal/readiness` direct HTTP | FAIL | Returned HTTP 404. |
| `/internal/readiness/` direct HTTP | FAIL | Returned HTTP 308 redirect, then the canonical route still fails. |
| `/internal` direct HTTP | FAIL | Returned HTTP 404, expected unless a parent route is added. |
| Next route manifest | PASS WITH CONFLICTING RUNTIME RESULT | `.next` app paths include `/internal/readiness/page`, but runtime HTTP still returned 404. |
| `middleware.ts` inspection | PASS | No redirect or explicit exclusion for `/internal/readiness` was found. |
| `next.config.ts` inspection | PASS | No route rewrite or exclusion was found. |

## RC smoke result

Command:

```powershell
npm.cmd run smoke:rc
```

Result:

```text
FAIL
13/14 checks passed
Failure: route.internal-readiness
Detail: /internal/readiness returned HTTP 404
```

The smoke check passed:

- Supabase env shape
- RC docs
- Supabase setup SQL structure
- `/`
- `/login`
- `/register`
- `/onboarding`
- `/discover`
- `/match`
- `/matches`
- `/messages`
- `/profile`
- `/voice`

The smoke check failed:

- `/internal/readiness`

## Unit test result

`npm.cmd test` was run twice:

| Attempt | Result | Notes |
| --- | --- | --- |
| First attempt | FAIL WITH ENVIRONMENT PRESSURE | Node exited with an out-of-memory error while the local dev server was still running. |
| Second attempt | PASS | After stopping the temporary dev server, 77/77 tests passed. |

The final test result for this module is PASS: 77 tests, 17 suites, 0 failures.

## Readiness confirmation result

Module 11 could not confirm a signed-in non-production Supabase readiness pass.

Confirmed:

- The repo contains the expected setup/readiness docs.
- The repo contains the expected internal Supabase setup SQL.
- The repo contains the expected placeholder-based user seed SQL.
- Local public Supabase env key names are present.
- Most product routes return HTTP 200 through RC smoke.
- Unit tests pass after stopping the temporary dev server.

Not confirmed:

- The active Supabase project is non-production.
- `supabase-internal-setup.sql` has been run against the active project.
- An internal test user exists and is approved for RC.
- `supabase-internal-user-seed-template.sql` has been run for that test user.
- `/internal/readiness` can be opened locally.
- `/internal/readiness` can report signed-in Supabase readiness.
- Signed-in Discover can proceed to Module 12.

## Final blocker

```text
FAIL: /internal/readiness returns HTTP 404
```

This should be investigated before another signed-in Discover RC run. The readiness page exists on disk and appears in the generated Next app paths, but HTTP requests to the route still return 404 in local dev and in `npm.cmd run smoke:rc`.

Secondary blockers remain:

- `BLOCKED: NEED NON-PRODUCTION SUPABASE CONFIRMATION`
- `BLOCKED: NEED TEST USER`
- `BLOCKED: NEED SETUP SQL EXECUTION CONFIRMATION`
- `BLOCKED: NEED USER SEED EXECUTION CONFIRMATION`

## Recommendation after Module 11

Next module should be a narrow readiness-route repair or investigation slice before continuing signed-in RC.

Recommended next module:

```text
Module 12: Restore internal readiness route availability
```

Goal:

- make `/internal/readiness` return HTTP 200 locally again
- keep the page internal/read-only
- avoid backend/schema/product-flow changes
- rerun `npm.cmd run smoke:rc`
- then repeat Module 11 readiness confirmation with a real non-production Supabase project and internal test user
