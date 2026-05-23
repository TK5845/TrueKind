# TrueKind Version 4 - Intern RC handoff

## Syfte

Den här mallen används när en intern releasekandidat ska lämnas över för test eller beslut. Den samlar smoke-output, readiness-evidens, regressionsläge, buggbeslut och nästa steg utan att ändra appflöden eller ersätta de mer detaljerade testdokumenten.

## När mallen används

- Inför en ny intern releasekandidat.
- När en tidigare kandidat har fått fixar och behöver retestas.
- När testresultat ska lämnas över till någon som inte var med i hela testpasset.
- När beslutet behöver vara tydligt: redo, redo med kända begränsningar eller inte redo.

## Kandidat

- RC-namn:
- Datum:
- Ansvarig:
- Branch/build:
- Supabase-projekt:
- Testmiljö:
- Testkonton:
- Testare:

## Dokument för kandidaten

| Dokument | Status | Länk/anteckning |
| --- | --- | --- |
| `REGRESSION_MATRIX_V4.md` | Ej startad |  |
| `INTERNAL_BUG_LOG.md` | Ej triagerad |  |
| `INTERNAL_RELEASE_NOTES_TEMPLATE.md` | Ej ifylld |  |
| `DEMO_CHECKLIST.md` | Ej körd |  |
| Smoke-output | Ej sparad |  |

## Snabb workflow

1. Bekräfta kandidatens branch/build och vilket Supabase-projekt som används.
2. Kör tekniska checks: `npm.cmd test` och vid releasebeslut även `npm.cmd run lint`.
3. Starta appen lokalt och kör `npm.cmd run smoke:rc`.
4. Stoppa och åtgärda om smoke fallerar på setup, dokument, SQL eller route-markörer.
5. Logga in med internt testkonto och öppna `/internal/readiness`.
6. Spara teknisk evidens och readiness-evidens i avsnitten nedan.
7. Kör `DEMO_CHECKLIST.md` och fyll `REGRESSION_MATRIX_V4.md`.
8. Lägg avvikelser i `INTERNAL_BUG_LOG.md` och fatta beslut för öppna `P1`/`P2`.
9. Fyll `INTERNAL_RELEASE_NOTES_TEMPLATE.md`.
10. Sammanfatta regression, buggbeslut och release notes i den här handoffen.
11. Fatta handoff-beslut längst ned i mallen.

## Teknisk evidens

Fyll i direkt efter tekniska checks och smoke. Spara kort output eller länk till logg/skärmbild när det finns.

| Fält | Värde |
| --- | --- |
| Tidpunkt |  |
| Lokal URL | `http://localhost:3000` |
| `npm.cmd test` | Pass / Fail / Ej körd |
| `npm.cmd run lint` | Pass / Fail / Ej körd |
| Lint-varningar |  |
| `npm.cmd run smoke:rc` | Pass / Fail / Ej körd |
| Smoke-sammanfattning |  |
| Smoke-avvikelser |  |
| Bevis/länk/skärmbild |  |

## Readiness-evidens

Fyll i efter sista körningen av `/internal/readiness`.

| Fält | Värde |
| --- | --- |
| Tidpunkt |  |
| Testkonto |  |
| Supabase-projekt |  |
| `npm.cmd run smoke:rc` | Pass / Fail / Ej körd |
| Readiness-status | Grön / Gul / Röd / Ej körd |
| Röda checks |  |
| Gula checks |  |
| Seed-data bekräftad | Ja / Nej / Delvis |
| Storage buckets bekräftade | Ja / Nej / Delvis |
| Bevis/länk/skärmbild |  |

## Regression och beslut

Fyll i efter regression, bug-triage och release notes. Håll det kort och länka till detaljerna i respektive dokument.

| Fält | Värde |
| --- | --- |
| `DEMO_CHECKLIST.md` | Pass / Fail / Delvis / Ej körd |
| `REGRESSION_MATRIX_V4.md` | Klar / Delvis / Ej körd |
| Regression sammanfattning | OK: / Fel: / Blockerad: / Ej körd: |
| Öppna `P1` |  |
| Öppna `P2` |  |
| Bug-logg beslut | Inga öppna / Fix nu / Acceptera tillfälligt / Parkera |
| Release notes | Ifylld / Delvis / Ej ifylld |
| Handoff komplett | Ja / Nej |

## Buggar och risker

| Typ | ID/länk | Prioritet | Status | Beslut |
| --- | --- | --- | --- | --- |
| Bug |  |  |  |  |
| Risk |  |  |  |  |
| Setupnotering |  |  |  |  |

## Handoff-sammanfattning

Skriv kort nog att nästa person kan förstå kandidatens läge utan att läsa alla filer först.

- Vad är starkast i kandidaten:
- Vad behöver retestas:
- Kända begränsningar:
- Setup som var känslig eller manuell:
- Rekommenderat nästa steg:

## Beslut

Välj ett beslut.

- [ ] Redo för intern releasekandidat
- [ ] Redo med kända begränsningar
- [ ] Inte redo

Motivering:

## Minimikrav för redo

- [ ] `npm.cmd test` passerar.
- [ ] `npm.cmd run smoke:rc` passerar mot aktuell lokal URL.
- [ ] `/internal/readiness` har ingen röd check som påverkar aktuellt testpass.
- [ ] Regressionen har inga öppna `P1`.
- [ ] Alla öppna `P2` är dokumenterade och accepterade eller planerade.
- [ ] Release notes är ifyllda.
- [ ] Teknisk evidens, readiness, regression och buggbeslut är samlade i den här handoffen.
- [ ] Nästa person kan se vilken miljö, vilket konto och vilken seed-data som användes.

## Kandidat

- RC-namn: TrueKind V5 RC1
- Datum: [fyll i datum]
- Ansvarig: Perica Presljic
- Branch/build: main
- Supabase-projekt: [fyll i projekt/instans]
- Testmiljö: Lokal utvecklingsmiljö
- Testkonton: Internt testkonto
- Testare: Perica Presljic

## Dokument för kandidaten

| Dokument | Status | Länk/anteckning |
| --- | --- | --- |
| `REGRESSION_MATRIX_V4.md` | Klar | Kärnflöden genomförda |
| `INTERNAL_BUG_LOG.md` | Triagerad | Inga blockerande fel från passet |
| `INTERNAL_RELEASE_NOTES_TEMPLATE.md` | Ifylld | RC1 sammanfattad |
| `DEMO_CHECKLIST.md` | Körd | Fullt pass genomfört |
| Smoke-output | Sparad | `npm.cmd run smoke:rc` passerade |

## Teknisk evidens

| Fält | Värde |
| --- | --- |
| Tidpunkt | [fyll i tidpunkt] |
| Lokal URL | `http://localhost:3000` |
| `npm.cmd test` | Pass |
| `npm.cmd run lint` | Pass |
| Lint-varningar | 8 kända `<img>`-varningar |
| `npm.cmd run smoke:rc` | Pass |
| Smoke-sammanfattning | Smoke-checks passerade |
| Smoke-avvikelser | Inga blockerande |
| Bevis/länk/skärmbild | Lokal körning verifierad |

## Readiness-evidens

| Fält | Värde |
| --- | --- |
| Tidpunkt | [fyll i tidpunkt] |
| Testkonto | Internt testkonto |
| Supabase-projekt | [fyll i projekt/instans] |
| `npm.cmd run smoke:rc` | Pass |
| Readiness-status | Grön / godkänd |
| Röda checks | Inga |
| Gula checks | Eventuell mild seed-varning, ej blockerande |
| Seed-data bekräftad | Ja / Delvis |
| Storage buckets bekräftade | Ja |
| Bevis/länk/skärmbild | Readiness kontrollerad i lokal körning |

## Regression och beslut

| Fält | Värde |
| --- | --- |
| `DEMO_CHECKLIST.md` | Pass |
| `REGRESSION_MATRIX_V4.md` | Klar |
| Regression sammanfattning | OK: kärnflöden fungerar / Fel: inga blockerande / Blockerad: inga / Ej körd: inga viktiga kärnflöden |
| Öppna `P1` | Inga |
| Öppna `P2` | Inga blockerande från detta pass |
| Bug-logg beslut | Inga öppna blockerare |
| Release notes | Ifylld |
| Handoff komplett | Ja |

## Buggar och risker

| Typ | ID/länk | Prioritet | Status | Beslut |
| --- | --- | --- | --- | --- |
| Setupnotering | OneDrive / lokal `.next`-friktion | P3 | Känd | Accepteras i lokal utvecklingsmiljö |

## Handoff-sammanfattning

- Vad är starkast i kandidaten: stabila kärnflöden, readiness, smoke och intern RC-process
- Vad behöver retestas: endast vid nästa releasekandidat eller efter ny modul
- Kända begränsningar: lokal miljö kan påverkas av OneDrive-lås
- Setup som var känslig eller manuell: Supabase setup och seed behöver vara rätt körda i rätt projekt
- Rekommenderat nästa steg: fortsätt med nästa V5-modul eller ny RC efter nästa ändringspaket

## Beslut

- [x] Redo för intern releasekandidat
- [ ] Redo med kända begränsningar
- [ ] Inte redo

Motivering:

Första riktiga V5 RC-pass genomfört med godkänt resultat. Smoke, readiness och kärnflöden fungerade fint. Inga blockerande fel noterades i detta pass.

## Minimikrav för redo

- [x] `npm.cmd test` passerar.
- [x] `npm.cmd run smoke:rc` passerar mot aktuell lokal URL.
- [x] `/internal/readiness` har ingen röd check som påverkar aktuellt testpass.
- [x] Regressionen har inga öppna `P1`.
- [x] Alla öppna `P2` är dokumenterade och accepterade eller planerade.
- [x] Release notes är ifyllda.
- [x] Teknisk evidens, readiness, regression och buggbeslut är samlade i den här handoffen.
- [x] Nästa person kan se vilken miljö, vilket konto och vilken seed-data som användes.