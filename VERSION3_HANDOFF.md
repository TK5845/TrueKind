# TrueKind – Version 3 Handoff

## Nuvarande status
Version 2 är klar och fryst som stabil bas.

## Vad som fungerar nu
- register / login
- onboarding
- profil
- profilbild
- röstprofil
- videopresentation
- discover
- like / ångra gilla
- matches
- messages
- unread/read förbättrat
- backend/fallback tydligare
- video sparas nu via Supabase bucket + profile link

## Viktigt att veta
Video fungerade inte förrän:
1. rätt Supabase bucket skapades
2. rätt SQL/policies kördes
3. frontend slutade krångla till video som separat draftlogik

Bucket som används:
- `video-presentations`

## Rekommenderat fokus för Version 3
1. produktionshärdning av media
2. full backend-rensning av demo/fallback
3. tydligare matchlivscykel
4. bättre unread/read och badge-synk
5. bättre intern testmiljö

## Arbetssätt
- utgå alltid från nuvarande frysta V2
- gör små låg-risk ändringar
- testa modul för modul
- undvik bred redesign
- bevara svensk UI-ton och nuvarande designlinje

## Steg för steg – start av Version 3
1. Öppna projektmappen `TrueKind/web`.
2. Kontrollera att senaste Version 2-kod är committad och pushad.
3. Öppna Codex i projektet `TrueKind`.
4. Skapa en ny chatt för Version 3.
5. Döp chatten till exempel till `TrueKind Version 3`.
6. Klistra in startprompten nedan.
7. Låt Codex först sammanfatta baslinjen innan någon kod ändras.
8. Arbeta modulvis och verifiera efter varje modul.

## Kort startprompt till Codex
We are continuing TrueKind from a finished and frozen Version 2 baseline.

Use the current Version 2 as the stable base.
Do not redesign broadly.
Keep changes low-risk and modular.

Version 3 priorities:
1. production hardening for media
2. backend cleanup of remaining demo/fallback behavior
3. clearer match lifecycle
4. better unread/read and badge consistency
5. stronger internal test setup

Before changing code:
- summarize the current baseline
- identify the safest next module
- keep current Swedish UI tone and design
- avoid breaking working Version 2 flows