# pac-vs-fp — guida per chi sviluppa (persone e agenti AI)

Web app statica (Vite + TypeScript + React, pubblicata su GitHub Pages) che confronta il Fondo Pensione FPDDI (comparto Azionario) con un PAC su un ETF azionario globale, a parità di budget annuo. Panoramica, struttura e tabella "Cosa modificare e dove": `README.md`.

## Documenti di riferimento
- Specifica: `docs/SPEC.md`. Interfaccia in vigore: par. 3.0 e prototipi `spec/design/v2/*.dc.html` (riferimento visivo e di comportamento, non codice da copiare).
- Formule: `docs/FORMULE.md`. In caso di dubbio fa fede `spec/reference/model.py` (simulazione) e `spec/reference/history.py` (storico e file contribuzioni).
- Fonti di ogni dato: `docs/FONTI.md`. Verifiche e punti aperti: `docs/VERIFICHE.md`. Modifiche: `docs/CHANGELOG.md`.

## Regole sui dati (non negoziabili)
- Ogni numero viene da un documento del fondo (file e pagina), da una norma o fonte istituzionale, da un emittente o fornitore di dati citato, oppure è un'ipotesi dichiarata. Niente valori inventati o "ragionevoli" senza fonte: se manca, chiedi o segnalalo.
- Ogni numero mostrato che viene da un dato ha il tooltip della fonte (SPEC par. 3.6).
- Per aggiornare un dato: modifica il JSON in `public/data/` con la nuova `evidence`, aggiorna la fonte in `docs/FONTI.md` e annota il motivo in `docs/CHANGELOG.md`.

## Privacy
- Tutto in locale nel browser: nessuna chiamata di rete dopo il caricamento, niente CDN né analytics, CSP restrittiva (`src/csp.ts`), font Onest incluso nel bundle.
- Salvataggio automatico in `localStorage` dei dati inseriti e del file delle operazioni, solo sul dispositivo dell'utente e dalla prima modifica; "Cancella tutto" svuota tutto (SPEC par. 1.1). Niente cookie.
- **Mai committare dati personali**: niente file `.xls` reali (solo i fixture sintetici in `spec/tests/fixtures/`), niente PDF, niente `profilo*.json`, niente cartelle `tests/private/`. Le regole sono in `.gitignore` e verificate da `test/repo-privacy.test.ts`. Controlla `git status` prima di ogni commit.
- I default pubblici vengono da `public/data/profile_example.json` (profilo inventato).

## Lavoro sul repository
- Lavora su un branch e apri una pull request; il push su `main` pubblica il sito.
- Testi in italiano, numeri in formato it-IT (`src/ui/format.ts`).
- Prima di dichiarare finita una modifica: `npm test` (golden di modello e storico, fixture, `tax_checks`, parità con `spec/tests/parity_prototype.js`, privacy del repository), `npm run build` senza errori, `npm run test:e2e` (nessuna richiesta esterna, accessibilità).
- Se cambi volutamente il modello, aggiorna prima `spec/reference/model.py`, rigenera i golden con `python3 spec/tests/make_golden.py`, riallinea `src/model/` e spiega il motivo in `docs/CHANGELOG.md`.
- Nuove pagine o grafici si descrivono prima in `docs/SPEC.md` (ed eventualmente in un prototipo in `spec/design/`). Implementa ciò che dice la spec; se un prototipo e la spec divergono, chiedi.
- La UI non fa calcoli: tutti i numeri della Landing passano da `src/ui/results.ts`, che usa solo `src/model/`.
