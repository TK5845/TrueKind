# Demo-checklista - TrueKind

## Före demo

- [ ] Projektet startar med `npm run dev`
- [ ] Testsuiten går igenom med `npm.cmd test`
- [ ] `.env.local` innehåller Supabase URL och publik anon/publishable key
- [ ] `supabase-internal-setup.sql` har körts i rätt Supabase-projekt
- [ ] Eventuell testkonto-seed har körts via `supabase-internal-user-seed-template.sql`
- [ ] `/internal/readiness` visar inga röda backendfel för aktuellt testkonto
- [ ] Startsidan laddar korrekt
- [ ] Navigationen fungerar
- [ ] Logga in med rätt internt testkonto
- [ ] Rensa lokal testdata via `?demoTools=1` om gammal cache stör flödet
- [ ] Mikrofon fungerar om röstprofil ska visas

## Flöde att testa

### Start
- [ ] Startsidan visas korrekt
- [ ] Login-sidan öppnas
- [ ] Register-sidan öppnas

### Konto
- [ ] Det går att logga in med internt testkonto
- [ ] Utloggning fungerar och leder tillbaka till login
- [ ] Skyddade sidor leder till login när session saknas

### Onboarding
- [ ] Status för konto och profil visas korrekt
- [ ] Stegen leder till profil, röstprofil, Discover, matchlista och meddelanden
- [ ] Profilstatus uppdateras när profilen sparas

### Discover
- [ ] Egen profil visas högst upp
- [ ] Backend-profiler eller tomt backend-läge hanteras utan krasch
- [ ] Gilla sparar matchningen
- [ ] Ångra gilla tar bort matchningen från synlig matchlista
- [ ] Länk till matchlista och samtal fungerar efter gilla

### Match
- [ ] Rätt match visas
- [ ] Öppna meddelanden fungerar
- [ ] Se matchlista fungerar

### Matchlista
- [ ] Sparade matchningar visas
- [ ] Öppna samtal fungerar
- [ ] Visa match fungerar
- [ ] Senaste meddelande visas
- [ ] Oläst-markering fungerar

### Messages
- [ ] Rätt person visas i rubriken
- [ ] Meddelanden går att skicka
- [ ] Tidsstämplar visas
- [ ] Separata chattar fungerar per match
- [ ] Olästa meddelanden markeras som lästa när samtalet öppnas

### Profil
- [ ] Profilinfo visas korrekt
- [ ] Det går att redigera profil
- [ ] Sparade ändringar syns direkt
- [ ] Profilbild går att lägga till eller ta bort
- [ ] Röstprofilstatus visas
- [ ] Videopresentation går att lägga till eller ta bort om bucket/policies är klara

### Voice
- [ ] Mikrofontillgång fungerar
- [ ] Det går att spela in
- [ ] Det går att spela upp
- [ ] Det går att ta bort röstprofil

## Reset för nytt testpass

- [ ] Öppna valfri sida med `?demoTools=1`
- [ ] Klicka `Nollställ testdata`
- [ ] Bekräfta att lokal profilcache, gamla chattar, unread-cache och gillade matchningar är borta
- [ ] Bekräfta att Supabase-konto och backendrader inte har raderats av resetknappen

## Efter demo

- [ ] Notera vad som känns starkast
- [ ] Notera buggar med sida, testkonto och kort reproduktionssteg
- [ ] Notera om felet verkar vara frontend, lokal cache, Supabase setup eller seed-data
- [ ] För in buggar och blockerare i `INTERNAL_BUG_LOG.md`
- [ ] Markera berörda kontroller i `REGRESSION_MATRIX_V4.md` om passet är en releasekandidat
- [ ] Fyll `INTERNAL_RELEASE_NOTES_TEMPLATE.md` om kandidaten ska delas vidare internt
- [ ] Notera vilka funktioner som borde bli nästa steg
