# Verifiche su dati, formule e calcoli (23/10/2026)

Registro delle verifiche fatte prima del passaggio a Claude Code: cosa è stato controllato, come, e cosa è cambiato. Da aggiornare a ogni revisione.

## 1. Dati del fondo

| Controllo | Esito |
|---|---|
| Rendimenti netti 2014-2017 di fondo e benchmark contro il testo dei bilanci (citazione e pagina in `data/fpddi_azionario.json`) | Coincidono |
| Rendimenti 2016-2025 contro la Nota informativa 2026, Tav. 4 (grafico, p. 24, letto dall'immagine della pagina) | Coincidono |
| Medie composte ricalcolate contro la Tav. 5 della Nota informativa | Fondo 3/5/10 anni: 9,92 / 6,90 / 4,78, esatte. Benchmark 3/5 anni: 9,73 / 7,20, esatte. **Benchmark 10 anni: la Tav. 5 dice 5,23%, i valori annui della Tav. 4 danno 5,03%**: incoerenza interna al documento del fondo. Usiamo i valori annui |
| Rendimento "alla data" (dal 2009) di bilanci 2014-2017 e tabella web 2018-2025 | Coerente anno su anno con i rendimenti annui del fondo |
| Valore quota di fine anno 2018-2025 | Il rapporto tra valori quota coincide con il rendimento annuo pubblicato |
| "Benchmark alla data" dei bilanci 2015-2017 | Non coerente con i benchmark annui degli stessi paragrafi (35,52% → 39,64% implicherebbe 3,04%, non 2,86%). Usiamo i valori annui, confermati dalla Tav. 4 |
| Rendimenti 2012 e 2013 | Presi dai bilanci 2012 e 2013 in una sessione precedente; quei PDF non sono nel pacchetto. **Da ricontrollare sul PDF** prima del rilascio |
| TER 2025 | Correzione della descrizione: 0,473% = 0,414% commissioni di gestione + 0,059% depositario (prima era indicato "0,41% finanziario + 0,06% amministrativo") |
| Fonte del contributo dell'azienda | L'accordo aziendale del 04/07/2023 è nell'archivio locale ma non tra i file verificati qui: la fonte citata ora è la Nota informativa 2026, p. 9, che riporta lo schema in vigore |

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
| Importo fisso del risparmio senza limiti | Limitato ogni anno tra il minimo che dà diritto al contributo dell'azienda e la deduzione massima |
| Posizione reale del file d'esempio calcolata con un valore quota 20,9305 di cui non si trova la fonte | Si usa il valore quota dell'ultimo movimento del file (20,930), come dice la SPEC: 18.751,61 € (prima 18.752,05 €). La riga TOTALE non conta più come movimento (43 movimenti, non 44) |

## 4. Coerenza tra prototipo e modello di riferimento

`tests/parity_prototype.js` esegue il codice del prototipo `design/v2/Landing.dc.html` e lo confronta con `reference/model.py` su 7 casi: default; δ = 0; riscatto a 10 anni; importo fisso 3.000 € e 200 €; RAL 90.000 € e 20.000 €. Esito: **identici al centesimo**, con lo stesso risparmio fiscale (0,542403).

### Modello TypeScript (`src/model/`)

`npm test` confronta il modello dell'app con `reference/model.py`. Riproduce al centesimo i capitali di `tests/golden_model_example.json` (pensione con δ storico e con δ = 0, euro di oggi, riscatto a 10 anni), i `tax_checks` e la prima riga dei flussi; i pareggi coincidono entro 1e-6. Anche i 7 casi del prototipo coincidono al centesimo, sia con `model.py` (`tests/golden_parity_cases.json`) sia con il codice del prototipo eseguito nel test. La forma chiusa coincide con la ricorsione per 6 differenziali, 2 modalità di uscita e 3 profili.

## 5. Storico

`reference/history.py` riproduce `tests/golden_history.json` senza differenze: medie 2014-2025 fondo lordo 5,454%, benchmark lordo 6,460%, ETF 11,263%; δ = −5,808%; statistiche 2012-2025 come in docs/FORMULE.md par. 8.

## 6. Profilo privato

Il profilo reale dell'autore (`tests/private/profilo_privato.json`, solo in locale) è stato aggiornato ai parametri fiscali v2 e i suoi valori di controllo rigenerati con il nuovo modello; quelli del Google Sheet (modello v1) restano nel file come `golden_model_v1_sheet`. Il Google Sheet va aggiornato al calcolo fiscale v2 se deve restare il riferimento.

## 7. Cosa resta da verificare

1. Rendimenti 2012 e 2013 sui PDF dei bilanci 2012 e 2013 (archivio locale).
2. Ipotesi "benchmark su indici di prezzo": va chiesta conferma al fondo (codici "(PI)").
3. Nel 2026 il dato è gennaio-agosto: aggiornare `fpddi_azionario.json` quando esce il bilancio 2026.
4. Aliquota dell'imposta sui rendimenti: usiamo il 20% nominale; l'aliquota effettiva del comparto (titoli pubblici al 12,5%) non è pubblicata.
5. Medie storiche degli ETF: aggiornarle prima del rilascio, con la data in interfaccia.
