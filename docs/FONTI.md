# Fonti dei dati

Regola del progetto: ogni numero mostrato o usato nei calcoli viene da (1) un documento del fondo FPDDI, citato con file e pagina; (2) una norma o una fonte istituzionale; (3) l'emittente o un fornitore di dati di mercato; oppure (4) è un'ipotesi dichiarata come tale. Nient'altro. Nell'interfaccia ogni valore ha un tooltip con questa fonte (SPEC par. 3.6).

I documenti del fondo sono pubblici su https://www.fondopensioneibm.it e non sono nel repository: i PDF stanno nell'archivio locale dell'autore (`01_documenti_sito`). Le pagine citate sono quelle del PDF. Tipo di fonte, usato per il colore dell'etichetta: `Doc. FPDDI`, `Norma`, `Emittente`, `Calcolo storico`, `Ipotesi`, `Tuo dato`.

---

## 1. Comparto Azionario FPDDI (`data/fpddi_azionario.json`)

Rendimenti netti annui del comparto (dopo costi e imposta) e del benchmark (netto dell'imposta), come pubblicati dal fondo. Ogni anno ha nel JSON il campo `evidence` con file, pagina e citazione.

| Anno | Fondo netto | Benchmark netto | Fonte |
|---|---|---|---|
| 2012 | 4,09% | 2,38% | Bilancio 2012, relazione sulla gestione. **PDF non nel pacchetto: da ricontrollare** |
| 2013 | 9,83% | 14,05% | Bilancio 2013, relazione sulla gestione. **PDF non nel pacchetto: da ricontrollare** |
| 2014 | −2,95% | 8,43% | Bilancio 2014, p. 13: "rendimento mensile netto dell'anno 2014 (-2,95%) … bcmk … nell'anno (8,43%)" |
| 2015 | 8,69% | 5,09% | Bilancio 2015, p. 14 |
| 2016 | 1,627% | 2,86% | Bilancio 2016, p. 13; Nota informativa 2026, Tav. 4, p. 24 |
| 2017 | 7,811% | 4,60% | Bilancio 2017, p. 19; Nota informativa 2026, Tav. 4, p. 24 |
| 2018-2025 | vedi JSON | vedi JSON | Pagina web "Comparto Azionario", tabella "Consistenza e rendimento" (comp_azionario.pdf, p. 1); Nota informativa 2026, Tav. 4, p. 24 |
| 2026 (gen-ago) | 6,88% | 8,28% | Pagina web "Comparto Azionario", riga 08/2026. Parziale: escluso dalle medie |

- Valore quota di fine anno 2018-2026: stessa tabella web.
- Imposta sui rendimenti per anno: 11% fino al 2013, 11,5% nel 2014, 20% dal 2015 (L. 190/2014 art. 1 cc. 621-622; FPDDI "Regime fiscale", p. 5).
- Rendimenti 2009-2011 (lordi): Bilancio 2011. Mostrati solo come informazione.

## 2. Altri dati del fondo

| Dato | Valore | Fonte |
|---|---|---|
| Benchmark del comparto | 45% MSCI World, 45% MSCI Europe, 10% JPM Cash Euro 3M | Documento sulla politica di investimento, par. 4.2, p. 18 (codici Datastream MSWRLDE(PI), MSEROPE(PI), JPEC3ML(RI)) |
| Commissione del gestore | 0,24% annuo + 10% dell'over performance | Documento sulla politica di investimento, p. 16 |
| TER 2025 comparto Azionario | 0,473% = 0,414% gestione finanziaria + 0,059% depositario | Nota informativa 2026, Tav. 7, p. 24 |
| ISC a 10 anni | 0,29% | Scheda dei costi in vigore dal 01/01/2026, p. 2 |
| Medie composte ufficiali | 3a 9,92 / 5a 6,90 / 10a 4,78 (benchmark 9,73 / 7,20 / 5,23) | Nota informativa 2026, Tav. 5, p. 24 |
| Contributi minimi IBM Italia | aderente 2% fino alla prima fascia e 7% oltre; azienda 1,5% e 4% (sui minimi contrattuali), tetto 3,5% della retribuzione | Nota informativa 2026, scheda "I destinatari e i contributi", p. 9 |
| Limite di deducibilità | 5.300 € dal 2026 (5.164,57 € fino al 2025) | "Regime fiscale", p. 3 |
| Recupero non dedotti | 2.650 € l'anno, 7.950 € complessivi, dal 6° al 25° anno | "Regime fiscale", p. 3 |
| Imposta d'uscita | 15% − 0,3 punti per anno oltre il 15°, minimo 9%; riscatto per cause diverse e anticipazioni per ulteriori esigenze 23% | "Regime fiscale", pp. 6-7 |
| Parte imponibile della prestazione | al netto di rendimenti già tassati e contributi non dedotti | Nota informativa 2026, p. 24 |
| Portafoglio 31/12/2025 | quattro OICR Generali Investments SICAV = 88,40% delle attività | Bilancio 2025, p. 41 |
| Comparto Assicurativo 2018-2026 | rendimenti, ISTAT, TFR | Pagina web "Comparti assicurativi" (comp_assicurativo.pdf) |

## 3. Norme e fonti istituzionali

| Dato | Valore 2026 | Fonte |
|---|---|---|
| Scaglioni IRPEF | 23% fino a 28.000 €, 33% fino a 50.000 €, 43% oltre | L. 199/2025 (Legge di bilancio 2026), art. 1 c. 3 |
| Detrazione per lavoro dipendente | formule per fascia (docs/FORMULE.md par. 2) | Art. 13 c. 1 TUIR (D.P.R. 917/1986) |
| Cuneo fiscale | somma esente 7,1/5,3/4,8% fino a 20.000 €; ulteriore detrazione 1.000 € fino a 32.000 €, decrescente fino a 40.000 € | L. 207/2024 art. 1 cc. 4-6; circolare Agenzia delle Entrate 4/E/2025 |
| Contributi trattenuti in busta paga fuori dal reddito | | Art. 51 c. 2 lett. h TUIR |
| Contributi INPS del dipendente | 9,19% + 1% oltre la prima fascia | Aliquota IVS; L. 438/1992 art. 3-ter |
| Prima fascia pensionabile | 56.224 € annui (4.685 € mensili) | Circolare INPS n. 6 del 30/01/2026 |
| Addizionale regionale Lombardia | 1,23% / 1,58% / 1,72% / 1,73% | Regione Lombardia, pagina "Addizionale Regionale all'IRPEF" (agg. 05/05/2026); l.r. 10/2003 art. 72 |
| Addizionale comunale | 0,8% (massimo di legge) | D.Lgs. 360/1998 art. 1 c. 3 |
| Bollo sul conto titoli | 0,2% annuo | D.L. 201/2011 art. 19 |
| Plusvalenze ETF | 26% | D.L. 66/2014 |
| Previdenza complementare | deducibilità, recupero, tassazione | D.Lgs. 252/2005 artt. 8, 11, 14, 17 |
| TFR | retribuzione / 13,5, meno 0,5% al Fondo di garanzia | Art. 2120 c.c.; L. 297/1982 art. 3 |
| Età di vecchiaia | 67 anni | L. 214/2011 |

## 4. ETF e mercati

| Dato | Fonte |
|---|---|
| Prezzi mensili 12/2011-10/2026 di iShares MSCI ACWI (IE00B6R52259), iShares Core MSCI World (IE00B4L5Y983), iShares Core MSCI Europe (IE00B4K48X80), Xtrackers EUR Overnight Rate Swap (LU0290358497) | Yahoo Finance, prezzi rettificati per i dividendi, ultimo prezzo del mese; dettagli in `data/etf_monthly.sources.json` |
| Rendimenti annui Vanguard FTSE All-World (2018-2026, VGWL.DE), SPDR MSCI ACWI IMI (2017-2026, SPYI.DE) | Yahoo Finance, prezzi mensili rettificati, scaricati il 23/10/2026: `data/etf_annual_extra.json`. SPYI.DE ha prezzi errati prima del 2017 (salti del −96% e +40%) e sono esclusi |
| TER, numero di titoli, patrimonio, data di lancio | Schede degli emittenti; valori letti su Finanzfluss ed extraETF tra il 20 e il 23/10/2026 (`data/etf_catalog.json`) |
| Medie annue a 5 e 10 anni e dal lancio, in EUR | Finanzfluss, prezzi Xetra, al 20/10/2026. Vanguard 10 anni (12,1%) calcolato da Yahoo Finance sulla classe a distribuzione IE00B3RBWM25: lo stesso calcolo a 5 anni dà 11,3%, come Finanzfluss |
| Quota del mercato coperta dagli indici | FTSE Russell (FTSE All-World: "around 90-95% of the world's investable market capitalisation"); MSCI (ACWI circa 85%, ACWI IMI circa 99%) |
| Rendimento atteso di lungo periodo | J.P. Morgan Asset Management, Long-Term Capital Market Assumptions 2026: azionario globale 7% annuo in USD, 10-15 anni |

## 5. Ipotesi (non sono dati)

Crescita di contributi e retribuzione 2% l'anno · inflazione 2% (obiettivo BCE) · rendimento atteso dell'ETF prima del TER · differenziale futuro uguale a quello scelto · norme fiscali 2026 per tutto l'orizzonte · versamenti a metà anno. L'interfaccia le etichetta come `Ipotesi`.

## 6. Profilo d'esempio

`data/profile_example.json` è un profilo **inventato** e verosimile (nato nel 1990, RAL 45.000 €, iscritto dal 2015, posizione 20.000 €). Non contiene dati reali. Il profilo reale dell'autore sta solo in `tests/private/` sul suo computer e non va mai nel repository.
