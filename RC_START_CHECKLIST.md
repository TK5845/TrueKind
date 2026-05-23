# TrueKind Version 5 - RC startchecklista

## Syfte

Den här checklistan används när ett nytt internt RC-pass startas. Den ska göra namngivning och första setupen tydlig utan att ersätta `RC_HANDOFF_TEMPLATE.md`, `INTERNAL_RELEASE_NOTES_TEMPLATE.md` eller regressionsmatrisen.

## Namnstandard

Använd samma namn i handoff, release notes och filnamn.

- RC-namn: `TrueKind V5 RC2`
- Handoff-evidens: `rc-evidence/TRUEKIND_V5_RC2_HANDOFF.md`
- Release notes-evidens: `rc-evidence/TRUEKIND_V5_RC2_RELEASE_NOTES.md`
- Vid hotfix eller retest: behåll RC-numret om kandidaten är samma, höj numret om ny kandidat lämnas över.

## Startchecklista

1. Välj RC-namn, till exempel `TrueKind V5 RC2`.
2. Bekräfta branch/build och vilket Supabase-projekt som ska användas.
3. Kopiera `RC_HANDOFF_TEMPLATE.md` till rätt handoff-fil i `rc-evidence/`.
4. Kopiera `INTERNAL_RELEASE_NOTES_TEMPLATE.md` till rätt release-notes-fil i `rc-evidence/`.
5. Fyll kandidatfält, testmiljö, testkonton och ansvarig innan tekniska checks startar.
6. Kör RC-loopen enligt `INTERNAL_TEST_READINESS.md`.
7. Klistra in `RC smoke sammanfattning` från `npm.cmd run smoke:rc` i handoffen.
8. Fyll readiness, regression, buggbeslut och releasebeslut i handoffen när passet är klart.

## Klart för teststart

- [ ] RC-namn valt.
- [ ] Handoff-fil skapad i `rc-evidence/`.
- [ ] Release-notes-fil skapad i `rc-evidence/`.
- [ ] Branch/build noterad.
- [ ] Supabase-projekt noterat.
- [ ] Testkonto bestämt.
- [ ] Lokal app kan startas.
- [ ] Nästa steg är `npm.cmd test`, `npm.cmd run lint` och `npm.cmd run smoke:rc`.
