# TrueKind

TrueKind är en MVP-prototyp för en mjukare och mer mänsklig dejtingsupplevelse.

## Funktioner i intern test

- Premium startsida
- Login / register via Supabase
- Onboarding med rikare profilfält
- Discover med backend-profiler och kontrollerad fallback
- Match-sida
- Matchlista
- Separata chattar per match
- Profilsida med redigering
- Profilbild, röstprofil och videopresentation
- Lokal cache för snabb intern testning

## Teknik

- Next.js
- React
- TypeScript
- Supabase för auth, profiler, media, matchningar och meddelanden
- localStorage för lokal cache och testdata mellan interna testpass

## Starta projektet

Öppna terminal i projektmappen och kör:

```bash
npm install
npm run dev
```

På Windows kan testkommandot behöva köras via `npm.cmd`:

```bash
npm.cmd test
```

För intern releasekandidat-smoke, starta appen lokalt och kör:

```bash
npm.cmd run smoke:rc
```

## Intern testberedskap

Se `INTERNAL_TEST_READINESS.md` för testkonton, miljökrav, reset-rutin och releaseförberedelser.

För interna releasekandidater finns även:

- `RC_START_CHECKLIST.md` för namngivning och start av nya RC-pass
- `REGRESSION_MATRIX_V4.md` för manuell regression av kärnflöden
- `INTERNAL_BUG_LOG.md` för buggar, prioritet, status och retest
- `INTERNAL_RELEASE_NOTES_TEMPLATE.md` för korta interna release notes
- `RC_HANDOFF_TEMPLATE.md` för slutlig handoff, readiness-evidens och RC-beslut
- `rc-evidence/` för färdiga RC-pass och beslut

## Supabase intern setup

Kör `supabase-internal-setup.sql` i Supabase SQL editor för att skapa/uppdatera tabeller, RLS policies, storage buckets och globala Discover-kandidater.

För ett färdigt internt testkonto:

1. Skapa eller logga in med testkontot i appen.
2. Kopiera användarens `auth.users.id` från Supabase.
3. Ersätt placeholder-UUID i `supabase-internal-user-seed-template.sql`.
4. Kör seed-filen i Supabase SQL editor.

När appen kör lokalt kan intern backendstatus kontrolleras på `/internal/readiness`.
