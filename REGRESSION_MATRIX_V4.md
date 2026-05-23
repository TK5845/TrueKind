# TrueKind Version 4 - Manuell regressionsmatris

## Syfte

Den här matrisen är en lätt manuell kontroll för interna releasekandidater. Den kompletterar `DEMO_CHECKLIST.md` genom att ge varje kärnflöde ett tydligt statusfält och en plats för buggreferenser.

## Körning

- RC/build:
- Datum:
- Testare:
- Testkonto:
- Miljö:
- Supabase-projekt:
- Seed-data:

## Statusvärden

- `OK`: fungerar enligt förväntan.
- `Fel`: avvikelse finns och ska loggas i `INTERNAL_BUG_LOG.md`.
- `Blockerad`: kunde inte testas på grund av setup, konto eller miljö.
- `Ej körd`: inte testad i detta pass.

## Setup och readiness

| ID | Kontroll | Förväntat | Status | Bug ID | Anteckning |
| --- | --- | --- | --- | --- | --- |
| V4-SETUP-01 | `npm.cmd test` | Testsuiten passerar | Ej körd |  |  |
| V4-SETUP-02 | `npm.cmd run lint` | Endast kända varningar, inga nya fel | Ej körd |  |  |
| V4-SETUP-03 | `.env.local` | Supabase URL och anon/publishable key finns | Ej körd |  |  |
| V4-SETUP-04 | Supabase setup | `supabase-internal-setup.sql` har körts i rätt projekt | Ej körd |  |  |
| V4-SETUP-05 | Intern seed | Minst ett testkonto har profil, matchningar och meddelanden vid behov | Ej körd |  |  |
| V4-SETUP-06 | `npm.cmd run smoke:rc` | Setup, RC-dokument, SQL och kritiska routes passerar mot aktuell lokal URL | Ej körd |  |  |
| V4-SETUP-07 | `/internal/readiness` | Inga röda backendfel för aktuellt testkonto | Ej körd |  |  |
| V4-SETUP-08 | Lokal reset | `?demoTools=1` och `Nollställ testdata` rensar bara lokal appdata | Ej körd |  |  |

## Konto och onboarding

| ID | Kontroll | Förväntat | Status | Bug ID | Anteckning |
| --- | --- | --- | --- | --- | --- |
| V4-AUTH-01 | Login | Internt testkonto kan logga in | Ej körd |  |  |
| V4-AUTH-02 | Logout | `Logga ut` avslutar session och leder till login | Ej körd |  |  |
| V4-AUTH-03 | Skyddade sidor | Session saknas ger login i stället för krasch | Ej körd |  |  |
| V4-ONBOARD-01 | Onboardingstatus | Konto och profilstatus visas korrekt | Ej körd |  |  |
| V4-ONBOARD-02 | Onboardinglänkar | Steg leder till profil, röstprofil, Discover, matchlista och meddelanden | Ej körd |  |  |

## Profil och media

| ID | Kontroll | Förväntat | Status | Bug ID | Anteckning |
| --- | --- | --- | --- | --- | --- |
| V4-PROFILE-01 | Profilvisning | Profilinfo visas utan krasch | Ej körd |  |  |
| V4-PROFILE-02 | Profilsparning | Ändringar sparas och syns efter refresh | Ej körd |  |  |
| V4-MEDIA-01 | Profilbild | Bild kan läggas till eller tas bort | Ej körd |  |  |
| V4-MEDIA-02 | Röstprofil | Spela in, spela upp och ta bort fungerar | Ej körd |  |  |
| V4-MEDIA-03 | Videopresentation | Video kan läggas till eller tas bort när bucket/policies är klara | Ej körd |  |  |

## Discover och match

| ID | Kontroll | Förväntat | Status | Bug ID | Anteckning |
| --- | --- | --- | --- | --- | --- |
| V4-DISCOVER-01 | Discover laddar | Egen profil och kandidater/tomläge visas utan krasch | Ej körd |  |  |
| V4-DISCOVER-02 | Backend fallback | Tom eller saknad backenddata hanteras mjukt | Ej körd |  |  |
| V4-DISCOVER-03 | Gilla | Gilla sparar matchning | Ej körd |  |  |
| V4-DISCOVER-04 | Ångra gilla | Ångra tar bort matchningen från synlig matchlista | Ej körd |  |  |
| V4-MATCH-01 | Matchsida | Rätt match visas | Ej körd |  |  |
| V4-MATCH-02 | Match till samtal | Länk till meddelanden fungerar | Ej körd |  |  |
| V4-MATCHLIST-01 | Matchlista | Sparade matchningar visas | Ej körd |  |  |
| V4-MATCHLIST-02 | Senaste meddelande | Senaste meddelande och oläst-markering visas | Ej körd |  |  |

## Messages

| ID | Kontroll | Förväntat | Status | Bug ID | Anteckning |
| --- | --- | --- | --- | --- | --- |
| V4-MSG-01 | Samtalsrubrik | Rätt person visas i rubriken | Ej körd |  |  |
| V4-MSG-02 | Skicka meddelande | Meddelande sparas och visas direkt | Ej körd |  |  |
| V4-MSG-03 | Separata chattar | Chattar hålls separata per match | Ej körd |  |  |
| V4-MSG-04 | Lässtatus | Olästa meddelanden markeras som lästa när samtalet öppnas | Ej körd |  |  |
| V4-MSG-05 | Refresh/login | Meddelanden finns kvar efter refresh och ny inloggning | Ej körd |  |  |

## Releasebeslut

En intern releasekandidat är normalt stark nog när:

- [ ] Alla `V4-SETUP` är `OK` eller har accepterad anteckning.
- [ ] Konto, profil, Discover, matchlista och Messages har inga öppna `P1`.
- [ ] Öppna `P2` är dokumenterade i bug-loggen och release notes.
- [ ] Smoke, reset och backend readiness är testade i samma miljö som intern testning.
- [ ] `INTERNAL_RELEASE_NOTES_TEMPLATE.md` är ifylld för kandidaten.
