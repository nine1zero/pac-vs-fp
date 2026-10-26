# PAC vs Fondo Pensione: specifica della web app

Documento di specifica per Claude Code. Obiettivo: costruire una web app statica, ospitata su GitHub Pages nel repository `https://github.com/nine1zero/pac-vs-fp`, che replica e migliora il simulatore Google Sheets "FPDDI – Simulatore Fondo pensione vs PAC ETF".

Il simulatore confronta tre modi di usare lo stesso risparmio annuo per un iscritto al Fondo Pensione per i Dipendenti e Dirigenti IBM (FPDDI), comparto Azionario. Le alternative sono più o meno versamenti nel fondo e un PAC su un ETF azionario globale passivo. Il risultato principale è **il punto di pareggio**: per quale differenziale di rendimento tra fondo ed ETF, e per quanti anni di permanenza, conviene una strategia rispetto all'altra.

Lingua dell'interfaccia: **italiano**. Formati numerici: `it-IT` (1.234,56 €; 5,8%).

---

## 0. Come usare questo pacchetto

Contenuto della cartella `pac-vs-fp-spec/`:

| Percorso | Contenuto |
|---|---|
| `SPEC.md` | Questo documento: requisiti, formule, interfaccia, test |
| `CLAUDE.md` | Istruzioni brevi da copiare nella radice del repository |
| `data/fpddi_azionario.json` | Rendimenti annui pubblicati del comparto Azionario e del benchmark, con fonti |
| `data/fpddi_assicurativo.json` | Rendimenti netti del comparto Assicurativo, inflazione ISTAT, rivalutazione TFR |
| `data/etf_monthly.csv` + `etf_monthly.sources.json` | Prezzi di fine mese 12/2011-10/2026 di ACWI, MSCI World, MSCI Europe, liquidità €STR |
| `data/params.json` | Catalogo completo dei parametri (id, etichetta, gruppo, unità, default, limiti, fonte, tag di ricerca) |
| `data/profile_example.json` | Profilo d'esempio pubblico, usato come default dell'app |
| `reference/model.py` | Implementazione di riferimento del modello (fa fede in caso di dubbio) |
| `reference/history.py` | Riferimento per statistiche storiche, parser del file contribuzioni e confronto con l'ETF |
| `tests/golden_model_example.json` | Valori attesi del modello per il profilo d'esempio |
| `tests/golden_history.json` | Valori attesi delle statistiche storiche |
| `tests/golden_fixture_ok.json` | Valori attesi per il file sintetico di test |
| `tests/fixtures/*.xls` | File contribuzioni sintetici: uno valido e due non validi |
| `tests/private/profilo_privato.json` | **Non incluso in questo pacchetto.** Dati personali reali (profilo e valori di controllo), solo sul computer dell'autore, da non pubblicare mai |
| `docs/FORMULE.md` | Metodo: tutte le formule, con esempi numerici e fonti normative |
| `docs/FONTI.md` | Provenienza di ogni dato (file del fondo e pagina, norma, emittente) |
| `docs/VERIFICHE.md` | Registro delle verifiche su dati e calcoli, correzioni fatte, punti aperti |
| `docs/CHANGELOG.md` | Modifiche a spec, design e modello, con il motivo |
| `data/etf_annual_extra.json` | Rendimenti annui di Vanguard FTSE All-World e SPDR MSCI ACWI IMI |
| `tests/make_golden.py` | Rigenera `golden_model_example.json` dal modello (solo per modifiche volute) |
| `tests/parity_prototype.js` | Confronta il codice del prototipo v2 con `reference/model.py` |
| `design/v2/*.dc.html` | **Prototipi in vigore** (par. 3.0): Landing (simulatore a sezioni), Versamenti, Storico, Fonti |
| `design/v1/*.dc.html` | Prima versione (percorso guidato e parametri), solo per confronto |

Posizione locale sul Mac dell'autore (percorso di partenza per Claude Code):

```
~/Documents/Claude/Projects/Finance/FondoPensioneIBM/
  01_documenti_sito/        PDF scaricati da fondopensioneibm.it (fonti citate in questo documento)
  03_testi_estratti/        testo estratto dai PDF (utile per verificare le fonti)
  04_analisi/               sintesi, script del foglio Google, prezzi Yahoo grezzi
  05_miei_documenti/        file personali (CU, estratto conto, DettaglioOperazioni_6.xls): MAI nel repository
  06_webapp_spec/pac-vs-fp-spec/   questo pacchetto
```

Procedura (eseguita da Claude Code, che ha accesso in scrittura al repository):
1. Clonare `nine1zero/pac-vs-fp` e creare un branch, ad esempio `spec-v2`.
2. Copiare il pacchetto: `SPEC.md` e `docs/*.md` in `docs/`, `CLAUDE.md` nella radice, `data/` in `public/data/` (o `src/data/`), `reference/`, `tests/` e `design/` in `spec/`. Rinominare `.gitignore.suggested` in `.gitignore` (o unirlo a quello esistente).
3. **Prima del commit**, verificare che non entrino dati personali: niente `tests/private/`, niente `.xls` fuori da `tests/fixtures/`, niente PDF, niente `profilo*.json` (vedi CLAUDE.md).
4. Commit, push del branch e pull request; poi implementare per fasi (par. 8), una pull request per fase.

Il foglio Google originale dell'autore (privato, link nel file `tests/private/profilo_privato.json`) resta il riferimento visivo.

---

## 1. Vincoli non negoziabili

### 1.1 Privacy: tutto in locale
- **Nessun dato inserito o importato lascia il browser.** Calcolo, lettura del file e grafici avvengono in JavaScript lato client.
- Dopo il caricamento della pagina, nessuna chiamata di rete:
  - niente analytics, telemetria, font o CDN esterni, niente `fetch` verso domini terzi;
  - tutte le librerie sono incluse nel bundle;
  - i dati storici sono file statici serviti dallo stesso dominio.
- Meta tag Content-Security-Policy restrittivo: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'`.
- Il file contribuzioni si legge solo con `FileReader`/`File.text()` nel browser e non viene mai inviato.
- **Salvataggio automatico** (decisione dell'autore del 26/10/2026, sostituisce il pulsante "Salva i miei dati" del prototipo): ogni dato inserito si salva da solo in `localStorage`, dalla prima modifica, solo su questo dispositivo. Anche il file delle operazioni si salva, in una voce a parte (`pacfondo.v1.file`), e alla riapertura viene riletto. Finché non si inserisce nulla non si salva nulla. Nell'header uno stato "Salvato · gg/mm hh:mm" con tooltip "Restano solo su questo dispositivo, non vengono inviati a nessuno"; il pulsante **"Cancella tutto"** torna al profilo d'esempio e svuota la memoria, file compreso. Niente cookie.
- Link di condivisione dei parametri (hash dell'URL): opzionale, generato solo su richiesta, con avviso che contiene i valori inseriti (RAL, posizione). Non include mai dati del file importato.
- **Disclaimer all'apertura** (modale, da accettare una volta per sessione, poi richiamabile dal footer). Testo:

> **Questo strumento funziona interamente sul tuo dispositivo.** I dati che inserisci e il file delle contribuzioni che carichi non vengono inviati a nessun server: il calcolo avviene nel tuo browser e i dati e il file restano salvati solo nella memoria di questo browser, finché non premi "Cancella tutto".
>
> È una simulazione a scopo informativo, basata su dati storici pubblicati e su ipotesi modificabili. Non è una consulenza finanziaria, fiscale o previdenziale. I rendimenti passati non garantiscono quelli futuri. Verifica sempre i documenti ufficiali del tuo fondo pensione.
>
> [Ho capito, inizia]

- Footer fisso: "Calcolo 100% locale · nessun dato inviato · [Privacy] [Metodo e fonti] [Codice sorgente]".

### 1.2 Hosting
- Sito statico su GitHub Pages, repository `nine1zero/pac-vs-fp`, base path `/pac-vs-fp/`.
- Deploy con GitHub Actions: build, poi `actions/deploy-pages`.
- Funziona anche aperto da file locale dopo la build (`npm run build` e `npm run preview`).

### 1.3 Dati personali nel repository
- I default pubblici sono quelli di `data/profile_example.json`, un profilo inventato.
- Il profilo reale (`tests/private/profilo_privato.json`) si usa solo in locale, con "Importa profilo JSON", e non va mai committato.
- I test sui valori reali leggono il file privato solo se esiste (skip altrimenti).

---

## 2. Stack tecnico consigliato

- **Vite + TypeScript + React 18** (o Svelte, se Claude Code lo preferisce: l'importante è il modello in TypeScript puro, separato dalla UI).
- **Grafici: Apache ECharts** (npm `echarts`, incluso nel bundle). Serve per heatmap, linee con `markLine`/`markPoint`/`markArea` per evidenziare i pareggi, area impilata, waterfall, tooltip ricchi, animazioni e tema scuro.
- **Stile:** Tailwind CSS e componenti accessibili (Radix UI o equivalente). Font di sistema (`system-ui`, `Inter` incluso localmente se serve).
- **Ricerca parametri:** Fuse.js (incluso nel bundle) su `label`, `description`, `tags`, `id`.
- **Parsing del file contribuzioni:** `DOMParser` nativo (il file `.xls` è HTML, vedi par. 6). In opzione SheetJS da npm, per accettare anche un vero `.xlsx` con le stesse colonne.
- **Test:** Vitest (modello e parser, confronto con i golden), Playwright (end-to-end: drag & drop dei fixture, assenza di richieste di rete esterne).
- **Struttura:**

```
src/
  model/        flows.ts, simulate.ts, breakeven.ts, tax.ts, history.ts (puro, senza UI, 100% testato)
  import/       dettaglio.ts (parser + validazione)
  data/         caricamento JSON/CSV statici
  state/        store parametri (URL hash, localStorage opzionale, preset)
  ui/           pagine e componenti
  charts/       configurazioni ECharts
```

- **Prestazioni:**
  - i flussi annuali dipendono solo dai parametri, non dal differenziale: si calcolano una volta;
  - il valore del fondo per un differenziale qualsiasi si ottiene in forma chiusa (par. 4.5);
  - la mappa di convenienza 40×120 celle deve aggiornarsi in meno di 50 ms (Web Worker se serve);
  - aggiornamento in tempo reale mentre si muove uno slider (con `requestAnimationFrame` o un debounce di 16 ms).

---

## 3. Struttura dell'app e interfaccia

Principio: **semplice per chi entra, profondo per chi vuole**. Due livelli:
- **Vista semplice** (default): pochi input, risposta in una frase, un grafico principale.
- **Vista avanzata**: interruttore "Vista avanzata" nell'header, che mostra tutti i parametri, le tabelle anno per anno e gli strumenti di analisi.

Stile grafico: pulito e moderno.
- Molto spazio bianco, card con angoli arrotondati.
- Palette coerente: Scenario 1 blu `#2563EB`, Scenario 2 verde `#15803D`, Scenario 3 arancio `#C2410C` (tonalità scure per il contrasto AA del testo bianco; in modalità scura e nelle barre su fondo scuro usare `#60A5FA`, `#4ADE80`, `#FB923C`); storico fondo grigio scuro, benchmark viola, ETF azzurro.
- Modalità scura, responsive (mobile first), accessibilità AA: contrasto, focus visibile, slider usabili da tastiera, `aria-live` sul risultato principale.
- Numeri grandi e leggibili nelle card dei risultati; animazioni brevi sui cambi di valore.

### 3.0 Versione 2 dell'interfaccia (in vigore)

Riferimento: `design/v2/` (prototipi funzionanti, stile e comportamento). **Fa fede su 3.1-3.3**, che descrivono la prima versione e restano validi solo dove non sono in contrasto. I calcoli dei prototipi coincidono con `reference/model.py` (`tests/parity_prototype.js`), ma nell'app fa fede `src/model/`.

**Stile (design system "lime")**
- Fondo grigio caldo `#F4F4F2`, testo quasi nero `#0B0B0B`, un solo accento lime `#D4EE36`; font **Onest** (400/500/600/700), da includere nel bundle (CSP).
- Barra lime in alto con il disclaimer breve. Card bianche con raggio 20-24 px, pannelli `#F7F7F5`.
- Testo evidenziato in lime (classe `.mark`) per le parole chiave. Scenari: 1 blu `#2563EB`, 2 verde `#15803D`, 3 arancio `#C2410C`; fondo grigio `#3A3D42`, benchmark viola `#7C3AED`, ETF blu.

**Header**: logo "pac/fondo IBM", stato del salvataggio automatico e pulsante `Cancella tutto` (par. 1.1), badge "100% locale", link `Storico` e `Parametri e fonti`.

**Landing = simulatore a sezioni comprimibili** (`Landing.dc.html`):
- Titolo "Simulatore strategie **PAC ETF globale** vs Fondo Pensione IBM": "PAC ETF globale" apre un **menù a tendina dell'ETF**, usato in tutta la simulazione. Le voci sono confrontabili riga per riga (indice, società coperte, quota del mercato, numero di titoli, patrimonio, storia, TER):
  - Vanguard FTSE All-World UCITS ETF Acc, IE00BK5BQT80, TER 0,14% (**default**);
  - SPDR MSCI ACWI IMI UCITS ETF, IE00B3YLTY66, TER 0,17%;
  - iShares MSCI ACWI UCITS ETF Acc, IE00B6R52259, TER 0,20%.
  Sotto il titolo, un riquadro con l'ETF scelto (nome, ISIN, TER). Dati in `docs/FONTI.md` par. 4.
- Tre card che **spiegano le tre strategie** a confronto, senza numeri (testi nel prototipo).
- Barra di navigazione con le sezioni 0-6 e il loro stato (numero, ✓ fatto, attiva in lime).
- Sezioni, ognuna con intestazione, riepilogo di una riga, badge `Esempio`/`Dati tuoi` e pulsante `Apri`/`Modifica`/`Chiudi`:
  0. **Avvertenze**: indipendente, non è consulenza, calcolo locale.
  1. **Età e orizzonte**: anno di nascita (slider + chip), età di uscita (slider), **Come uscirai** (Pensione 15→9% / Riscatto 23%) sotto l'età. Il riepilogo indica la modalità: "Nato nel 1990 · uscita 2057 (pensione) · 31 anni".
  2. **Il tuo fondo**: drag & drop del DettaglioOperazioni. Dopo la lettura, l'area mostra **"N movimenti importati · competenza dal mm/aaaa al mm/aaaa"** e compare il pulsante **"Vedi i miei versamenti e il grafico"**, che apre la pagina G. Campi: posizione, anno di adesione, contributo minimo, azienda, TFR, **contributi non dedotti** (tooltip CU punto 419). Nota con la regola del minimo IBM (2% fino a 56.224 €, 7% oltre) e la stima calcolata dalla RAL.
  3. **Stipendio e risparmio**: RAL; risparmio annuo `Deduzione massima` / `Importo fisso`. L'importo fisso va dalla quota minima, che dipende dalla RAL, alla deduzione massima (FORMULE par. 4). La nota spiega che sotto la quota minima salterebbe lo scenario 1 e che oltre il limite ogni euro va nell'ETF. Riga con il **risparmio fiscale effettivo** sulla deduzione massima (FORMULE par. 2).
  4. **Ipotesi**: differenziale (slider e preset, incertezza storica), **rendimento ETF atteso prima del TER** con le scelte `Stima lungo periodo 7%` (default), `5 anni`, `10 anni`, `Dal lancio`. Le medie storiche sono dell'ETF scelto; "n.d." se la storia non basta. Nota che le medie recenti sono eccezionali.
  5. **Risultato**:
     - frase risposta e tre card con il capitale netto, bordo nel colore dello scenario, più spesso sulla migliore;
     - griglia 2×2: "Chi vince a ogni differenziale" e "Se esci nel… conviene"; poi una fascia a tutta larghezza **"Parametri dei grafici qui sotto"** con differenziale, rendimento ETF, età di uscita, RAL e pensione/riscatto; poi la mappa **"Per quanti anni conviene"** (A) e il grafico **"Capitale netto nei tre scenari e punti di pareggio"**;
     - il grafico del capitale ha due viste: **"Nel tempo"** (default; X = anno di uscita, Y = montante netto, pareggi tra anni consecutivi interpolati, FORMULE par. 9) e **"Al variare del differenziale"** (visualizzazione B). Punti di pareggio lime con etichetta ("Pareggio 1 = 2 nel 2039").
  6. **Assunzioni e fonti**: assunzioni in pillole e link alla pagina H.
- Se i dati sono stati salvati, la pagina si riapre con tutte le sezioni chiuse e le sezioni già fatte segnate.

**Pagina G "I miei versamenti"** (`Versamenti.dc.html`): riquadri versato da te / azienda / TFR / posizione oggi / stessi versamenti nell'ETF; grafico nel tempo con le tre componenti cumulate a strati, la linea della posizione reale e la linea dell'ETF, differenza in lime, tooltip mensile; scelta dell'ETF di confronto e "dentro il fondo" / "fuori, prima del 26%"; tabella dei movimenti con **colonna Tipologia** e **filtri a tendina per anno e tipologia** (con conteggi), totali e `Azzera filtri`; in fondo `← Torna al simulatore` (i dati sono già usati dal caricamento).

**Pagina F "Storico"** (`Storico.dc.html`): composizione del benchmark spiegata in chiaro (barra 45/45/10); scelta dell'ETF (dal primo anno disponibile) e del periodo (2012-2025, 2014-2025, ultimi 10, ultimi 5); riquadri delle medie; grafico "100 €" di fondo, benchmark ed ETF (prima/dopo l'imposta, distanza in lime); grafico delle tre componenti con il ricostruito e il pubblicato; barre annue fondo − ETF e fondo − benchmark; scomposizione del ritardo; statistiche; tabella ordinabile.

**Pagina H "Parametri e fonti"** (`Fonti.dc.html`): come H del par. 3.4, nello stile v2, con la scelta dell'ETF che aggiorna il TER.

### 3.1 Navigazione
Al primo accesso (o se l'utente non ha ancora completato il percorso) si apre il **percorso guidato** (par. 3.2); al termine si arriva al Simulatore. Il percorso resta richiamabile dall'header ("Rifai il percorso").

Header con: logo/titolo "PAC o Fondo pensione?", badge "Calcolo 100% sul tuo dispositivo", tab `Simulatore` · `Per quanti anni conviene` · `Storico` · `I miei versamenti` · `Parametri e fonti` · `Metodo`, interruttore Vista avanzata, interruttore tema.

### 3.2 Percorso guidato (primo accesso)

Riferimento visivo e di comportamento: `design/wizard_prototipo.dc.html` (prototipo funzionante; i calcoli del prototipo sono una versione semplificata, **nell'app fa fede `src/model/`**). Il prototipo carica il font Inter da Google Fonts solo per la revisione grafica: nell'app il font va incluso nel bundle (CSP del par. 1.1).

Obiettivo: arrivare al risultato in meno di due minuti chiedendo **solo le informazioni minime**, una domanda per schermata. Ogni passo si può saltare: i dati non inseriti restano quelli del profilo d'esempio anonimo (`data/profile_example.json`) e l'interfaccia lo dice sempre in chiaro.

**Layout (desktop, tre colonne; su mobile una colonna con rail orizzontale in alto e anteprima in fondo):**
- **Rail dei passi** a sinistra: numero, titolo e stato di ogni passo, cliccabile per tornare a qualsiasi passo.
  - Stati: `Da fare` (grigio), `Esempio` (grigio, passo visitato ma saltato), `Dati tuoi` (verde).
  - Sotto la rail, il **misuratore "Quanto è personalizzata"**: barra 0-5 con testo, ad esempio "3 dati su 5 sono tuoi; il resto usa il profilo d'esempio".
- **Card centrale** con la domanda del passo: etichetta "Passo N di 5 · Tema", titolo-domanda grande, input grandi, una frase di riscontro che traduce subito l'input in conseguenze (ad esempio "Uscita nel 2057: 31 anni di versamenti").
- **Anteprima in tempo reale** a destra (card scura): frase "Oggi vincerebbe lo scenario …", tre barre orizzontali dei capitali netti, nota con le ipotesi correnti. Si aggiorna a ogni input (`aria-live="polite"`).
- **Barra di navigazione** in fondo alla card: `Indietro` · `Salta, usa l'esempio` (link) · `Continua` (primario; all'ultimo passo `Vedi il risultato`). `Continua` segna il passo come "Dati tuoi"; `Salta` no.

**Passi:**

| # | Titolo | Contenuto | Parametri | Se saltato |
|---|---|---|---|---|
| 0 | Benvenuto | Titolo "Fondo pensione o PAC su un ETF globale? Scoprilo in due minuti", tre riquadri (I dati restano qui · Carica l'estratto · Ogni passo si salta), nota "non è consulenza". Pulsanti `Inizia` e `Mostrami subito un esempio` (va al risultato con il profilo d'esempio). Questo passo **sostituisce la modale di disclaimer** del par. 1.1 quando si entra dal percorso: premere un pulsante vale come "Ho capito". | — | — |
| 1 | Orizzonte | Anno di nascita (campo numerico grande) · età di uscita (slider 45-72 con etichetta "67 = pensione di vecchiaia"). Riscontro: anno di uscita e anni simulati. Nota: per un'uscita anticipata scegliere il riscatto al passo 5. | `birth_year`, `exit_age` | 1990, 67 |
| 2 | Il tuo fondo | **Drag & drop del file DettaglioOperazioni** (dropzone grande, tratteggiata, cliccabile, `accept=".xls,.html,.htm"`), lucchetto "Il file viene letto solo nel tuo browser e non viene salvato", indicazione di dove scaricarlo nell'area riservata. Dopo la lettura: banner verde "N movimenti letti, dal mm/aaaa al mm/aaaa", **checklist di validazione** (par. 6.2: colonne, somma = riga TOTALE, quote × valore quota = importo, valore quota più recente) con spunta verde o punto esclamativo giallo, e quattro riquadri con i valori estratti (posizione, tuo contributo, azienda, prima adesione). Errori bloccanti in rosso con `Riprova`. Alternative: `Prova con un file d'esempio` (carica `tests/fixtures/sample_dettaglio_ok.xls` servito come file statico pubblico) e `Inserisco i dati a mano` (cinque campi: posizione, prima adesione, contributo minimo, azienda, TFR). Pulsanti `Carica un altro file` e `Correggi i valori`. | `current_position`, `first_join_year`, `min_member_month`, `employer_month`, `tfr_month` (par. 6.3) | profilo d'esempio |
| 3 | Stipendio | RAL (campo grande, passo 500 €). Riquadro con l'aliquota marginale stimata e la frase "Ogni 100 € che deduci ti restituiscono circa X € di tasse". Campo "Contributi non dedotti da recuperare" con tooltip (CU punto 419; se non lo sai lascia 0). | `ral`, `recoverable_non_deducted` | 45.000 €, 0 |
| 4 | Risparmio | Due card-radio: `Quanto serve per la deduzione massima` (consigliato, mostra l'importo del primo anno) · `Un importo fisso` (apre il campo importo, cresce del 2% l'anno). Sotto, le tre card degli scenari con descrizione di una riga, nei colori standard. | `annual_saving` | deduzione massima |
| 5 | Ipotesi | Domanda "Quanto renderà il fondo rispetto a un ETF globale?". Chip di preset del differenziale (par. 3.3) con il valore, slider da −12% a +3% con valore grande, riquadro arancio con l'incertezza storica (anni in cui il fondo ha battuto l'ETF, media e intervallo al 95%, calcolati da `history.ts`). Slider del rendimento atteso dell'ETF e segmented control `Pensione` / `Riscatto (23%)`. | `delta`, `etf_gross_return`, `exit_mode` | storico 2014-2025, 7%, Pensione |
| 6 | Risultato | Frase risposta (par. 3.3 punto 1), tre card scenario con badge `Conviene` o differenza dal migliore, **striscia "Se esci nel… conviene"**: una cella per anno di uscita dal primo anno simulato all'anno di uscita, colorata con lo scenario migliore (anni prima dell'ultimo valutati come riscatto al 23%, ultimo anno con la modalità scelta; tooltip "2041: conviene lo scenario 2"), legenda dei colori, riquadro "Dove cambia la risposta" con le tre frasi di pareggio. Pulsanti `Cambia l'ipotesi` (torna al passo 5), `Rivedi i miei dati` (passo 1), `Tutti i parametri e le fonti`, e `Apri il simulatore completo`. | — | — |

**Regole:**
- I dati del passo 2 hanno la precedenza sul profilo d'esempio; se l'utente poi corregge a mano, vince la correzione.
- Lo stato del percorso (passo corrente, passi "Dati tuoi") vive in memoria; si salva in `localStorage` solo con il consenso del par. 1.1.
- Tastiera: Invio = `Continua`, Esc = `Indietro`; il focus va al titolo del passo a ogni cambio; la rail è una `nav` con `aria-current="step"`.
- Il percorso non chiede mai più di quanto serve: tutti gli altri parametri (fisco, costi, tecnici) restano nella pagina "Parametri e fonti" e nella vista avanzata.

### 3.3 Pagina "Simulatore"
Layout a due colonne su desktop, una su mobile.

**Colonna sinistra: "I tuoi dati"** (card con input box + slider, valori sincronizzati):
- Anno di nascita · Età di uscita (slider 40-75).
- RAL (input con formattazione €).
- Contributo minimo mensile tuo · Contributo azienda mensile · TFR mensile. Nota "Li trovi nell'estratto conto"; se è stato importato il file, pulsante "Usa i valori dell'ultimo versamento".
- Posizione attuale nel fondo.
- Contributi non dedotti recuperabili (CU punto 419), con un tooltip che spiega a cosa servono.
- Risparmio annuo: interruttore "Quanto serve per la deduzione massima" (default) oppure importo fisso.

**Card "Le ipotesi"**:
- **Differenziale fondo meno ETF**: slider da −12% a +3%, passo 0,1%, con chip di preset cliccabili sopra lo slider:
  - "Storico fondo 2014-2025" (−5,8%);
  - "Ultimi 10 anni" (−5,0%);
  - "Ultimi 5 anni" (−4,0%);
  - "Solo benchmark" (−4,8%);
  - "Fondo passivo globale" (0% o −0,3%, configurabile);
  - "Personalizzato".
  I valori dei preset si calcolano a runtime dai dati (par. 5), non sono scritti nel codice. Sotto lo slider, una mini-banda che mostra l'intervallo al 95% della media storica (da −9,8% a −2,5%) e i singoli anni come puntini: fa vedere quanto è incerto il dato.
- Rendimento atteso dell'azionario globale (slider 0-12%).
- Modalità di uscita: segmented control `Pensione` / `Riscatto o anticipazione (23%)`.

**Colonna destra: "Il risultato"**:
1. **Frase risposta** (grande, `aria-live`). Modello, con il profilo d'esempio:
   "Con un differenziale di **−5,8%** l'anno e uscita nel **2057**, conviene lo **scenario 1 – Minimo per l'azienda + PAC**: **521.785 €** netti, **36.325 €** più del peggiore."
2. **Tre card scenario** affiancate, ordinate per risultato. Ogni card contiene:
   - nome breve e icona;
   - capitale netto all'uscita e in euro di oggi;
   - differenza dal migliore;
   - quanto va ogni anno nel fondo e nel PAC;
   - contributo azienda totale;
   - risparmio IRPEF totale.
   La card migliore ha un bordo evidenziato e il badge "Conviene".
3. **Grafico principale: "Dove conviene cosa"** (vedi 3.4, visualizzazione A), in versione compatta con il punto "tu sei qui".
4. **Frasi sul pareggio**, una per coppia, generate dai dati (par. 4.6):
   - "Versare il massimo deducibile batte il minimo per l'azienda finché il fondo resta sotto l'ETF di meno di **3,6 punti** l'anno (profilo d'esempio)."
   - "Con il differenziale scelto, la deduzione massima conviene se esci **entro N anni (entro l'anno ...)**; oltre conviene versare il minimo e mettere il resto nel PAC."
5. Pulsante "Perché?" che apre il waterfall (visualizzazione D).

**Nomi standard degli scenari**, da usare ovunque:

| # | Nome breve | Descrizione |
|---|---|---|
| 1 | Minimo per l'azienda + PAC | Verso nel fondo solo il minimo per avere il contributo dell'azienda; il resto del risparmio e il rimborso IRPEF vanno nel PAC |
| 2 | Deduzione massima + PAC | Verso nel fondo fino al limite deducibile (5.300 €, più l'eventuale recupero); il rimborso IRPEF va nel PAC |
| 3 | Solo TFR + PAC | Nel fondo resta solo il TFR; tutto il risparmio va nel PAC; perdo il contributo dell'azienda |

In tutti e tre gli scenari la posizione attuale e il TFR restano nel fondo.

### 3.4 Visualizzazioni (le più importanti)

**A. Mappa di convenienza (heatmap): la visualizzazione chiave.**
- Asse X: anni di permanenza nel fondo (1 → anni fino alla pensione), con l'etichetta dell'anno di uscita. Asse Y: differenziale fondo meno ETF (da −12% a +3%).
- Ogni cella è colorata con il colore dello scenario migliore; l'intensità indica il margine sul secondo, in percentuale del capitale (scala logaritmica o a quantili).
- Sovrapposti:
  - le **tre curve di pareggio** (par. 4.6) come linee nette, con etichette in linea, ad esempio "Pareggio 2-1: sopra conviene la deduzione massima";
  - **linee orizzontali tratteggiate** per lo storico del fondo, lo storico del benchmark e il differenziale scelto;
  - un **mirino "Tu sei qui"** (anni di permanenza previsti × differenziale scelto).
- Tooltip su ogni cella: "Uscita nel 2040, differenziale −5%: scenario 2 = … €, scenario 1 = … €, scenario 3 = … €".
- Solo lettura (decisione dell'autore del 26/10/2026): la mappa si ricalcola a ogni cambio dei parametri, ma non li modifica; passando sopra una cella, o con le frecce, se ne leggono i valori.
- Modalità di uscita selezionabile direttamente sopra il grafico.
- Versione compatta sulla home, versione completa nella pagina "Per quanti anni conviene".

**B. Curve del capitale al variare del differenziale.**
- Tre linee (una per scenario), X = differenziale, Y = capitale netto all'uscita.
- `markPoint` sulle intersezioni, con etichetta testuale: "Pareggio 2 = 3 a −5,5%" (profilo d'esempio).
- `markArea` colorate in sottofondo che dividono l'asse X in zone "conviene 1 / 2 / 3".
- `markLine` verticali per storico e valore scelto.
- Interruttore "Mostra differenze": passa a tre linee di vantaggio (2−3, 1−3, 2−1) con linea dello zero evidenziata e etichette "sopra lo zero conviene ...".

**C. Corsa del capitale nel tempo.**
- Area impilata fondo + PAC per lo scenario selezionato (tab 1/2/3), con linee sottili degli altri due per confronto.
- Uno slider temporale con play/pausa anima gli anni.
- Asse Y opzionale in euro di oggi.

**D. Waterfall "Da dove viene la differenza"** (scenario A contro scenario B, selezionabili):
- contributi azienda guadagnati o persi;
- risparmio IRPEF reinvestito;
- rendimento in più o in meno sulla parte nel fondo (dovuto al differenziale);
- imposta d'uscita del fondo;
- imposte del PAC (26% e bollo);
- risultato netto.
Costruzione: scomposizione calcolata ripetendo la simulazione con un fattore alla volta neutralizzato. Mostrare la regola sotto il grafico.

**E. Slope chart "Il costo del ritardo"**: capitale dello scenario 2 con il differenziale scelto contro differenziale zero (fondo che rende come l'ETF). Etichetta: "rendimento lasciato sul terreno: X € (Y € di oggi)". Con il profilo d'esempio: 953.078 € contro 485.460 €.

**F. Pagina Storico**:
- Linee "100 € a fine 2011" per il fondo prima dell'imposta, il benchmark prima dell'imposta e l'ETF scelto (dal primo anno disponibile), con toggle netto/lordo.
- **Componenti del benchmark**: MSCI World, MSCI Europe, liquidità €STR (proxy ETF), benchmark ricostruito 45/45/10 e benchmark pubblicato. Una nota spiega l'ipotesi indice di prezzo (PI) contro indice con dividendi.
- Barre annuali "fondo − ETF" e "fondo − benchmark", con colore verde o rosso.
- **Scomposizione del ritardo** (waterfall), formule al par. 5.3:

| Componente | 2014-2025 |
|---|---|
| ETF globale contro benchmark ricostruito (pesi 45/45/10) | −2,1 punti l'anno |
| Benchmark ricostruito contro benchmark pubblicato | −2,7 punti l'anno |
| Gestore e costi contro benchmark pubblicato | −1,0 punti l'anno |
| **Totale** | **−5,8 punti l'anno** |

- Tabella annuale ordinabile ed esportabile in CSV.
- Card statistiche del differenziale: media, mediana, deviazione standard, intervallo al 95%, anni positivi su 14.
- **Comparto Assicurativo** contro inflazione e TFR (2018-2026): linee cumulate e barre del rendimento reale. Nota: "non è mai sceso in euro, ma dal 2018 ha perso circa il 2% di potere d'acquisto".

**G. Pagina "I miei versamenti"** (par. 6):
- Area drag & drop grande: "Trascina qui il file DettaglioOperazioni scaricato dall'area riservata del fondo (.xls)". Sotto, l'icona del lucchetto e il testo "Il file viene letto solo nel tuo browser".
- Report di validazione (verde/giallo/rosso).
- Tabella dei movimenti (virtualizzata, con filtri per tipo e anno).
- Riepilogo: totali per aderente, azienda, TFR, volontari e anticipazioni; posizione reale; stessi flussi nell'ETF dentro il fondo; stessi flussi nell'ETF fuori dal fondo.
- **Grafico**: posizione reale nel tempo (quote cumulate × valore quota a ogni data valore) contro la posizione "se fosse stato l'ETF", con la differenza evidenziata come area.
- Pulsante "Usa questi dati nel simulatore": precompila posizione attuale, contributi mensili dell'ultimo versamento e anno di prima adesione.

**H. Pagina "Parametri e fonti"** (compatta, ricercabile, ogni parametro spiegato con tooltip). Riferimento: `design/parametri_prototipo.dc.html`.
- **Barra strumenti fissa in alto** (sticky): ricerca in tempo reale (Fuse.js su etichetta, descrizione, fonte, tag, id; esempi nel placeholder: "deduzione, TFR, riscatto, TER, inflazione…"), casella `Solo i principali` (nasconde i parametri `advanced`), pulsante `Ripristina tutti (N)` attivo solo se ci sono modifiche. Sotto: chip dei gruppi con il numero di parametri visibili (`Tutti`, `Dati personali`, `Ipotesi di mercato`, `Fisco`, `PAC ETF`, `Fondo pensione`, `Tecnici`) e il contatore "N di 40 parametri · M modificati".
- **Una riga per parametro, alta circa 32 px**, in card per gruppo con intestazione compatta (nome del gruppo in maiuscoletto + numero). Quattro colonne:
  1. pulsante tondo **`i`** con tooltip (hover e focus da tastiera) che contiene etichetta in grassetto e `description` in linguaggio semplice; etichetta del parametro (una riga, ellissi); badge `avanzato` se serve;
  2. **valore** modificabile in linea (campo numerico allineato a destra, cifre tabellari, percentuali mostrate come 20 e non 0,2) con l'unità accanto; i valori non numerici (scaglioni IRPEF, nome ETF) sono testo; `exit_mode` è una select. Il campo modificato si colora d'ambra;
  3. **etichetta del tipo di fonte**, colorata, con tooltip che mostra il riferimento completo (`source`). Tipi: `Tuo dato` (verde), `Ipotesi` (ambra), `Calcolo storico` (indaco), `Doc. FPDDI` (blu), `Norma` (grigio), `Emittente` (rosa). Legenda dei tipi sopra le tabelle;
  4. pulsante `↺ default` solo se il valore differisce dal default (tooltip "Torna a …").
- Su mobile restano nome e valore; fonte e ripristino passano nel tooltip della `i`.
- Ricerca senza risultati: messaggio con suggerimenti ("tasse", "azienda", "rendimento").
- **Assunzioni del modello**: card finale con dieci pillole cliccabili, ciascuna con tooltip (stesso budget netto, rimborso IRPEF nel PAC, differenziale costante, costi già nel differenziale, contributi a metà anno, contributi +2% l'anno, uscita in capitale, riscatto anticipato al 23%, PAC tassato alla fine, norme fiscali 2026). I testi sono nel prototipo; vanno anche nella pagina Metodo (par. 10).
- Ogni parametro ha un **ancoraggio URL** (`#/parametri/deduction_limit`) e "copia link" nel tooltip: è il modo per ritrovarlo.
- Sezione "Preset salvati": salva o carica set di parametri con nome, in localStorage (solo con consenso) o come file JSON scaricabile.
- Sezione **"Fonti"**: elenco completo del par. 9 con nome del documento sul sito del fondo, data e link.
- I testi dei tooltip sono il campo `description` di `data/params.json` (compilato per tutti i 40 parametri); il tipo di fonte è il campo `source_kind`.

**I. Vista avanzata ("vista da nerd")**:
- Tutti i parametri di `params.json` modificabili, raggruppati, con slider e campo numerico.
- Tabella anno per anno di tutte le colonne del modello (par. 4.3), con esportazione CSV.
- Griglia di sensibilità (differenziale × rendimento ETF) per lo scenario migliore.
- Tabella dei pareggi per orizzonte (anni 1..N × tre coppie), con esportazione.
- Monte Carlo opzionale (fase 2):
  - estrazioni bootstrap degli anni storici 2012-2025 (rendimento ETF e differenziale dello stesso anno);
  - distribuzione del vantaggio del 2 sull'1 e del 2 sul 3;
  - fan chart dei percentili 5/25/50/75/95;
  - probabilità che ogni scenario sia il migliore.
- Pannello "Formule", con le formule del par. 4 (KaTeX, incluso nel bundle).

### 3.5 Testi e tono
Frasi brevi, numeri concreti, nessun gergo senza spiegazione. Glossario con tooltip: differenziale, deduzione, recupero contributi non dedotti, aliquota marginale, riscatto, TER, bollo, benchmark.

### 3.6 Fonti nei tooltip (obbligatorio)

Ogni numero mostrato che viene da un dato (non da un calcolo sull'input dell'utente) ha un'icona `i` o un'etichetta di fonte con tooltip, accessibile da tastiera, che riporta:
- per i dati del fondo: documento, pagina e, dove c'è, la citazione (`evidence` in `data/fpddi_azionario.json`; righe di `docs/FONTI.md`);
- per norme e fonti istituzionali: riferimento normativo e ente;
- per ETF e mercati: emittente o fornitore e data di rilevazione;
- per le ipotesi: l'etichetta `Ipotesi` e la ragione della scelta.

Il campo `source` di `data/params.json` è il testo del tooltip dei parametri. I valori calcolati (medie, differenziali, pareggi) hanno nel tooltip la formula in parole e il rimando a `docs/FORMULE.md`. Nessun numero senza fonte: se manca, il test di accettazione 7 fallisce.

---

## 4. Modello di simulazione (fa fede `reference/model.py`)

### 4.1 Notazione e parametri
Tutti i parametri sono in `data/params.json` (id tra parentesi). Le percentuali sono frazioni (0,02 = 2%).

- Anno di uscita `Y_exit = birth_year + exit_age`. Anni simulati `n = Y_exit − start_year + 1` (default `start_year` = 2027). Indice dell'anno `k = 1..n`, anno di calendario `y_k = start_year + k − 1`.
- Fattore di crescita `g_k = (1 + growth)^(k−1)`.
- Rendimento ETF dopo il TER: `r_e = etf_gross_return − etf_ter`. `etf_gross_return` è **prima del TER**; le medie storiche degli ETF (già nette del TER) si convertono sommando il TER. `etf_ter` segue l'ETF scelto (default Vanguard 0,14%).
- Rendimento del fondo prima dell'imposta: `r_f = r_e + δ`, dove `δ = delta` (differenziale). Netto annuo: `r_n = r_f · (1 − fund_return_tax)`.
- Frazione d'anno sui versamenti: `φ = contribution_year_fraction` (0,5).

**Risparmio fiscale di una deduzione** (`tax_saving` in `reference/model.py`, dettagli e fonti in `docs/FORMULE.md` par. 2):
- reddito di lavoro dipendente `r = RAL − 9,19%·RAL − 1%·max(0, RAL − 56.224)`;
- imposte `T(r)` = IRPEF a scaglioni 2026 − detrazione per lavoro dipendente (art. 13 TUIR) − ulteriore detrazione del cuneo (L. 207/2024) + addizionale regionale a scaglioni + comunale; per `r ≤ 20.000 €` si toglie prima la somma esente del cuneo;
- risparmio `= T(r) − T(r − D)`, calcolato ogni anno con la retribuzione dell'anno `RAL·g_k`. Con contributi in busta paga (default) la deduzione riduce anche il reddito complessivo su cui si calcolano detrazioni e cuneo (art. 51 c. 2 lett. h TUIR).
- **Non** usare `D × aliquota marginale`: per il profilo d'esempio darebbe 35,4% invece del 54,2% corretto.

**Aliquota all'uscita** per l'anno di uscita `Y` e la modalità `m`:
- se `m = Riscatto`: `t_exit = redemption_tax` (23%);
- se `m = Pensione`: `t_exit = max(exit_tax_min, exit_tax_max − exit_tax_reduction · max(0, (Y − first_join_year) − exit_tax_threshold_years))`.

### 4.2 Flussi anno per anno (uguali per ogni differenziale)
Per ogni k:
- `E_k = min_member_month · months · g_k` (contributo minimo dell'aderente)
- `F_k = employer_month · months · g_k` (contributo dell'azienda, solo se l'aderente versa almeno `E_k`)
- `G_k = tfr_month · months · g_k` (TFR)
- `H_1 = recoverable_non_deducted`; `H_{k+1} = max(0, H_k − V_k)` (residuo recuperabile)
- `I_k = min(recovery_cap, H_k)` se `first_join_year + 5 ≤ y_k ≤ first_join_year + 24`, altrimenti 0 (recupero usabile)
- `J_k = max(E_k, deduction_limit + I_k − F_k)` (versamento dell'aderente per la deduzione massima)
- `K_k = J_k` se `annual_saving` è vuoto, altrimenti `min(J_k, max(minimo_k, annual_saving · g_k))` con `minimo_k = max(E_k, 2%·min(RAL·g_k, 56.224) + 7%·max(0, RAL·g_k − 56.224))` (risparmio annuo, **uguale nei tre scenari**, tra la quota minima per il contributo dell'azienda e la deduzione massima)

**Scenario 1 – Minimo per l'azienda + PAC**
- `L = E_k`
- `M = F_k` se `L ≥ E_k`, altrimenti 0
- `N = max(0, min(L, deduction_limit − M))` (parte dedotta del versamento dell'aderente)
- `O = risparmio(RAL·g_k, N)` (risparmio fiscale)
- `P¹ = max(0, K_k − L + O)` (nel PAC)
- `Q¹ = L + M + G_k` (nel fondo)
- `R¹ = N + M + G_k` (base tassabile all'uscita aggiunta)

**Scenario 2 – Deduzione massima + PAC**
- `S = max(E_k, min(J_k, K_k))`
- `T = F_k` se `S ≥ E_k`, altrimenti 0
- `U = max(0, min(S, deduction_limit + I_k − T))`
- `V_k = max(0, U + T − deduction_limit)` (recupero usato)
- `W = risparmio(RAL·g_k, U)`
- `P² = max(0, K_k − S + W)`
- `Q² = S + T + G_k`
- `R² = U + T + G_k`

**Scenario 3 – Solo TFR + PAC**
- `P³ = K_k`
- `Q³ = G_k`
- `R³ = G_k` (nessun contributo dell'aderente o dell'azienda, nessun risparmio IRPEF)

Note:
- Il risparmio IRPEF si reinveste nel PAC nello stesso anno, come se la deduzione fosse applicata in busta paga.
- I contributi non dedotti sono esclusi dalla base tassabile all'uscita.
- Le parti non dedotte (eccedenze) non sono mai positive con i default.

### 4.3 Valori nel tempo (per scenario s, orizzonte h ≤ n)
- Fondo: `Fond_0 = current_position`; `Fond_k = Fond_{k−1}·(1 + r_n) + Q^s_k·(1 + r_n)^φ`
- Base tassabile: `B_0 = current_taxable_base`; `B_k = B_{k−1} + R^s_k`
- PAC: `V_1 = P^s_1·(1 + r_e)^φ`; per `k ≥ 2`: `V_k = V_{k−1}·(1 + r_e)·(1 − stamp_duty) + P^s_k·(1 + r_e)^φ`
- Versato nel PAC: `C_k = Σ P^s`
- All'uscita dopo h anni (anno `Y = start_year + h − 1`):
  - fondo netto `= Fond_h − t_exit(Y, m)·B_h`
  - PAC netto `= V_h − capital_gain_tax · max(0, V_h − C_h)`
  - **capitale netto** `= fondo netto + PAC netto`
  - in euro di oggi `= capitale netto / (1 + inflation)^(Y − base_year_real)` (default 2026)

Colonne della tabella anno per anno (vista avanzata), in ordine:
- dati comuni: `k, anno, E, F, G, H, I, J, K`;
- per ogni scenario: versamento aderente, azienda, quota dedotta, risparmio IRPEF, nel PAC, nel fondo, base aggiunta (e recupero usato per lo scenario 2);
- valori: fondo, base cumulata, PAC, versato PAC, fondo + PAC.

### 4.4 Uscita anticipata
Per un orizzonte `h < n` si interrompe la simulazione dopo h anni e si applica `t_exit(Y, m)`. Nella pagina "Per quanti anni conviene" il default è `m = Riscatto` (uscita prima della pensione), con un selettore per `Pensione`. Mostrare la nota: "Il riscatto totale per dimissioni senza i requisiti dell'art. 14 D.Lgs. 252/2005 è tassato al 23%; le anticipazioni per ulteriori esigenze sono possibili dopo 8 anni, fino al 30% della posizione, sempre al 23%."

### 4.5 Forma chiusa (per sensibilità e mappa)
Poiché i flussi non dipendono da δ, posto `a = 1 + (r_e + δ)·(1 − fund_return_tax)`:

`Fond_h(δ) = Fond_0 · a^h + Σ_{k=1..h} Q^s_k · a^(h − k + φ)`

PAC, versato e base tassabile non dipendono da δ. Verifica obbligatoria nei test: la forma chiusa coincide con la ricorsione al centesimo.

### 4.6 Punti di pareggio
Per una coppia di scenari (A, B), un orizzonte h e una modalità m, il pareggio è il δ* tale che `Netto_A(δ*) = Netto_B(δ*)`.

- La differenza `D(δ) = Netto_A − Netto_B` cresce con δ per le coppie (2,3), (1,3) e (2,1), perché A mette più nel fondo di B. Il valore della posizione attuale si annulla nella differenza.
- Calcolo con la **bisezione** su `[−0,95; +0,50]`, 60-80 iterazioni, oppure con Newton protetto. Si usa solo la parte del fondo che dipende da δ: `D(δ) = Σ_k (Q^A_k − Q^B_k)·a^(h−k+φ) − t_exit·(B^A_h − B^B_h) + (PACnetto^A_h − PACnetto^B_h)`.
- Se `D(−0,95) > 0` → "A conviene sempre". Se `D(+0,50) < 0` → "A non conviene mai".
- Lettura: **se il differenziale reale è sopra δ*, conviene A; se è sotto, conviene B.**
- **Orizzonte di pareggio** con il δ scelto: il primo h per cui `δ*(h) > δ`. La frase sarà: "A conviene se esci entro h−1 anni (entro l'anno ...); oltre conviene B". Se non esiste: "A conviene per qualsiasi uscita fino al Y_exit".
- La mappa A del par. 3.4 si calcola con la forma chiusa su una griglia di δ (passo 0,25 punti) × h, e le curve con la bisezione per ogni h.

### 4.7 Valori di controllo (golden)
- `tests/golden_model_example.json`, profilo pubblico (`reference/model.py` DEFAULTS). Con δ = −5,808330715699661% e uscita a pensione:
  - capitale netto [S1, S2, S3] = [521.784,98; 485.459,81; 493.509,33];
  - pareggi [2-3, 1-3, 2-1] = [−5,4825%; −9,2812%; −3,6063%];
  - risparmio fiscale effettivo sulla deduzione massima del primo anno (4.390 €): 54,2403%.
  Sono incluse anche le curve di pareggio per riscatto a 1, 5, 10, 20 e 30 anni, la prima riga dei flussi e i controlli fiscali per sei livelli di RAL (`tax_checks`). Si rigenera con `python3 tests/make_golden.py`, solo per modifiche volute del modello, da annotare in `docs/CHANGELOG.md`.
- `tests/private/profilo_privato.json` (solo in locale): profilo reale dell'autore e valori di controllo coincidenti con il Google Sheet. Non citarne i numeri nel repository.
- Tolleranza: 0,01 € sui capitali, 1e-6 sui differenziali di pareggio.

---

## 5. Calcoli storici (fa fede `reference/history.py`)

### 5.1 Rendimenti annui
Fonte: `data/fpddi_azionario.json` (anni 2012-2026; il 2026 va da gennaio ad agosto ed è escluso dalle medie).
- Fondo prima dell'imposta: `fund_net / (1 − fund_tax_rate)`. Le aliquote sono: 11% nel 2012-2013, 11,5% nel 2014, 20% dal 2015. Vale anche negli anni negativi, perché il fondo registra un credito d'imposta.
- Benchmark prima dell'imposta: `benchmark_net / (1 − fund_tax_rate)`.
- ETF e componenti: `prezzo(fine periodo) / prezzo(31/12 anno precedente) − 1`, usando `data/etf_monthly.csv`. La fine periodo è il 31/12, oppure il 31/08/2026 per il 2026.
- Benchmark ricostruito: `0,45·MSCI World + 0,45·MSCI Europe + 0,10·€STR`, ribilanciato ogni anno.
- Indici "100 a fine 2011": prodotto cumulato.

### 5.2 Statistiche (da mostrare e usare come preset)
- Media annua composta (CAGR) per finestre configurabili: 2012-2025, 2014-2025, ultimi 10 e ultimi 5 anni.
- Differenziale del fondo contro l'ETF = CAGR(fondo prima dell'imposta) − CAGR(ETF). Allo stesso modo per il benchmark.
- Sui differenziali annui 2012-2025 (fondo prima dell'imposta − ETF):
  - media aritmetica −6,16%, mediana −6,82%;
  - deviazione standard 6,96%, errore standard 1,86%;
  - intervallo al 95% della media [−9,81%; −2,51%];
  - anni positivi: 3 su 14.
- Valori attesi in `tests/golden_history.json`:
  - 2014-2025: fondo prima dell'imposta 5,454%, benchmark prima dell'imposta 6,460%, ETF 11,263%;
  - delta del fondo −5,808%, delta del benchmark −4,803%.

### 5.3 Scomposizione del ritardo, 2014-2025
In punti l'anno, CAGR su CAGR:
- `ricostruito − ETF` = −2,1 (pesi del benchmark: Europa al 45% e 10% di liquidità);
- `pubblicato prima dell'imposta − ricostruito` = −2,7 (ipotesi: indici di prezzo senza dividendi e altri scostamenti; da confermare col fondo);
- `fondo prima dell'imposta − pubblicato prima dell'imposta` = −1,0 (gestore e costi).

### 5.4 Comparto Assicurativo
Da `data/fpddi_assicurativo.json`. Cumulato 2018-2025:

| Voce | Totale | Media annua |
|---|---|---|
| Assicurativo netto | +18,0% | 2,09% |
| ISTAT | +20,4% | 2,35% |
| TFR netto | +24,0% | |
| Comparto Azionario netto | +45,6% | |

Rendimento reale cumulato dell'Assicurativo: −2,0% (−7,2% nel 2021-2025). I valori GESAV dal 1999 al 2017 sono lordi: mostrarli solo come informazione, con la nota relativa.

---

## 6. Import del file contribuzioni (drag & drop)

### 6.1 Formato
Il file `DettaglioOperazioni_*.xls` si scarica dall'area riservata FPDDI (gestita da Previnet).
- **Non è un vero file Excel:** è una tabella HTML (`<table><thead>…<tbody>…<tfoot>`), in UTF-8, con commenti Angular (`<!-- ngIf: ... -->`) e attributi `pnet-i18n`.
- Va letto con `DOMParser`: righe `tbody tr`, intestazioni `thead th`, riga dei totali `tfoot tr`.

Intestazioni attese, nell'ordine (il confronto va fatto sul testo ripulito dagli spazi):

```
Tipo Operazione | Data Operazione | Data Competenza | Cod Fiscale Azienda | Denominazione Azienda |
Importo Lordo Aderente | Importo Lordo Azienda | Tfr | Altro | Quota Associativa | Importo Netto |
Comparto | Numero Quote | Valore Quota | Data Valore Quota
```

- "Quota Associativa" può mancare (`ng-if="conf.spesePresent"`).
- Comparto, Numero Quote, Valore Quota e Data Valore Quota mancano per i fondi solo assicurativi (`!conf.isFondoAssicurativo`). In quel caso l'import funziona in modalità ridotta, senza il confronto con l'ETF basato sulle quote.

Formati dei valori:
- Numeri all'italiana: `1.002,32`, `-36.504,71`, `-2.195,508`. Si tolgono i punti e la virgola diventa punto.
- Date `gg/mm/aaaa`.
- Valori speciali: "In attesa del val. quota" in Data Operazione; celle vuote.

Valori noti di "Tipo Operazione":

| Tipo | Trattamento |
|---|---|
| `Contributo` | Versamento |
| `Ctrb. una tantum` | Versamento volontario |
| `Anticipazione` | Importo negativo, uscita |
| `Concambio in` / `Concambio out` | Fusione di comparti, da escludere dal confronto |
| `Contr. non investito` | Liquidità in attesa, si aggiunge a entrambi i lati |

Altri valori: warning, riga mostrata ma esclusa. Il `tfoot` contiene la riga `TOTALE`, con i totali di Aderente, Azienda, TFR, Altro, Quota associativa e Importo netto.

### 6.2 Validazione (report mostrato all'utente)
Errori bloccanti (rosso):
- nessuna tabella trovata;
- mancano le colonne obbligatorie (Tipo Operazione, Data Competenza, Importo Lordo Aderente, Importo Lordo Azienda, Tfr, Altro, Importo Netto);
- più del 5% delle righe ha numeri o date non leggibili.

Avvisi (giallo):
- **controllo totali**: la somma delle righe per ogni colonna deve coincidere con `TOTALE` entro 0,01 € (fixture `sample_dettaglio_bad_totals.xls`);
- **controllo per riga**: `Aderente + Azienda + Tfr + Altro − Quota associativa = Importo netto` entro 0,01 €;
- **controllo quote**: `|Numero Quote × Valore Quota − Importo Netto| ≤ 0,05 €` per le righe con quote;
- tipi sconosciuti;
- date fuori dal periodo 1987 → oggi;
- prezzo ETF non disponibile per una data (prima del 12/2011 o oltre l'ultimo mese).

Esito positivo (verde): "N movimenti letti, dal mm/aaaa al mm/aaaa, totali coerenti con il file".

### 6.3 Calcoli dal file
- **Posizione reale** = Σ Numero Quote del comparto AZIONARIO × valore quota alla data di valutazione + Σ `Contr. non investito`.
  - Data di valutazione e valore quota sono l'ultima `Data Valore Quota` e il relativo `Valore Quota` del file, modificabili in vista avanzata.
  - Se l'utente ha comparti misti, il calcolo si fa per comparto.
- **Stessi flussi nell'ETF dentro il fondo** (stessa imposta annua del fondo). Per ogni riga inclusa con data valore d nell'anno y:
  - `valore = Importo Netto · (1 + (P(fine y)/P(d) − 1)·(1 − t_y)) · NI(fine periodo) / NI(fine y)`
  - `P(d)` = prezzo ACWI EUR del mese di d (fine mese, `EOMONTH`);
  - `t_y` = aliquota dell'anno;
  - `NI(y) = Π_{j ≤ y} (1 + r_ETF,j·(1 − t_j))`.
- **Fuori dal fondo, prima del 26%**: `Importo Netto · P(valutazione)/P(d)`.
- **Serie nel tempo** (grafico G): per ogni fine mese, la posizione reale (quote cumulate × valore quota dell'ultimo movimento noto in quella data) e la posizione con l'ETF.
- Valori attesi:
  - `tests/golden_fixture_ok.json` per il fixture sintetico: 43 movimenti, valore quota dell'ultimo movimento 20,930, posizione reale 18.751,61; ETF dentro il fondo 20.691,45; fuori prima del 26% 21.983,58;
  - `tests/private/profilo_privato.json` per il file reale (solo in locale).
- **Precompilazione dal file**:
  - anno di prima adesione = anno della `Data Competenza` più vecchia;
  - contributi mensili = valori dell'ultima riga `Contributo` di un mese non di dicembre;
  - posizione attuale = posizione reale.

---

## 7. Stato, preset e ricerca dei parametri
- Store unico tipizzato, generato da `params.json`. Ogni parametro ha: `id`, `label`, `group`, `unit`, `default`, `min`, `max`, `step`, `advanced`, `source`, `description`, `tags`.
- Ordine di priorità dei valori: URL hash (se presente) > localStorage (salvataggio automatico) > profilo importato > default.
- Preset del differenziale calcolati dai dati storici (par. 5.2), con etichetta e valore visibili.
- Preset utente: salva, rinomina, elimina, esporta/importa JSON (`{ version, name, values: {id: value} }`), con validazione dei limiti.
- Pulsanti globali: "Ripristina tutto", "Esporta parametri", "Importa profilo", "Dimentica i miei dati".
- Ricerca globale (`Ctrl/Cmd+K`): trova parametri, pagine e voci del glossario; Invio porta al campo e lo evidenzia.

---

## 8. Criteri di accettazione
1. **Modello:** i test Vitest riproducono `golden_model_example.json` e, se presente, `tests/private/profilo_privato.json`, con le tolleranze del par. 4.7. La forma chiusa coincide con la ricorsione.
2. **Storico:** riproduce `golden_history.json`.
3. **Import:**
   - `sample_dettaglio_ok.xls` → esito verde e valori di `golden_fixture_ok.json`;
   - `sample_dettaglio_bad_columns.xls` → errore rosso "manca la colonna Numero Quote" (in modalità ridotta: avviso);
   - `sample_dettaglio_bad_totals.xls` → avviso sul totale Aderente.
4. **Privacy:** test Playwright che intercetta tutte le richieste: dopo il caricamento non ce ne sono verso domini diversi da `nine1zero.github.io`, anche durante l'import e l'uso degli slider. Lighthouse: Best Practices ≥ 95, Accessibility ≥ 95.
5. **Reattività:** cambiando uno slider, la frase risposta, le card e i grafici si aggiornano in meno di 100 ms su un portatile medio.
6. **Chiarezza:** in home, senza aprire altro, si leggono lo scenario migliore, di quanto vince, il differenziale di pareggio per ogni coppia e l'orizzonte di pareggio con il differenziale scelto.
7. **Parametri:** ogni numero usato dal modello compare nella pagina "Parametri e fonti" con la sua fonte, ed è ricercabile; ogni riga ha il tooltip con la spiegazione e il tooltip con la fonte, accessibili anche da tastiera.
8. **Percorso guidato:** test Playwright che (a) completa i 6 passi saltandoli tutti e ottiene i valori golden del profilo d'esempio; (b) trascina `sample_dettaglio_ok.xls` al passo 2 e trova nel risultato posizione e contributi di `golden_fixture_ok.json`; (c) verifica che il misuratore "Quanto è personalizzata" conti solo i passi confermati.
9. Build e deploy automatici su GitHub Pages; README con istruzioni, licenza MIT, avvertenze.
10. **Fonti:** ogni numero che viene da un dato ha il tooltip della fonte (par. 3.6); un test controlla che ogni parametro di `params.json` abbia `source` e `source_kind` e che ogni anno di `fpddi_azionario.json` abbia `evidence`.
11. **Coerenza con il riferimento:** il modello TypeScript coincide al centesimo con `reference/model.py` anche sui casi di `tests/parity_prototype.js` (importo fisso, RAL bassa e alta, riscatto) e sui `tax_checks`.

---

## 9. Fonti (da mostrare nella pagina "Parametri e fonti")

Elenco completo, con file, pagine e citazioni: **`docs/FONTI.md`** (fa fede). Qui sotto il riepilogo per la pagina.

**Documenti del fondo** (sito https://www.fondopensioneibm.it; copie locali in `01_documenti_sito/`):

| Documento sul sito | File locale | Dati usati |
|---|---|---|
| Rendimenti dei Comparti – "Comparto Azionario" | `comp_azionario.pdf` | Rendimento netto, benchmark netto, valore quota, cumulato dal 2009, 2018-2026 |
| Rendimenti dei Comparti – "Comparti assicurativi GESAV, Euroforte RE, RISPAV e Genris" | `comp_assicurativo.pdf` | Rendimenti netti, ISTAT, rivalutazione TFR, costi delle gestioni, 2018-2026 |
| Bilanci di esercizio 2012-2017 | `bilancio12.pdf` … `bilancio17.pdf` | Rendimento netto del fondo e del benchmark, cumulati |
| Bilancio di esercizio 2011 | `bilancio11.pdf` | Rendimenti lordi 2009-2011; nuovo benchmark dal 2012 |
| Bilanci 1999-2025 | `bilancio99.pdf` … `bilancio25.pdf` | Storico GESAV (1999-2008 scansioni lette con OCR), patrimonio, oneri |
| Documento sulla politica di investimento | `politica_investimento.pdf` | Benchmark 45/45/10 e codici Datastream, commissioni 0,24% + 10%, mandato, statistiche sugli iscritti |
| Scheda costi (dall'01/01/2026) | `scheda_costi.pdf` | ISC del comparto Azionario (0,29% a 10 anni) |
| Nota informativa (e "Destinatari e contributi") | `nota_informativa.pdf`, `nota_informativa_destinatari_e_contributi.pdf` | TER, aliquote contributive |
| Schemi contributivi 2026 | `schemi_contributivi.pdf` | Percentuali aderente/azienda, fascia INPS 56.224 € |
| Regime fiscale | `regime_fiscale.pdf` | Deducibilità 5.300 €, recupero 2.650 €, tassazione delle prestazioni |
| Comunicazione contributi non dedotti | `com_contributi_non_dedotti.pdf` | Obbligo di comunicazione entro il 31/12 dell'anno successivo |
| Accordo aziendale 04/07/2023 | `04072023.pdf` | Contributo dell'azienda uguale per tutti dal 2024 (non incluso nel pacchetto; schema confermato dalla Nota informativa 2026 p. 9) |

**Norme:**
- D.Lgs. 252/2005: art. 8 (deducibilità e recupero), art. 11 (tassazione delle prestazioni e delle anticipazioni), art. 14 (riscatti), art. 17 (imposta sui rendimenti).
- L. 190/2014, art. 1, c. 621 (imposta al 20%).
- L. 199/2025 (Legge di bilancio 2026: scaglioni IRPEF, limite di deducibilità).
- Art. 13 TUIR (detrazione per lavoro dipendente); art. 51 c. 2 lett. h TUIR (contributi in busta paga); L. 207/2024 art. 1 cc. 4-6 (cuneo fiscale).
- Circolare INPS n. 6/2026 (prima fascia pensionabile 56.224 €); L. 438/1992 art. 3-ter (1% oltre la fascia).
- Regione Lombardia, addizionale regionale (l.r. 10/2003 art. 72); D.Lgs. 360/1998 (addizionale comunale, massimo 0,8%).
- D.L. 201/2011, art. 19 (bollo 0,20%).
- D.L. 66/2014 (26% sui redditi finanziari).

**Mercati:**
- Yahoo Finance, serie giornaliere ISAC.L, EURUSD=X, EUNL.DE, EUNK.DE, XEON.DE, scaricate il 21/10/2026 (`etf_monthly.sources.json`).
- Schede prodotto iShares (IE00B6R52259, IE00B4L5Y983, IE00B4K48X80), Xtrackers (LU0290358497), Vanguard (IE00BK5BQT80, IE00B3RBWM25), SPDR (IE00B3YLTY66). Yahoo Finance VGWL.DE e SPYI.DE (`etf_annual_extra.json`). Finanzfluss ed extraETF per TER, titoli, patrimonio e medie storiche (20-23/10/2026).
- J.P. Morgan Asset Management, Long-Term Capital Market Assumptions 2026 (azionario globale 7% annuo in USD).
- FTSE Russell e MSCI, schede degli indici (quota del mercato coperta).

**Studi** (pagina Metodo):
- SPIVA Europe Mid-Year 2026, S&P Dow Jones Indices: 97,7% dei fondi attivi azionari globali in euro sotto il benchmark a 10 anni.
- W. Sharpe, *The Arithmetic of Active Management*, Financial Analysts Journal, 1991.
- E. Fama e K. French, *Luck versus Skill in the Cross-Section of Mutual Fund Returns*, Journal of Finance, 2010.
- K. French e J. Poterba, *Investor Diversification and International Equity Markets*, American Economic Review, 1991 (home bias).
- COVIP, Relazione annuale e dati sui rendimenti; ISC medi a 10 anni: negoziali 0,49%, aperti 1,35%, PIP 2,17%.

---

## 10. Limiti da dichiarare nella pagina Metodo
- Differenziale e rendimenti costanti nel tempo, salvo il Monte Carlo in vista avanzata.
- Norme fiscali 2026 per tutto l'orizzonte (scaglioni non indicizzati); non modellati trattamento integrativo, detrazioni per familiari, esenzioni comunali.
- TFR sempre nel fondo; nessun cambio di datore di lavoro.
- Uscita in un'unica soluzione: niente rendita o RITA, e nessun limite del 60% in capitale.
- La parte tassabile della posizione attuale è una stima dell'utente.
- I benchmark MSCI e JPM sono approssimati con ETF; l'ipotesi "indice di prezzo" va confermata dal fondo.
- I dati del 2026 sono parziali (gennaio-agosto).
