# Registro delle modifiche


## 2026-11-11 · fumetto "Migliora il repo" nell'app

- Implementato nell'header il fumetto del prototipo (`design/v2/Landing.dc.html`) accanto all'icona di GitHub: "Migliora il repo" con i link stella, pull request (fork) e issue precompilata con il modello. Ha la stessa animazione, ferma con "riduci movimento"; si nasconde sotto i 760 px.
- Scenario 3: "IBM 0 €" senza "· perso" (anche nel prototipo e nella SPEC).
- Tolta la doppia spunta nello stato del salvataggio.

## 2026-11-11 · interfaccia dal canvas di design: la domanda, card con le barre del 1° anno, risposta nel Risultato

Modifiche definite sul canvas di design, portate nell'app e nei prototipi `spec/design/v2/`. Il modello non cambia: golden e parità con il prototipo invariati.

- **Header** (tutte le pagine): nuovo ordine 100% locale · stato del salvataggio · Cancella tutto · Storico · Parametri e fonti · GitHub. "100% locale" e lo stato del salvataggio non hanno più il bordo, perché non sono cliccabili. Il logo GitHub porta al repository.
- **Titolo e introduzione**: "(comparto azionario)" accanto al titolo, più piccolo e grigio. Il riquadro dell'ETF sta su una riga. Nel testo, "100% azionario" al posto di "a comparto Azionario".
- **Riquadro "La domanda"** al posto del banner "Stesso identico budget". Contiene la domanda e una frase più diretta sulla scelta. A destra c'è un box con il risparmio aggiuntivo del 1° anno in grande e un mini slider, collegato allo stesso dato della sezione 3: spostandolo si passa a "Importo fisso", con "Torna al massimo" si torna alla deduzione massima.
- **Card delle strategie**:
  - bordo nel colore dello scenario;
  - nuovi nomi, per ora solo nelle card: "Minimo per contributo + PAC", "Deduzione massima (no PAC)", "Assenza deduzione e contributo (solo PAC)";
  - etichette "Ibrido · Match + PAC", "Solo Fondo", "Solo PAC" sotto il nome;
  - tre barre del 1° anno: risparmio aggiuntivo (uguale nelle tre card) diviso tra Fondo e PAC; nel Fondo, quota tua e contributo IBM in ciano sulla scala del tetto deducibile; rimborso IRPEF verso il PAC sulla stessa scala;
  - tolte le righe di testo "Contributo IBM", "Rimborso IRPEF" e "Flusso 1° anno".
- **Risposta**: tolta dalla cima della pagina. Ora è un riquadro nero in testa alla sezione Risultato, con pareggi e orizzonte. Aggiornato SPEC par. 8 punto 6: senza aprire nulla, la testata del Risultato mostra lo scenario migliore e i tre capitali.
- **Slider dell'importo fisso**: il minimo coincide con la quota minima per il contributo dell'azienda, arrotondata all'euro (975 € nel profilo d'esempio, prima 1.000 €). Il massimo arriva alla deduzione massima: prima, con scatti di 50 € dal minimo, si fermava sotto.
- **Storico**:
  - nel grafico delle componenti il benchmark pubblicato e quello ricostruito sono entrambi viola, il pubblicato pieno e il ricostruito tratteggiato; nel grafico "100 €" il pubblicato è viola pieno;
  - i valori delle statistiche vanno a capo dentro il riquadro; l'intervallo al 95% è scritto "−10,2% … −1,7%".
- **Pagine di dettaglio** (Storico, I miei versamenti, Parametri e fonti): "← Torna al simulatore" anche in cima, a destra del titolo.
- **Slider fermo**: quando la quota minima per il contributo IBM arriva già alla deduzione massima, minimo e massimo coincidono. In quel caso lo slider si disattiva, la traccia non sparisce più e una nota spiega perché è fermo. Succede, per esempio, quando «Tuo contributo minimo» viene dal file delle operazioni ed è l'ultimo versamento mensile, che comprende anche i versamenti oltre il minimo.
- **Risultato** (seconda tornata dal canvas):
  - nomi nuovi degli scenari in tutta la pagina (risposta, card, legende, tooltip, nota dello slider), non più solo nelle card in alto;
  - card compatte con la stessa intestazione delle card in alto; barra dei montanti netti Fondo/PAC sulla stessa scala; solo la migliore è evidenziata, le altre hanno il fondo grigio;
  - striscia "Se esci nel… conviene": etichette con gli anni dove cambia lo scenario, frase di sintesi, tooltip di lettura, legenda con un nome per riga;
  - mappa e grafico del capitale affiancati, testi più brevi, legenda sotto il grafico; etichette lime dei cursori senza bordo; nella mappa le etichette degli anni non si sovrappongono più vicino agli estremi.
- **Test**: Playwright aggiornati (risposta letta nella sezione Risultato, latenza misurata con lo slider del differenziale della stessa sezione) e nuovo test del mini slider.

## 2026-11-09 · verifiche integrali sui Bilanci FPDDI, disaccoppiamento TER e confronto grafico dei 3 scenari

- **Landing — Confronto grafico dei 3 scenari a parità di budget** (`src/ui/landing/Landing.tsx`, `src/ui/results.ts`, `src/styles/base.css`):
  - aggiunto banner esplicito **"Stesso identico budget nei 3 scenari"** sopra le tre card iniziali, che mostra l'esborso annuo netto identico per l'aderente (oltre a TFR e posizione già maturata che restano sempre nel Fondo);
  - ogni card iniziale mostra ora una **barra grafica proporzionale** di ripartizione del budget personale tra **Fondo Pensione** e **PAC ETF autonomo** (`Fondo % / €` vs `PAC % / €`) e il **riepilogo dei flussi del 1° anno** (contributo azienda IBM sbloccato o perso, rimborso IRPEF reinvestito nel PAC e flusso totale annuo verso Fondo e PAC).
- **Modello — Disaccoppiamento del montante del Fondo dal TER dell'ETF scelto per il PAC** (`src/model/simulate.ts`, `spec/reference/model.py`):
  - `fundNetReturn` è ora ancorato al TER dell'ETF di riferimento su cui è calibrato il differenziale storico δ (`0,14%`), così che cambiare l'ETF nel menù a tendina modifichi solo il rendimento e il montante del PAC (e il totale netto), lasciando invariato il montante del Fondo Pensione IBM.
- **Dati storici e fonti verificati su tutti i documenti FPDDI (`public/data/fpddi_azionario.json`, `docs/FONTI.md`, `docs/VERIFICHE.md`, `src/ui/pages/Storico.tsx`)**:
  - completati per il **2012 e 2013** i numeri di pagina (`p. 14`), le citazioni letterali e i valori quota di fine anno (`10,624 €` e `11,668 €`) dai PDF originali `bilancio12.pdf` e `bilancio13.pdf`;
  - aggiunti i valori quota di fine anno **2014–2017** (`11,324`, `12,308`, `12,508`, `13,485`) dalla Sez. 4.2.3 della Nota integrativa dei rispettivi Bilanci;
  - aggiunti i rendimenti netti e i valori quota **2009–2011** (`+8,18%` / `10,818`, `+2,33%` / `11,070`, `−7,80%` / `10,207`, da quota iniziale `10,000 €` a inizio 2009) verificati su `bilancio10.pdf` (p. 24) e `bilancio11.pdf` (p. 24), completando la serie `cumulative_net_since_2009` dal 2009 al 2026;
  - verificata sul Conto Economico (Sez. 4.2.2 dei Bilanci 2010–2025) l'**aliquota effettiva dell'imposta sostitutiva** pagata dal Comparto Azionario (`11,00%` nel 2009–2013, `11,51%` nel 2014, `19,98%–20,03%` nel 2015–2025, con `0,00%` di titoli di Stato in portafoglio);
  - confermata sul Documento sulla politica di investimento (par. 4.2.4, p. 18) la natura **Price Index (senza dividendi)** delle componenti azionarie del benchmark (`MSWRLDE(PI)` / Bloomberg `MSERWI` e `MSEROPE(PI)` / Bloomberg `MSEREURP`).

## 2026-10-26 · salvataggio automatico e favicon

- **Salvataggio automatico**: ogni dato inserito si salva da solo in `localStorage` (`pacfondo.v1`) dalla prima modifica, con un ritardo di 400 ms perché uno slider trascinato scriva una volta sola. Aprire la pagina senza inserire nulla non salva niente.
- Si salva anche il **file delle operazioni**, in una voce a parte (`pacfondo.v1.file`), scritta solo quando si importa un file valido. Alla riapertura il file viene riletto con il parser, quindi la pagina I miei versamenti e i controlli tornano. Se la memoria del browser è piena, un avviso lo dice e i valori ricavati restano salvati.
- "Cancella tutto" svuota entrambe le voci e torna al profilo d'esempio. Il pulsante "Salva i miei dati" è sostituito dallo stato "Salvato · gg/mm hh:mm".
- Aggiornati SPEC par. 1.1 (privacy) e CLAUDE.md; testi dell'app (avvertenze, header, sezione "Il tuo fondo", Parametri e fonti).
- **Mappa "Per quanti anni conviene" di sola lettura**: si ricalcola a ogni cambio dei parametri, ma cliccando le caselle non cambia più età di uscita e differenziale. I valori di ogni casella si leggono passando sopra con il mouse o con le frecce. Aggiornato SPEC par. 3.4 A.
- **Grafico "Capitale netto nei tre scenari"**: quando due scenari quasi coincidono (ad esempio con l'importo fisso al minimo, dove 1 e 2 differiscono di meno dell'1%), la linea blu dello scenario 1 restava nascosta sotto la verde. Ora le linee hanno spessori decrescenti (1 più spessa, 3 più sottile), così quella sotto resta visibile come bordo, e il testo dice quali linee quasi coincidono e di quanto.
- **Favicon** del progetto (`public/favicon.svg` e `public/favicon.ico`), servite dallo stesso dominio.
- Test: regola del salvataggio automatico (Vitest); Playwright: dato salvato e ritrovato dopo il ricaricamento, file salvato e ritrovato nella pagina I miei versamenti, "Cancella tutto" che svuota la memoria, nulla salvato senza inserire dati, favicon.

## 2026-10-23 · fase 6: test Playwright di privacy e accessibilità

- `e2e/privacy.spec.ts`: nessuna richiesta verso altri domini, CSP attiva e nessun errore in console sulla build, anche durante l'import del file e l'uso degli slider, su tutte le pagine. Nessun cookie, `localStorage` e `sessionStorage` vuoti senza "Salva i miei dati", nessun service worker; font Onest servito dallo stesso dominio.
- `e2e/a11y.spec.ts`:
  - axe-core (WCAG 2.1 A e AA) senza violazioni sul simulatore, con ogni sezione aperta, con un file importato (anche con avvisi) e con il grafico al variare del differenziale;
  - stesso controllo su Storico, Parametri e fonti, I miei versamenti con e senza file, a 1280 e a 390 px, dove si verifica anche che non ci sia scorrimento orizzontale;
  - tastiera: link "Vai al contenuto", focus sempre visibile, tooltip delle fonti aperti dal focus;
  - risposta principale in `aria-live`, aggiornata in meno di 100 ms dal movimento dello slider (mediana di 7 prove, SPEC par. 8 punto 5).
- `e2e/lighthouse.spec.ts`: Lighthouse 13 sulla build con la CSP. Accessibility e Best Practices = 100 su tutte e quattro le pagine (soglia della SPEC: 95).
- Correzione emersa dai test: le tabelle con scorrimento orizzontale sono ora regioni con etichetta, raggiungibili da tastiera.
- CI: browser Playwright in cache e installazione senza le dipendenze apt (già presenti in `ubuntu-latest`). Con `--with-deps` il passo durava a volte 10-12 minuti.

## 2026-10-23 · fase 5: pagine Versamenti, Storico, Parametri e fonti

- **I miei versamenti** (`design/v2/Versamenti.dc.html`), con il file letto in memoria (anche caricandolo da qui):
  - riquadri versato da te / azienda / TFR / posizione oggi / stessi versamenti nell'ETF;
  - grafico mese per mese con le tre componenti cumulate, la posizione reale, l'ETF e la differenza in lime, leggibile anche con le frecce;
  - scelta dell'ETF (MSCI ACWI, World, Europe) e "dentro il fondo" / "fuori, prima del 26%";
  - tabella dei movimenti con filtri per anno e tipologia (con i conteggi), totali e "Azzera filtri".
- **Storico** (`design/v2/Storico.dc.html`), tutto calcolato dai dati:
  - benchmark 45/45/10;
  - scelta dell'ETF (dal primo anno disponibile) e del periodo;
  - medie; grafico "100 €" prima e dopo l'imposta; componenti del benchmark; barre annue fondo − ETF e fondo − benchmark;
  - scomposizione del ritardo; statistiche;
  - tabella ordinabile ed esportabile in CSV.
- **Parametri e fonti** (`design/v2/Fonti.dc.html`):
  - barra fissa con ricerca (Fuse.js), "Solo i principali", "Ripristina tutti (N)", gruppi con conteggi e legenda dei tipi di fonte;
  - una riga per parametro con spiegazione, valore modificabile, fonte e "↺ default";
  - ancoraggio `#/parametri/<id>` e "copia link";
  - assunzioni e limiti; elenco delle fonti (SPEC par. 9).
  - Le modifiche valgono in tutto il simulatore e si salvano con "Salva i miei dati".
- **Profilo JSON**: esporta i parametri e importa un profilo. L'import accetta il formato della SPEC par. 7 e quello di `reference/model.py`, quindi anche il profilo privato, che resta in locale; scarta i valori fuori dai limiti o sconosciuti.
- **Decisioni con la risposta consigliata** (regola del 23/10/2026, modificabili):
  - nuovi parametri in `params.json`, così ogni numero usato dal modello è nella pagina (SPEC par. 8 punto 7). Fonti già citate in `docs/FONTI.md`:
    - `inps_extra_rate`: 1%, L. 438/1992 art. 3-ter;
    - `inps_first_band`: 56.224 €, circolare INPS n. 6/2026;
    - `base_year_real`: 2026, convenzione;
    - `member_min_rate_low` e `member_min_rate_high`: 2% e 7%, Nota informativa 2026 p. 9, solo informativi;
  - i "preset salvati con nome" in `localStorage` (SPEC par. 3.4 H) sono sostituiti da export/import di un file JSON, che copre anche l'import del profilo privato;
  - il comparto Assicurativo (SPEC par. 3.4 F) non è nello Storico: il prototipo v2 in vigore non lo prevede. I calcoli sono già in `src/model/history.ts` e testati.
- **Dato senza fonte rimosso**: la descrizione di `etf_name` in `params.json` diceva "circa 2.300 aziende di 23 paesi sviluppati e 24 emergenti", un numero senza fonte e in contrasto con l'ETF di default (3.755 titoli). Ora rimanda alla scheda dell'ETF.
- Test: righe dei parametri, modifiche, ripristino, import/export (Vitest); le tre pagine con Playwright. Coperti fonte di ogni parametro accessibile da tastiera, ricerca, modifica che cambia il risultato, valori del fixture in Versamenti e medie e scomposizione nello Storico.

## 2026-10-23 · fase 4: interfaccia v2 della Landing

- Landing come nel prototipo `design/v2/Landing.dc.html`: menù dell'ETF nel titolo, tre card delle strategie, navigazione delle sezioni 0-6 con stato, sezioni comprimibili con riepilogo e badge `Esempio`/`Dati tuoi`.
- Risultato: frase risposta (`aria-live`), tre card con capitale netto, euro di oggi e divisione fondo/PAC, barra "Chi vince a ogni differenziale", striscia "Se esci nel… conviene", fascia dei parametri, mappa "Per quanti anni conviene" (cliccabile e navigabile con le frecce) e grafico del capitale "Nel tempo" e "Al variare del differenziale" con i pareggi.
- Tutti i numeri vengono da `src/model`; preset del differenziale e statistiche storiche sono calcolati dai dati, non scritti nel codice. Il pulsante "Usa un file d'esempio" legge davvero il fixture.
- Tooltip della fonte (`Src`) su ogni numero che viene da un dato (SPEC par. 3.6): fonte di `params.json`, scheda dell'ETF, calcolo storico o formula con il rimando a `docs/FORMULE.md`.
- "Salva i miei dati" e "Cancella tutto": `localStorage` (chiave `pacfondo.v1`) solo su azione esplicita, mai il file importato, niente cookie.
- **Decisione di progetto (23/10/2026):** sotto le card delle strategie c'è una riga di risposta sempre visibile. Riporta scenario migliore, vantaggio sulla seconda, pareggi delle tre coppie e orizzonte di pareggio 2-1 con il differenziale scelto (SPEC par. 8 punto 6), anche a sezioni chiuse.
- **Nuovo `data/etf_catalog.json`**: TER, ISIN, indice, copertura, titoli, patrimonio, storia e medie a 5 e 10 anni e dal lancio dei tre ETF. I valori sono trascritti dal prototipo, con le fonti di `docs/FONTI.md` par. 4 (rilevazioni del 20-23/10/2026). Vanno riscaricati dalle schede ufficiali degli emittenti quando sono raggiungibili senza autenticazione: dall'ambiente di sviluppo i siti degli emittenti sono bloccati dalla rete, quindi l'aggiornamento resta da fare.
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
- **Decisione di progetto (23/10/2026):** la modalità ridotta (avviso giallo, niente confronto con l'ETF) scatta solo se mancano tutte e quattro le colonne delle quote (Comparto, Numero Quote, Valore Quota, Data Valore Quota), come nei fondi solo assicurativi. Se ne mancano solo alcune è un errore rosso: è il caso di `sample_dettaglio_bad_columns.xls`.
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
- Licenza MIT, titolare "pac-vs-fp contributors" (titolarità collettiva).

## 2026-10-23 · spec v2

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
