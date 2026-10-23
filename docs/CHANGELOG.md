# Registro delle modifiche

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
