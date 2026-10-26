# pac-vs-fp

Web app statica (GitHub Pages, repository `nine1zero/pac-vs-fp`) che confronta il Fondo Pensione FPDDI (comparto Azionario) con un PAC su un ETF azionario globale.

## Documenti
- Specifica: `docs/SPEC.md`. Interfaccia in vigore: par. 3.0 e prototipi `spec/design/v2/*.dc.html` (riferimento visivo e di comportamento, non codice da copiare).
- Formule: `docs/FORMULE.md`. In caso di dubbio fa fede `spec/reference/model.py` (simulazione) e `spec/reference/history.py` (storico e file contribuzioni).
- Fonti di ogni dato: `docs/FONTI.md`. Verifiche e punti aperti: `docs/VERIFICHE.md`. Modifiche: `docs/CHANGELOG.md`.

## Regole sui dati (non negoziabili)
- Ogni numero viene da un documento del fondo (file e pagina), da una norma o fonte istituzionale, da un emittente o fornitore di dati citato, oppure è un'ipotesi dichiarata. Niente valori inventati o "ragionevoli" senza fonte: se manca, chiedi o segnalalo.
- Ogni numero mostrato che viene da un dato ha il tooltip della fonte (SPEC par. 3.6).
- Per aggiornare un dato: modifica il JSON con la nuova `evidence` e la fonte in `docs/FONTI.md`, poi annota il motivo in `docs/CHANGELOG.md`.

## Privacy
- Tutto in locale nel browser: nessuna chiamata di rete dopo il caricamento, niente CDN né analytics, CSP restrittiva, font Onest incluso nel bundle.
- Salvataggio automatico in `localStorage` di ogni dato inserito e del file delle operazioni, solo su questo dispositivo e dalla prima modifica; "Cancella tutto" svuota tutto (decisione dell'autore, SPEC par. 1.1). Niente cookie.
- **Mai committare dati personali**: niente `tests/private/` (anche se lo trovi in locale), niente `.xls` reali (solo `spec/tests/fixtures/`), niente PDF, niente `profilo*.json`. Controlla `git status` prima di ogni commit.
- Default pubblici = `data/profile_example.json` (profilo inventato). Il profilo reale si importa solo in locale.

## Lavoro sul repository
- Lavora su un branch e apri una pull request per ogni fase (SPEC par. 8); non pushare direttamente su `main`.
- Testi in italiano, numeri in formato it-IT.
- Prima di dichiarare finita una fase: `npm test` (golden di modello, storico, fixture, `tax_checks`, parità con `tests/parity_prototype.js`), `npm run build` senza errori, test Playwright di assenza di richieste esterne.
- Se cambi volutamente il modello, aggiorna `spec/reference/model.py`, rigenera i golden con `python3 spec/tests/make_golden.py` e spiega il motivo in `docs/CHANGELOG.md`.
- Nuove pagine o grafici si progettano prima sul canvas di design (claude.ai): arrivano come pull request che aggiornano `spec/design/` e `docs/SPEC.md`. Implementa ciò che dice la spec; se un prototipo e la spec divergono, chiedi.

## Dati sorgente in locale (solo sul Mac dell'autore)
`~/Documents/Claude/Projects/Finance/FondoPensioneIBM/`: `01_documenti_sito` per i PDF del fondo citati in `docs/FONTI.md`, `05_miei_documenti` per i file personali. Da non copiare nel repository.
