# Formule, calcoli e stime

Documento di metodo. Ogni formula qui ha la sua implementazione in `reference/model.py` (simulazione) o `reference/history.py` (storico e file contribuzioni), e l'app TypeScript deve riprodurle al centesimo (`tests/`). Le fonti dei numeri sono in `docs/FONTI.md`; le verifiche fatte e le differenze trovate in `docs/VERIFICHE.md`.

Notazione: percentuali come frazioni (0,02 = 2%). Anno di calendario `y`, indice dell'anno simulato `k = 1..n`, primo anno simulato `start_year` = 2027.

---

## 1. Orizzonte e crescita

- Anno di uscita `Y_exit = birth_year + exit_age`; anni simulati `n = Y_exit − start_year + 1`.
- Crescita di retribuzione e contributi: `g_k = (1 + growth)^(k−1)`, con `growth` = 2% (ipotesi). Gli scaglioni fiscali e il limite di 5.300 € restano fermi ai valori 2026 (ipotesi "norme 2026", dichiarata nell'interfaccia).

## 2. Fisco del lavoratore: risparmio di una deduzione

Il risparmio di una deduzione `D` non è `D × aliquota dello scaglione`. Per un dipendente la deduzione abbassa il reddito complessivo, e quindi fa **crescere** detrazione per lavoro dipendente e cuneo fiscale, che dipendono dal reddito. Il modello calcola il risparmio esatto come differenza di imposte:

```
risparmio(RAL, D) = T(r) − T(r − D)
r = RAL − 9,19% · RAL − 1% · max(0, RAL − 56.224)                 (reddito di lavoro dipendente)
T(r) = max(0, IRPEF_lorda(b) − detrazione(r) − ulteriore(r)) + add_reg(b) + 0,8% · b
b = r − somma_esente(r)
```

- **IRPEF lorda** (L. 199/2025 art. 1 c. 3): 23% fino a 28.000 €, 33% da 28.000 a 50.000 €, 43% oltre.
- **Detrazione per lavoro dipendente** (art. 13 c. 1 TUIR), sul reddito complessivo `r`:
  - `r ≤ 15.000`: 1.955 €;
  - `15.000 < r ≤ 28.000`: `1.910 + 1.190 · (28.000 − r) / 13.000`;
  - `28.000 < r ≤ 50.000`: `1.910 · (50.000 − r) / 22.000`;
  - oltre: 0.
- **Cuneo fiscale** (L. 207/2024 art. 1 cc. 4-6, strutturale):
  - `r ≤ 20.000`: somma che non concorre al reddito pari a 7,1% (fino a 8.500 €), 5,3% (fino a 15.000 €), 4,8% (fino a 20.000 €) del reddito di lavoro dipendente;
  - `20.000 < r ≤ 32.000`: ulteriore detrazione 1.000 €;
  - `32.000 < r ≤ 40.000`: ulteriore detrazione `1.000 · (40.000 − r) / 8.000`.
- **Addizionale regionale**: scaglioni Lombardia 1,23% / 1,58% / 1,72% / 1,73% (fino a 15.000 / 28.000 / 50.000 € / oltre). Altre regioni: modificabili.
- **Addizionale comunale**: 0,8%, massimo di legge, sull'imponibile.

Perché la deduzione riduce anche il reddito complessivo: i contributi al fondo trattenuti in busta paga non formano reddito di lavoro dipendente (art. 51 c. 2 lett. h TUIR). Se invece l'aderente versa direttamente e deduce in dichiarazione (`payroll_deduction = false`), la deduzione riduce solo l'imponibile e detrazioni e cuneo restano quelli del reddito pieno.

Effetto sul profilo d'esempio (RAL 45.000 €): con la deduzione massima del primo anno (4.390 €) il risparmio è 2.381,15 €, cioè il **54,2%**:

| Componente | Prima | Dopo la deduzione | Risparmio |
|---|---|---|---|
| Reddito `r` | 40.864,50 | 36.474,50 | |
| IRPEF lorda | 10.685,28 | 9.236,58 | 1.448,70 |
| Detrazione lavoro dipendente (sottratta) | 793,13 | 1.174,26 | 381,13 |
| Ulteriore detrazione del cuneo (sottratta) | 0,00 | 440,69 | 440,69 |
| Addizionale regionale | 611,17 | 535,66 | 75,51 |
| Addizionale comunale | 326,92 | 291,80 | 35,12 |
| **Totale imposte** | **10.830,24** | **8.449,10** | **2.381,15** |

La versione precedente del modello usava `33% + 1,73% + 0,65%` = 35,4% e sottostimava il vantaggio della deduzione: vedi `docs/VERIFICHE.md`.

Non modellati, e dichiarati nella pagina Metodo: trattamento integrativo (redditi bassi), detrazioni per familiari e altre detrazioni personali, esenzioni comunali, contributo CIGS dello 0,30% di alcuni settori.

Il simulatore applica il calcolo per ogni anno `k` con la retribuzione `RAL · g_k`.

## 3. Contributi al fondo

- Contributo minimo dell'aderente `E_k = min_member_month · 13 · g_k` (13 mensilità: a dicembre il versamento è doppio).
- Contributo dell'azienda `F_k = employer_month · 13 · g_k`, dovuto solo se l'aderente versa almeno `E_k`.
- TFR `G_k = tfr_month · 13 · g_k`.
- Regola del minimo, schema generale IBM Italia (Nota informativa FPDDI 2026, p. 9): aderente 2% della retribuzione fino alla prima fascia pensionabile INPS (56.224 € nel 2026) e 7% oltre; azienda 1,5% e 4% sui minimi contrattuali, al massimo il 3,5% della retribuzione. Il simulatore usa i valori dell'estratto quando c'è; la regola serve a calcolare la soglia minima del risparmio:
  `minimo_k = max(E_k, 2% · min(RAL·g_k, 56.224) + 7% · max(0, RAL·g_k − 56.224))`.

## 4. Deduzione, recupero e risparmio annuo

- Residuo dei non dedotti `H_1 = recoverable_non_deducted`; `H_{k+1} = max(0, H_k − V_k)`.
- Recupero usabile `I_k = min(2.650, H_k)` se `first_join_year + 5 ≤ y_k ≤ first_join_year + 24`, altrimenti 0 (D.Lgs. 252/2005 art. 8 c. 6; FPDDI "Regime fiscale" p. 3).
- Versamento dell'aderente per la deduzione massima `J_k = max(E_k, 5.300 + I_k − F_k)`: il limite di 5.300 € comprende il contributo dell'azienda, non il TFR.
- **Risparmio annuo** `K_k`, uguale nei tre scenari:
  - "Deduzione massima": `K_k = J_k`;
  - "Importo fisso" `A`: `K_k = min(J_k, max(minimo_k, A · g_k))`. Sotto il minimo uno scenario perderebbe il contributo dell'azienda; sopra la deduzione massima ogni euro in più andrebbe comunque nell'ETF.

## 5. I tre scenari, anno per anno

| | Scenario 1 – Minimo per l'azienda + PAC | Scenario 2 – Deduzione massima + PAC | Scenario 3 – Solo TFR + PAC |
|---|---|---|---|
| Versamento aderente | `L = E_k` | `S = max(E_k, min(J_k, K_k))` | 0 |
| Azienda | `M = F_k` | `T = F_k` | 0 |
| Quota dedotta | `N = max(0, min(L, 5.300 − M))` | `U = max(0, min(S, 5.300 + I_k − T))` | 0 |
| Recupero usato | | `V_k = max(0, U + T − 5.300)` | |
| Risparmio fiscale | `O = risparmio(RAL·g_k, N)` | `W = risparmio(RAL·g_k, U)` | 0 |
| Nel PAC | `P¹ = max(0, K_k − L + O)` | `P² = max(0, K_k − S + W)` | `P³ = K_k` |
| Nel fondo | `Q¹ = L + M + G_k` | `Q² = S + T + G_k` | `Q³ = G_k` |
| Base tassabile aggiunta | `R¹ = N + M + G_k` | `R² = U + T + G_k` | `R³ = G_k` |

Il rimborso fiscale si reinveste nel PAC nello stesso anno. I contributi non dedotti non entrano nella base tassabile all'uscita (Nota informativa 2026 p. 24: "parte imponibile").

## 6. Rendimenti

- ETF dopo i costi: `r_e = etf_gross_return − etf_ter`. `etf_gross_return` è il rendimento atteso **prima del TER**:
  - default 7%, stima di lungo periodo per l'azionario globale di J.P. Morgan, LTCMA 2026 (in dollari, 10-15 anni);
  - in alternativa, medie annue storiche dell'ETF scelto. Sono rendimenti di prezzo, già al netto del TER, quindi l'interfaccia le converte in "prima del TER" sommando il TER, così il costo non è contato due volte.
- Fondo prima dell'imposta: `r_f = r_e + δ`, con `δ` differenziale annuo fondo − ETF (par. 8). Netto dell'imposta annua del 20%: `r_n = r_f · (1 − 0,20)`. Negli anni negativi il fondo registra un credito d'imposta, quindi la formula vale per ogni segno.

## 7. Valori all'uscita

Per scenario `s` e orizzonte `h ≤ n` (anno di uscita `Y = start_year + h − 1`):

```
Fondo_0 = current_position          Fondo_k = Fondo_{k−1} · (1 + r_n) + Q^s_k · (1 + r_n)^0,5
B_0 = current_taxable_base          B_k = B_{k−1} + R^s_k
V_1 = P^s_1 · (1 + r_e)^0,5         V_k = V_{k−1} · (1 + r_e) · (1 − 0,2%) + P^s_k · (1 + r_e)^0,5
C_h = Σ P^s                         (versato nel PAC)
```

- Imposta d'uscita del fondo: `t = 23%` per il riscatto per cause diverse e per le anticipazioni per ulteriori esigenze; per la pensione `t = max(9%, 15% − 0,3% · max(0, (Y − first_join_year) − 15))` (D.Lgs. 252/2005 artt. 11 e 14; FPDDI "Regime fiscale" pp. 6-7).
- Fondo netto `= Fondo_h − t · B_h`.
- PAC netto `= V_h − 26% · max(0, V_h − C_h)` (bollo dello 0,2% annuo già tolto; plusvalenze al 26% alla vendita).
- Capitale netto `= fondo netto + PAC netto`; in euro di oggi `= capitale / (1 + inflazione)^(Y − 2026)`.

Il fattore `(1 + r)^0,5` rappresenta versamenti mensili distribuiti nell'anno (in media metà anno di rendimento).

Forma chiusa, usata da mappa e pareggi: con `a = 1 + r_n`, `Fondo_h(δ) = Fondo_0 · a^h + Σ_k Q^s_k · a^(h − k + 0,5)`. PAC e base non dipendono da `δ`.

## 8. Differenziale storico δ

```
fondo_lordo_y = fondo_netto_y / (1 − imposta_y)           imposta: 11% fino al 2013, 11,5% nel 2014, 20% dal 2015
CAGR(x, y0..y1) = (Π (1 + x_y))^(1/(y1 − y0 + 1)) − 1
δ = CAGR(fondo_lordo, 2014..2025) − CAGR(ETF, 2014..2025) = 5,454% − 11,263% = −5,808%
```

- Fondo e benchmark: rendimenti netti pubblicati, anno per anno (`data/fpddi_azionario.json`).
- ETF: `prezzo(31/12) / prezzo(31/12 dell'anno prima) − 1`, prezzi di fine mese rettificati per i dividendi (`data/etf_monthly.csv`).
- Il confronto è prima dell'imposta: il fondo paga il 20% ogni anno, il PAC il 26% solo alla vendita, e il modello applica le due imposte separatamente (par. 6-7).

Statistiche sui differenziali annui (fondo lordo − ETF), 2012-2025 (14 anni):
- media −6,16%, mediana −6,82%, deviazione standard 6,96%, errore standard 1,86%;
- intervallo al 95% della media `media ± 1,96 · errore standard` = [−9,81%; −2,51%];
- anni in cui il fondo ha battuto l'ETF: 3 su 14.

**Scomposizione del ritardo**, 2014-2025, in punti l'anno (differenze di medie composte):

| Componente | Formula | Valore |
|---|---|---|
| Composizione del benchmark | `CAGR(ricostruito) − CAGR(ETF)` | −2,1 |
| Calcolo del benchmark pubblicato | `CAGR(benchmark lordo) − CAGR(ricostruito)` | −2,7 |
| Gestore e costi | `CAGR(fondo lordo) − CAGR(benchmark lordo)` | −1,0 |

Benchmark ricostruito: `0,45 · MSCI World + 0,45 · MSCI Europe + 0,10 · liquidità €STR`, ribilanciato ogni anno, con ETF che replicano le componenti. La seconda voce è compatibile con un benchmark calcolato su indici di prezzo, senza dividendi (codici Datastream "(PI)" nel documento di politica di investimento). È un'ipotesi da confermare con il fondo.

## 9. Pareggi

Per due scenari A e B, un orizzonte `h` e una modalità di uscita, il pareggio è il `δ*` per cui `Netto_A(δ*) = Netto_B(δ*)`. Si calcola con la bisezione su [−95%; +50%] (60-80 iterazioni). Se il differenziale reale è sopra `δ*` conviene A, se è sotto conviene B.

- Grafico "nel tempo": per ogni anno di uscita si calcola il capitale netto dei tre scenari. Il pareggio cade dove la differenza tra due scenari cambia segno, tra l'anno `k−1` e l'anno `k`, interpolato linearmente: `x = k − 1 + d_{k−1} / (d_{k−1} − d_k)`.

## 10. File contribuzioni (DettaglioOperazioni.xls)

- Posizione reale `= Σ quote del comparto AZIONARIO × valore quota dell'ultimo movimento del file + Σ "Contr. non investito"`, valutata a fine mese dell'ultimo movimento.
- Stessi versamenti nell'ETF "dentro il fondo", per un versamento con data valore `d` nell'anno `y`:
  `netto · (1 + (P(fine y)/P(d) − 1) · (1 − t_y)) · NI(fine periodo) / NI(fine y)`, con `NI(y) = Π_{j≤y} (1 + r_ETF,j · (1 − t_j))` e `P` il prezzo di fine mese.
- "Fuori dal fondo, prima del 26%": `netto · P(valutazione) / P(d)`.
- Valori di controllo sul file sintetico (`tests/golden_fixture_ok.json`): 43 movimenti, valore quota 20,930, posizione reale 18.751,61 €, ETF dentro il fondo 20.691,45 €, fuori prima del 26% 21.983,58 €.

## 11. Ipotesi dichiarate

Stesso budget netto nei tre scenari · rimborso fiscale reinvestito nel PAC · differenziale costante · costi del fondo già nel differenziale storico (calcolato sui valori quota) · versamenti a metà anno · contributi e retribuzione +2% l'anno · uscita in capitale, senza rendita · prima dell'ultimo anno, uscita come riscatto al 23% (striscia e mappa) · PAC tassato alla vendita, bollo annuo · norme fiscali 2026 per tutto l'orizzonte.
