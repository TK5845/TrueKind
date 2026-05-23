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
