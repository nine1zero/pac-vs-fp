# Verifiche su dati, formule e calcoli (23/10/2026)

Registro delle verifiche fatte: cosa è stato controllato, come, e cosa è cambiato. Da aggiornare a ogni revisione.

## 1. Dati del fondo

| Controllo | Esito |
|---|---|
| Rendimenti netti 2014-2017 di fondo e benchmark contro il testo dei bilanci (citazione e pagina in `data/fpddi_azionario.json`) | Coincidono |
| Rendimenti 2016-2025 contro la [Nota informativa 2026](https://www.fondopensioneibm.it/docs/nota_informativa.pdf), Tav. 4 (grafico, p. 24, letto dall'immagine della pagina) | Coincidono |
| Medie composte ricalcolate contro la Tav. 5 della [Nota informativa](https://www.fondopensioneibm.it/docs/nota_informativa.pdf) | Fondo 3/5/10 anni: 9,92 / 6,90 / 4,78, esatte. Benchmark 3/5 anni: 9,73 / 7,20, esatte. **Benchmark 10 anni: la Tav. 5 dice 5,23%, i valori annui della Tav. 4 danno 5,03%**: incoerenza interna al documento del fondo. Usiamo i valori annui |
| Rendimento "alla data" (dal 2009) di bilanci 2014-2017 e [tabella web 2018-2025](https://www.fondopensioneibm.it/docs/comp_azionario.pdf) | Coerente anno su anno con i rendimenti annui del fondo |
| Valore quota di fine anno 2018-2025 | Il rapporto tra valori quota coincide con il rendimento annuo pubblicato |
| "Benchmark alla data" dei bilanci 2015-2017 | Non coerente con i benchmark annui degli stessi paragrafi (35,52% → 39,64% implicherebbe 3,04%, non 2,86%). Usiamo i valori annui, confermati dalla Tav. 4 |
| Rendimenti 2012 e 2013 | Verificati su [`bilancio12.pdf`](https://www.fondopensioneibm.it/docs/bilancio12.pdf) (p. 14 e Sez. 4.2.3 p. 39: fondo +4,09%, benchmark +2,38%, quota 10,624 €) e [`bilancio13.pdf`](https://www.fondopensioneibm.it/docs/bilancio13.pdf) (p. 14 e Sez. 4.2.3 p. 35: fondo +9,83%, benchmark +14,05%, quota 11,668 €) |
| Rendimenti e quote 2009-2011 | Verificati su [`bilancio10.pdf`](https://www.fondopensioneibm.it/docs/bilancio10.pdf) (p. 24), [`bilancio11.pdf`](https://www.fondopensioneibm.it/docs/bilancio11.pdf) (p. 24) e [`bilancio16.pdf`](https://www.fondopensioneibm.it/docs/bilancio16.pdf) (p. 11): quota iniziale 10,000 € a inizio 2009; quote nette 10,818 (+8,18%), 11,070 (+2,33%) e 10,207 (−7,80%). I cumulati `Quota(t)/10 − 1` sono interamente netti fin dall'avvio |
| Imposta sostitutiva effettiva (Conto Economico Sez. 4.2.2, [Bilanci 2010–2025](https://www.fondopensioneibm.it/bilanci.htm)) | Verificata: il comparto Azionario detiene 0,00% di titoli di Stato (Tav. 1 [Nota informativa](https://www.fondopensioneibm.it/docs/nota_informativa.pdf) p. 9) e il rapporto effettivo `Imposta sostitutiva / Margine gestione finanziaria` negli anni positivi è 11,00% (2009–2013), 11,51% (2014) e 19,98%–20,03% (2015–2025; es. nel [Bilancio 2025](https://www.fondopensioneibm.it/docs/bilancio25.pdf): 998.083 € / 4.995.691 € = 19,98%) |
| Benchmark su indici Price Index (senza dividendi) | Confermato in [`politica_investimento.pdf`](https://www.fondopensioneibm.it/docs/politica_investimento.pdf) par. 4.2.4, p. 18: codici Datastream `MSWRLDE(PI)` e `MSEROPE(PI)`, codici Bloomberg `MSERWI` e `MSEREURP` (Price Index in EUR), liquidità `JPEC3ML(RI)` / `JPCAEU3M` |
| TER 2025 | Correzione della descrizione: 0,473% = 0,414% commissioni di gestione + 0,059% depositario (prima era indicato "0,41% finanziario + 0,06% amministrativo") |
| Fonte del contributo dell'azienda | L'accordo aziendale del 04/07/2023 è online in [`04072023.pdf`](https://www.fondopensioneibm.it/docs/04072023.pdf); la fonte citata è anche la [Nota informativa 2026](https://www.fondopensioneibm.it/docs/nota_informativa.pdf) ([`nota_informativa_destinatari_e_contributi.pdf`](https://www.fondopensioneibm.it/docs/nota_informativa_destinatari_e_contributi.pdf), p. 9), che riporta lo schema in vigore |

## 2. Fisco: correzione importante del modello

Il modello precedente calcolava il risparmio della deduzione come `deduzione × (aliquota IRPEF dello scaglione + addizionali)` = 35,4% per il profilo d'esempio. È sbagliato per un dipendente: la deduzione in busta paga riduce il reddito complessivo, e quindi aumenta la detrazione per lavoro dipendente (art. 13 TUIR) e, tra 32.000 e 40.000 €, l'ulteriore detrazione del cuneo fiscale (L. 207/2024). Ora il risparmio è calcolato esattamente come differenza di imposte (docs/FORMULE.md par. 2).

| Profilo d'esempio, uscita a pensione, δ storico | Prima | Ora |
|---|---|---|
| Risparmio sulla deduzione massima del 1° anno (4.390 €) | 35,4% (1.553 €) | **54,2% (2.381 €)** |
| Capitale netto scenario 1 | 507.406,95 € | 521.784,98 € |
| Capitale netto scenario 2 | 444.103,35 € | 485.459,81 € |
| Capitale netto scenario 3 | 488.619,24 € | 493.509,33 € |
| Pareggio 2-3 | −4,17% | −5,48% |
| Pareggio 1-3 | −7,93% | −9,28% |
| Pareggio 2-1 | −2,35% | −3,61% |

Con il differenziale storico (−5,8%) vince ancora lo scenario 1, ma la deduzione massima è molto più vicina allo scenario 3 di quanto risultava prima. Per i redditi bassi l'effetto è opposto: chi ha poca IRPEF da pagare (incapienza) risparmia poco dalla deduzione. Con RAL 20.000 € lo scenario 2 scende a 397.311 €.

Altre correzioni fiscali:
- contributi INPS: da 9,46% (valore non documentato) a 9,19% + 1% oltre la prima fascia (aliquota IVS e L. 438/1992);
- addizionale regionale: dallo scaglione massimo applicato a tutto il reddito (1,73%) agli scaglioni Lombardia (1,23 / 1,58 / 1,72 / 1,73%);
- addizionale comunale: da 0,65% (un comune specifico) a 0,8%, il massimo di legge;
- il risparmio fiscale si calcola ogni anno sulla retribuzione dell'anno, che cresce del 2% come i contributi.

Controlli puntuali (`tests/golden_model_example.json`, campo `tax_checks`): imposte totali e risparmio su 1.000 € dedotti per RAL 15.000 / 25.000 / 35.000 / 45.000 / 60.000 / 90.000 €. Il caso da 45.000 € è scomposto voce per voce in docs/FORMULE.md.

## 3. Altre correzioni del modello

| Problema | Correzione |
|---|---|
| TER contato due volte con le medie storiche: le medie dell'ETF sono già al netto del TER, ma il modello toglieva di nuovo il TER | Il campo "Rendimento ETF atteso" è sempre prima del TER; scegliendo una media storica l'interfaccia aggiunge il TER |
| TER fisso 0,20% | Segue l'ETF scelto: Vanguard 0,14% (default), SPDR 0,17%, iShares 0,20% |
| Rendimento del Fondo ancorato al TER dell'ETF selezionato per il PAC | Disaccoppiato: `fundNetReturn` usa sempre il TER dell'ETF di riferimento su cui è calibrato δ (0,14%), così cambiare l'ETF del PAC aggiorna solo il montante PAC e non il montante del Fondo |
| Importo fisso del risparmio senza limiti | Limitato ogni anno tra il minimo che dà diritto al contributo dell'azienda e la deduzione massima |
| Posizione reale del file d'esempio calcolata con un valore quota 20,9305 di cui non si trova la fonte | Si usa il valore quota dell'ultimo movimento del file (20,930), come dice la SPEC: 18.751,61 € (prima 18.752,05 €). La riga TOTALE non conta più come movimento (43 movimenti, non 44) |

## 4. Coerenza tra prototipo e modello di riferimento

`tests/parity_prototype.js` esegue il codice del prototipo `design/v2/Landing.dc.html` e lo confronta con `reference/model.py` su 7 casi: default; δ = 0; riscatto a 10 anni; importo fisso 3.000 € e 200 €; RAL 90.000 € e 20.000 €. Esito: **identici al centesimo**, con lo stesso risparmio fiscale (0,542403).

### Modello TypeScript (`src/model/`)

`npm test` confronta il modello dell'app con `reference/model.py`. Riproduce al centesimo i capitali di `tests/golden_model_example.json` (pensione con δ storico e con δ = 0, euro di oggi, riscatto a 10 anni), i `tax_checks` e la prima riga dei flussi; i pareggi coincidono entro 1e-6. Anche i 7 casi del prototipo coincidono al centesimo, sia con `model.py` (`tests/golden_parity_cases.json`) sia con il codice del prototipo eseguito nel test. La forma chiusa coincide con la ricorsione per 6 differenziali, 2 modalità di uscita e 3 profili.

## 5. Storico

`reference/history.py` riproduce `tests/golden_history.json` senza differenze: medie 2014-2025 fondo lordo 5,454%, benchmark lordo 6,460%, ETF 11,263%; δ = −5,808%; statistiche 2012-2025 come in docs/FORMULE.md par. 8.

### Storico e import nell'app (`src/model/history.ts`, `src/import/dettaglio.ts`, `src/model/contributions.ts`)

`npm test` confronta l'app con `tests/golden_history.json` (CAGR uguali entro 1e-12) e con le statistiche di FORMULE par. 8 (media −6,16%, mediana −6,82%, deviazione standard campionaria 6,96%, intervallo [−9,81%; −2,51%], 3 anni positivi su 14). Verifica anche la scomposizione −2,1 / −2,7 / −1,0, i preset del prototipo (−5,81 / −5,04 / −3,95 / −4,80) e i cumulati dell'Assicurativo 2018-2025 (+18,0%, ISTAT +20,4%, TFR +24,0%; Azionario +45,6%). Sul fixture coincidono con `tests/golden_fixture_ok.json` la posizione reale, l'ETF dentro e fuori dal fondo e la data di valutazione; le serie mensili coincidono al centesimo con quelle del prototipo `design/v2/Versamenti.dc.html` per ACWI, MSCI World e MSCI Europe.

### Privacy e accessibilità dell'app (23/10/2026)

`npm run test:e2e` sulla build con la CSP:
- nessuna richiesta esterna su tutte le pagine, anche con import e slider; nessun cookie, nessun dato in `localStorage` senza "Salva i miei dati";
- axe-core WCAG 2.1 AA senza violazioni su tutte le pagine, a 1280 e a 390 px;
- Lighthouse: Accessibility 100 e Best Practices 100 su simulatore, Storico, Parametri e fonti, I miei versamenti;
- aggiornamento della risposta dopo uno slider: mediana sotto i 100 ms.


## 7. Anomalie riscontrate nei documenti del fondo e punti aperti

1. **Refuso nella tabella web di maggio 2026 (`comparto_azionario.html` / `comp_azionario.pdf`)**: la riga `05/2026` riporta un valore quota di `20,352` con rendimento da inizio 2009 `+105,32%` e rendimento da inizio 2026 `+4,61%`, valori matematicamente corrispondenti a una quota di **`20,532`** (cifre `3` e `5` invertite).
2. **Incoerenza interna nella Nota informativa 2026 (p. 24)**: la Tav. 5 dichiara un rendimento medio composto a 10 anni (2016–2025) del benchmark pari a `5,23%`, mentre i rendimenti annui della Tav. 4 nella stessa pagina danno esattamente `5,03%`.
3. **Incoerenza nei "bcmk netti alla data" dei Bilanci 2015–2017**: i valori cumulati del benchmark nel testo della Relazione sulla gestione non concatenano con i valori annui dichiarati nella stessa frase.
4. **Dati 2026 parziali**: aggiornare `fpddi_azionario.json` quando esce il Bilancio 2026 completo (sul sito del fondo è già disponibile anche la riga `09/2026`: quota `21,150`, rendimento YTD `+7,75%`, benchmark YTD `+9,22%`).
5. **Medie storiche degli ETF (`data/etf_catalog.json`)**: aggiornabili periodicamente dalle schede ufficiali degli emittenti (Vanguard, State Street SPDR, BlackRock iShares).
