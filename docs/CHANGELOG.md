# Registro delle modifiche

## 2026-10-23 · fase 4: interfaccia v2 della Landing

- Landing come nel prototipo `design/v2/Landing.dc.html`: menù dell'ETF nel titolo, tre card delle strategie, navigazione delle sezioni 0-6 con stato, sezioni comprimibili con riepilogo e badge `Esempio`/`Dati tuoi`.
- Risultato: frase risposta (`aria-live`), tre card con capitale netto, euro di oggi e divisione fondo/PAC, barra "Chi vince a ogni differenziale", striscia "Se esci nel… conviene", fascia dei parametri, mappa "Per quanti anni conviene" (cliccabile e navigabile con le frecce) e grafico del capitale "Nel tempo" e "Al variare del differenziale" con i pareggi.
- Tutti i numeri vengono da `src/model`; preset del differenziale e statistiche storiche sono calcolati dai dati, non scritti nel codice. Il pulsante "Usa un file d'esempio" legge davvero il fixture.
- Tooltip della fonte (`Src`) su ogni numero che viene da un dato (SPEC par. 3.6): fonte di `params.json`, scheda dell'ETF, calcolo storico o formula con il rimando a `docs/FORMULE.md`.
- "Salva i miei dati" e "Cancella tutto": `localStorage` (chiave `pacfondo.v1`) solo su azione esplicita, mai il file importato, niente cookie.
- **Decisione dell'autore (23/10/2026):** sotto le card delle strategie c'è una riga di risposta sempre visibile. Riporta scenario migliore, vantaggio sulla seconda, pareggi delle tre coppie e orizzonte di pareggio 2-1 con il differenziale scelto (SPEC par. 8 punto 6), anche a sezioni chiuse.
- **Nuovo `data/etf_catalog.json`** (autorizzato dall'autore): TER, ISIN, indice, copertura, titoli, patrimonio, storia e medie a 5 e 10 anni e dal lancio dei tre ETF. I valori sono trascritti dal prototipo, con le fonti di `docs/FONTI.md` par. 4 (rilevazioni del 20-23/10/2026). L'autore ha chiesto di riscaricarli dalle schede ufficiali degli emittenti quando sono raggiungibili senza autenticazione: dall'ambiente di sviluppo i siti degli emittenti sono bloccati dalla rete, quindi l'aggiornamento resta da fare.
- Scelte di implementazione:
  - grafici in SVG e CSS come nei prototipi, invece di ECharts (SPEC par. 2 lo consigliava): bundle più leggero, nessun problema di CSP, mappa navigabile da tastiera;
  - la mappa usa il passo di 0,25 punti della SPEC par. 4.6 (il prototipo usava 0,5);
  - l'avvertenza all'apertura è la sezione 0, aperta al primo accesso, come nel prototipo; il footer la riapre ("Privacy e avvertenze").
- `Intl` in it-IT non separa le migliaia sotto 10.000 ("4390 €"): i formati usano `useGrouping: 'always'` per avere "4.390 €" come chiede la SPEC.
- Pagine Versamenti, Storico e Parametri e fonti: segnaposto fino alla fase 5.
- Test: store e salvataggio (Vitest), formati it-IT, Playwright sulla Landing (golden senza dati, fixture al passo 2, errori e avvisi dei file, badge "Dati tuoi", `localStorage`, cambio dell'ETF, slider da tastiera, testo delle fonti) e privacy con import e slider.

## 2026-10-23 · fase 3: storico e import del file

- `src/data/`: i dati di `public/data/` entrano nel bundle (JSON e CSV), senza richieste di rete.
- `src/model/history.ts`: tabella annua (fondo e benchmark prima dell'imposta, ETF e componenti, benchmark ricostruito), CAGR, differenziali, statistiche dei differenziali annui (deviazione standard campionaria), scomposizione del ritardo, preset del differenziale calcolati dai dati, cumulati.
- `src/import/dettaglio.ts`: lettura del DettaglioOperazioni con `DOMParser` e validazione del par. 6.2 (errori bloccanti, avvisi, esito verde).
- **Decisione dell'autore (23/10/2026):** la modalità ridotta (avviso giallo, niente confronto con l'ETF) scatta solo se mancano tutte e quattro le colonne delle quote (Comparto, Numero Quote, Valore Quota, Data Valore Quota), come nei fondi solo assicurativi. Se ne mancano solo alcune è un errore rosso: è il caso di `sample_dettaglio_bad_columns.xls`.
- `src/model/contributions.ts`: posizione reale per comparto, stessi versamenti nell'ETF dentro e fuori dal fondo (per ACWI, MSCI World, MSCI Europe), serie a fine mese per il grafico, precompilazione del simulatore. La formula "dentro il fondo" vale per qualsiasi data di valutazione: nell'anno di valutazione usa il rendimento fino al mese di valutazione. Con il fixture coincide con `reference/history.py`.
- Test: `golden_history.json` (CAGR entro 1e-12), statistiche e scomposizione di FORMULE par. 8, preset del prototipo, cumulati dell'Assicurativo (SPEC par. 5.4), i tre fixture, `golden_fixture_ok.json`, serie mensili uguali a quelle del prototipo Versamenti, `source`/`source_kind` di ogni parametro ed `evidence` di ogni anno (par. 8 punto 10).

## 2026-10-23 · fase 2: modello in TypeScript

- `src/model/`: fisco (`tax.ts`), flussi (`flows.ts`), simulazione (`simulate.ts`), forma chiusa (`closedForm.ts`), pareggi (`breakeven.ts`), mappa di convenienza (`map.ts`). Codice TypeScript puro, senza interfaccia, con gli stessi nomi di `reference/model.py`.
- Nuovo `tests/make_golden_parity.py` → `tests/golden_parity_cases.json`: i 7 casi di `tests/parity_prototype.js` (default, δ = 0, riscatto a 10 anni, importo fisso 3.000 € e 200 €, RAL 90.000 € e 20.000 €) calcolati con `reference/model.py`. Il modello non cambia.
- Test Vitest: golden del profilo d'esempio e `tax_checks` al centesimo, pareggi entro 1e-6, parità a tre (model.py, prototipo v2, TypeScript), forma chiusa uguale alla ricorsione, mappa 40 × 120 sotto i 50 ms. Il profilo privato si confronta con `model.py` solo se il file esiste in locale.
- `spec/package.json` (`"type": "commonjs"`): con `"type": "module"` nel `package.json` della radice, `node spec/tests/parity_prototype.js` non partiva più.

## 2026-10-23 · fase 1: scaffold e deploy

- Vite 7 + TypeScript 5.9 + React 18, font Onest nel bundle (`@fontsource/onest`, solo latino), stile "lime" di base.
- CSP della SPEC par. 1.1 come meta tag nella build (`src/csp.ts`); in sviluppo no, perché Vite usa script inline.
- Test: CSP uguale al testo della SPEC; nessun file personale tracciato da git (cartelle private, PDF, `profilo*.json`, `.xls` fuori dai fixture); Playwright sulla build senza richieste esterne, con CSP attiva e font locale.
- Workflow GitHub Actions: test su ogni pull request, deploy su GitHub Pages da `main`.
- `.npmrc` con `legacy-peer-deps`: npm 10 si blocca (errore `edgesOut`) sulle dipendenze opzionali di Vite 8 richieste da Vitest.
- Licenza MIT, titolare "pac-vs-fp contributors" (l'autore resta anonimo).

## 2026-10-23 · spec v2 per il passaggio a Claude Code

**Interfaccia** (`design/v2/`, SPEC par. 3.0)
- Nuova landing: simulatore a sezioni comprimibili, stile lime/Onest.
- Menù a tendina dell'ETF del PAC (Vanguard FTSE All-World default, SPDR MSCI ACWI IMI, iShares MSCI ACWI), con schede confrontabili; l'ETF scelto vale in tutta la simulazione.
- Rendimento atteso con la stima di lungo periodo 7% (J.P. Morgan LTCMA 2026) e le medie a 5 e 10 anni e dal lancio dell'ETF scelto.
- Pensione/riscatto nella sezione dell'orizzonte; importo fisso limitato tra quota minima e deduzione massima.
- Risultato: griglia 2×2, fascia dei parametri, mappa "Per quanti anni conviene", capitale nel tempo con punti di pareggio.
- Nuove pagine: I miei versamenti (con filtri per anno e tipologia), Storico (benchmark 45/45/10 e ETF), Parametri e fonti in stile v2.
- Pulsanti "Salva i miei dati" e "Cancella tutto" (localStorage, solo su azione esplicita).
- Tooltip della fonte obbligatori su ogni numero (par. 3.6).

**Modello** (`reference/model.py`, golden rigenerati)
- Risparmio fiscale esatto, con detrazione per lavoro dipendente, cuneo fiscale e addizionali a scaglioni, invece dell'aliquota marginale fissa. Cambia i risultati: vedi `docs/VERIFICHE.md` par. 2.
- INPS 9,19% + 1% oltre la prima fascia; addizionale comunale 0,8%; addizionale regionale a scaglioni.
- TER dell'ETF scelto (default 0,14%); niente doppio conteggio del TER con le medie storiche.
- Importo fisso limitato ogni anno tra quota minima e deduzione massima.

**Storico e import** (`reference/history.py`)
- Valore quota dell'ultimo movimento del file per la posizione reale; la riga TOTALE non è un movimento. Il golden del fixture ora vale 18.751,61 € (prima 18.752,05 €).

**Dati**
- Ogni anno di `fpddi_azionario.json` ha il campo `evidence` (file, pagina, citazione); aggiunti `cross_checks`.
- `params.json` v2: fonti con documento e pagina, nuovo parametro `payroll_deduction`.
- Nuovo `etf_annual_extra.json` (Vanguard FTSE All-World, SPDR MSCI ACWI IMI).
- Nuovi `docs/FORMULE.md`, `docs/FONTI.md`, `docs/VERIFICHE.md`.
