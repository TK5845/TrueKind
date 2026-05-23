# TrueKind Version 4 - Intern bug-logg

## Syfte

Den här mallen används för interna releasekandidater och upprepade testpass. Den ska göra buggar lättare att triagera utan att blanda ihop frontendproblem, lokal cache, Supabase setup och seed-data.

Den äldre arbetsboken `TrueKind_testplan_och_bugglogg.xlsx` kan användas som historik. För nya Version 4-pass är den här Markdown-loggen enklare att granska i repo och koppla till release notes.

## När en buggrad ska skapas

- Flödet avviker från förväntat resultat i `REGRESSION_MATRIX_V4.md`.
- En intern testare fastnar, även om appen inte kraschar.
- `/internal/readiness` visar rött eller gult som påverkar testpasset.
- Seed-data, RLS, storage eller lokal cache behöver manuell handpåläggning.
- En tidigare fix behöver retestas.

## Prioritet

- `P1`: blockerar intern releasekandidat eller ett kärnflöde.
- `P2`: tydlig användar- eller testfriktion i ett viktigt flöde.
- `P3`: mindre fel, kantfall eller inkonsekvent tomläge.
- `P4`: polish, text, mindre visuell störning eller förbättringsidé.

## Status

- `Ny`
- `Triagerad`
- `Pågår`
- `Redo för retest`
- `Verifierad`
- `Parkerad`
- `Avvisad`

## Aktuell logg

| ID | Datum | RC/build | Testare | Konto | Miljö | Flöde | Prioritet | Status | Kort beskrivning | Ägare | Bevis/länk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TK-BUG-YYYYMMDD-01 | YYYY-MM-DD | v4-rcX |  |  | Desktop/Mobile |  | P2 | Ny |  |  |  |

## Buggrapport

Kopiera blocket nedan när en rad behöver mer detaljer.

```text
ID:
Datum:
RC/build:
Testare:
Testkonto:
Miljö:
Sida/flöde:
Prioritet:
Status:

Förväntat:

Faktiskt:

Steg för att återskapa:
1.
2.
3.

Data/setup:
- Supabase-projekt:
- Seed körd:
- /internal/readiness:
- ?demoTools reset körd:

Bevis/logg:

Trolig kategori:
- Frontend
- Lokal cache
- Auth/session
- Supabase RLS
- Supabase storage
- Seed-data
- Media
- Match/messages
- Okänd

Nästa steg:

Retest:
```

## Triage inför releasebeslut

- [ ] Alla `P1` är verifierade eller releasekandidaten stoppas.
- [ ] Alla öppna `P2` har ett tydligt beslut: fixa nu, acceptera tillfälligt eller parkera.
- [ ] Buggar kopplade till setup är speglade i `INTERNAL_TEST_READINESS.md` eller release notes.
- [ ] Retestade buggar har status `Verifierad`.
- [ ] Kända begränsningar är flyttade till `INTERNAL_RELEASE_NOTES_TEMPLATE.md`.
