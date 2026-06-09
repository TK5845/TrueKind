# TrueKind V12 - Discover mobile regression checklist

## Syfte

Använd den här checklistan för ett snabbt manuellt Discover-pass efter V12-förändringar. Den kompletterar den bredare regressionsmatrisen och fokuserar bara på Discover i mobil vy.

Rekommenderad vy: mobil viewport runt `390 x 844`.

## Förberedelse

- [ ] Starta appen lokalt med `npm run dev`.
- [ ] Öppna `/discover` i mobil vy.
- [ ] Bekräfta vilket testläge som används: utloggad, inloggad utan komplett profil, inloggad med kandidater eller backend/tomt läge.
- [ ] Notera konto, Supabase-projekt och om `?demoTools=1`/lokal reset användes.

## Discover states

| ID | Kontroll | Förväntat | Status | Anteckning |
| --- | --- | --- | --- | --- |
| V12-DISC-MOB-01 | Utloggad Discover | Sidan visar `Logga in för att se profiler som kan passa dig`, kort förklaring och länkar till login/register. Inga gilla-knappar visas. | Ej körd |  |
| V12-DISC-MOB-02 | Profil ej komplett | Sidan förklarar att mer profilinfo gör Discover mer relevant och visar CTA till profil. | Ej körd |  |
| V12-DISC-MOB-03 | Inga nya kandidater | Tomläget förklarar att inga aktiva Discover-profiler finns just nu och ger CTA till profil. | Ej körd |  |
| V12-DISC-MOB-04 | Backend/fallback tomt | Tomläget säger att profiler inte kunde hämtas just nu och föreslår att försöka igen eller kontrollera profilen. | Ej körd |  |
| V12-DISC-MOB-05 | Kandidatkort visas | Varje kort visar bild/placeholder, namn, stad, relevans, bio, riktning, aktivitet, intressen och CTA-rad utan överlapp. | Ej körd |  |

## Candidate card readability

| ID | Kontroll | Förväntat | Status | Anteckning |
| --- | --- | --- | --- | --- |
| V12-DISC-CARD-01 | `Varför den här?` | Strippen syns tydligt, har läsbar radlängd och känns inte ihoptryckt mot pill-raderna. | Ej körd |  |
| V12-DISC-CARD-02 | Relevans- och kemipills | Pills wrappar mjukt på mobil och texten kapas inte. | Ej körd |  |
| V12-DISC-CARD-03 | Riktning, aktivitet och intressen | Pills är kompakta men läsbara; flera intressen får radbrytas utan att layouten hoppar. | Ej körd |  |
| V12-DISC-CARD-04 | Biotext | Profiltexten är skannbar och trycker inte bort CTA-raden på ett rörigt sätt. | Ej körd |  |
| V12-DISC-CARD-05 | CTA-rad, ej gillad | `Gilla` är lätt att trycka på och hjälpraden `Gilla för att lägga till i matchlistan` ligger under utan trängsel. | Ej körd |  |
| V12-DISC-CARD-06 | CTA-rad, gillad | `Ångra gilla`, `Visa matchning` och `Öppna samtal` wrappar rent och är läsbara. | Ej körd |  |

## Flow checks

| ID | Kontroll | Förväntat | Status | Anteckning |
| --- | --- | --- | --- | --- |
| V12-DISC-FLOW-01 | Gilla | Gilla sparar profilen och visar länk till matchlistan utan att kortlayouten bryts. | Ej körd |  |
| V12-DISC-FLOW-02 | Ångra gilla | Ångra tar bort synlig matchning enligt befintligt beteende. | Ej körd |  |
| V12-DISC-FLOW-03 | Matchlista | `Visa matchning` leder till `/matches?match=id`. | Ej körd |  |
| V12-DISC-FLOW-04 | Samtal | `Öppna samtal` leder till `/messages?match=id`. | Ej körd |  |

## Release note

- [ ] Logga alla avvikelser i `INTERNAL_BUG_LOG.md`.
- [ ] För RC-pass: spegla blockerande Discover-fynd i aktuell handoff/release notes.
- [ ] Om bara copy/layout avviker, markera prioritet som P3/P4 om kärnflödet fortfarande fungerar.
