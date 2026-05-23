# TrueKind Version 4 - Internal Test Readiness

## Syfte

Version 4 gjorde intern testning lättare att upprepa utan att ändra stabila användarflöden. Module 1 samlade lokal testdata/reset. Module 2 samlar Supabase setup, seed-data och testpersonas. Module 3 lade till intern backend readiness. Module 4 samlar intern testobservability för releasekandidater. Module 5 lägger till en enkel RC-handoff för upprepade kandidater.

Version 5 startar med en liten RC-smoke som automatiserar de mest repetitiva setup- och route-kontrollerna. Module 2 placerar smoke-kontrollen i den praktiska RC-loopen: efter tekniska checks och lokal appstart, men före inloggad readiness och manuell regression.

## Snabb kontroll

Kör från `web`:

```bash
npm install
npm run dev
```

På Windows, kör tester med:

```bash
npm.cmd test
```

När appen kör lokalt kan RC-smoke köras med:

```bash
npm.cmd run smoke:rc
```

## Miljö

`.env.local` behöver innehålla:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` eller `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Om något saknas visar appen en svensk statusrad i login/register i stället för att krascha.

## Supabase setup

Kör först:

```sql
-- Supabase SQL editor
-- web/supabase-internal-setup.sql
```

Den filen skapar/uppdaterar:

- tabeller: `profiles`, `discover_candidates`, `matches`, `messages_demo`
- RLS policies för inloggade användares egna profiler, matchningar och meddelanden
- global läsning av Discover-kandidater för inloggade testare
- storage buckets: `profile-images`, `voice-profiles`, `video-presentations`
- public read för media och user-folder write för inloggade användare
- global seed-data för Discover: Anna, Sara och Elin

Den äldre filen `supabase-video-profile-fix.sql` är en smal historisk patch för videobucket/profilkolumn. För ny intern setup ska `supabase-internal-setup.sql` användas.

## Testkonton och personas

Rekommenderad enkel intern uppsättning:

- `Tester A`: huvudkonto för onboarding, profil, media, Discover, matchlista och messages.
- `Tester B`: separat konto för ren omtestning utan att störa Tester A.
- `Media Tester`: konto för profilbild, röstprofil och videopresentation.

Skapa konton via appens registerflöde eller Supabase Auth. Bekräfta e-post enligt projektets auth-inställningar.

För ett färdigseedat konto:

1. Skapa eller logga in med kontot i appen.
2. Kopiera användarens `auth.users.id` från Supabase.
3. Öppna `supabase-internal-user-seed-template.sql`.
4. Ersätt `00000000-0000-0000-0000-000000000000` med användarens id.
5. Kör filen i Supabase SQL editor.

Seed-template fyller profil, två matchningar och ett par meddelanden. Om placeholdern inte ersätts infogas inga rader.

## Backenddata som appen förväntar sig

`profiles` används för den inloggade användarens profil. Viktiga fält:

- `id`, `email`, `first_name`, `name`, `age`, `city`
- `looking_for`, `contact_intent`, `activity_interest`
- `interests`, `bio`, `prompt`
- `favorite_song`, `favorite_film`, `favorite_book`
- `image_url`, `voice_url`, `video_url`

`discover_candidates` används i Discover. Appen läser först användarspecifika rader med `user_id = auth.uid()`, sedan globala rader med `user_id is null`.

`matches` används när testaren gillar en profil. Appen skriver och läser per `user_id` och `match_id`.

`messages_demo` används för samtal. Appen läser per `user_id`, skriver nya `me`-meddelanden och markerar `them`-meddelanden som lästa.

## Fallback-kompatibilitet

Appen ska fortsätta fungera även när backenddata saknas:

- saknad Supabase config visar svensk status i authflödet
- tomma Discover-rader ger tomt/tåligt läge i stället för krasch
- äldre `messages_demo` utan `read_at`/`is_read` stöds via minimum columns
- lokal match-cache kan användas när backend är tillfälligt otillgänglig

Det är ändå bättre för intern release-test att använda riktig Supabase setup och seed-data.

## Lokal testdata

Knappen `Nollställ testdata` visas när URL:en innehåller `?demoTools=1`. Läget sparas lokalt tills `?demoTools=0` används.

Resetknappen tar bara bort app-local test/cache data på den aktuella enheten, till exempel:

- lokal profilcache
- gammal legacy-profilcache
- lokala chat/unread-nycklar
- lokalt cacheade gillade matchningar som `truekind_liked_matches:*`
- gammal lokal voice/demo-cache

Resetknappen tar inte bort:

- Supabase-konton
- backendrader i `profiles`, `matches`, `messages_demo` eller `discover_candidates`
- Supabase auth/session storage
- cookies

Använd `Logga ut` när sessionen ska avslutas. Använd Supabase dashboard eller SQL när backend-testdata behöver rensas.

## Intern setupordning

1. Kör `npm.cmd test`.
2. Kör `npm.cmd run lint` när kandidaten ska kunna lämnas över.
3. Kör `supabase-internal-setup.sql` i rätt Supabase-projekt.
4. Kontrollera `.env.local`.
5. Starta appen med `npm run dev`.
6. Kör `npm.cmd run smoke:rc` mot den lokala appen.
7. Skapa eller logga in med internt testkonto.
8. Kör vid behov `supabase-internal-user-seed-template.sql` med rätt `auth.users.id`.
9. Öppna `/internal/readiness` och kör kontrollen med aktuellt testkonto.
10. Öppna appen med `?demoTools=1` och nollställ lokal testdata inför ett rent pass.
11. Gå igenom `DEMO_CHECKLIST.md`.
12. För releasekandidat: fyll `REGRESSION_MATRIX_V4.md`, logga avvikelser i `INTERNAL_BUG_LOG.md`, sammanfatta i `INTERNAL_RELEASE_NOTES_TEMPLATE.md` och lämna över via `RC_HANDOFF_TEMPLATE.md`.

## Releaseförberedande check

Innan en intern release:

- [ ] Kör `npm.cmd test`
- [ ] Kör `npm.cmd run lint`
- [ ] Kör `npm.cmd run smoke:rc`
- [ ] Verifiera att rätt Supabase-projekt används
- [ ] Verifiera att `supabase-internal-setup.sql` har körts
- [ ] Logga in med internt testkonto
- [ ] Gå igenom `DEMO_CHECKLIST.md`
- [ ] Gå igenom `REGRESSION_MATRIX_V4.md` för aktuellt testpass
- [ ] Triagera öppna rader i `INTERNAL_BUG_LOG.md`
- [ ] Fyll intern release notes från `INTERNAL_RELEASE_NOTES_TEMPLATE.md`
- [ ] Fyll RC-handoff från `RC_HANDOFF_TEMPLATE.md`
- [ ] Testa reset via `?demoTools=1`
- [ ] Verifiera att reset inte raderar backenddata
- [ ] Dokumentera eventuella setupsteg som behövdes manuellt

## Intern backend readiness

När appen kör lokalt kan intern kontroll öppnas på:

```text
/internal/readiness
```

Sidan är inte länkad från produktflödet. Den kontrollerar Supabase-konfiguration, inloggad testare, tabell-läsning, media buckets och om seed-data verkar finnas. Kontrollen ändrar ingen backenddata.

Rekommenderad användning:

1. Logga in med internt testkonto.
2. Öppna `/internal/readiness`.
3. Kör kontrollen.
4. Åtgärda röda fel innan vanligt testpass.
5. Se gula varningar som tecken på saknad seed eller ofullständigt testläge.

## Intern testobservability

Version 4 har tre repo-nära dokument för upprepade interna releasekandidater:

- `INTERNAL_BUG_LOG.md` för buggar, blockerare, prioritet, status och retest.
- `INTERNAL_RELEASE_NOTES_TEMPLATE.md` för kort intern releasekommunikation.
- `REGRESSION_MATRIX_V4.md` för manuell regression av kärnflöden.

Rekommenderad ordning för en releasekandidat:

1. Kör tekniska checks och `/internal/readiness`.
2. Kör `DEMO_CHECKLIST.md`.
3. Markera resultat i `REGRESSION_MATRIX_V4.md`.
4. Lägg avvikelser i `INTERNAL_BUG_LOG.md`.
5. Fyll release notes och fatta beslut: redo, redo med kända begränsningar eller inte redo.

Den äldre arbetsboken `TrueKind_testplan_och_bugglogg.xlsx` kan behållas som historik eller extra arbetsyta. De nya Markdown-filerna är den enklaste källan för Version 4 releasebeslut.

## Intern RC handoff

`RC_HANDOFF_TEMPLATE.md` används när en kandidat ska lämnas över. Den samlar:

- branch/build, miljö, Supabase-projekt och testkonton
- länk/status för regression, bug-logg, release notes och demo-checklista
- sista readiness-evidens från `/internal/readiness`
- öppna buggar, risker och setupnoteringar
- tydligt beslut: redo, redo med kända begränsningar eller inte redo

Rekommenderad användning är att fylla handoff sist, efter att readiness, regression, buggar och release notes är uppdaterade.

## Intern RC smoke automation

`npm.cmd run smoke:rc` är en liten dependency-free kontroll för upprepade releasekandidater. Den gör bara säkra läsningar:

- validerar att Supabase URL och publik nyckel finns i `.env.local` eller miljön
- bekräftar att centrala RC-dokument finns
- bekräftar att `supabase-internal-setup.sql` innehåller väntade tabeller, buckets och global Discover-seed
- hämtar kritiska routes från den lokala appen och letar efter stabil svensk sidtext

Kontrollen loggar inte in, skriver ingen backenddata och ersätter inte `/internal/readiness`. Den är tänkt som en tidig RC-grind: kör den efter `npm.cmd test`, eventuell lint och lokal appstart, innan testaren loggar in och börjar lägga tid på `/internal/readiness`, demo-checklistan och manuell regression.

Standard-URL är:

```text
http://localhost:3000
```

Om appen körs på annan port:

```powershell
$env:TRUEKIND_SMOKE_BASE_URL="http://localhost:3001"
npm.cmd run smoke:rc
```

Standard-timeout per route är 20000 ms för att undvika falska fel när `next dev` kompilerar kalla routes. Vid långsam lokal miljö kan den höjas tillfälligt:

```powershell
$env:TRUEKIND_SMOKE_TIMEOUT_MS="30000"
npm.cmd run smoke:rc
```

## Version 5 Module 3-kandidat

Nästa modul bör fokusera på evidens från en faktisk RC-körning: samla smoke-resultat, readiness-status, regressionsutfall och buggar i handoffen och avgör om någon smoke-kontroll ska justeras efter verklig friktion.
