# pac-vs-fp

Simulatore indipendente per gli iscritti al Fondo Pensione per i Dipendenti e Dirigenti IBM (FPDDI), comparto Azionario. Confronta tre modi di usare lo stesso risparmio: più o meno versamenti nel fondo e un PAC su un ETF azionario globale. Funziona interamente nel browser; nessun dato lascia il dispositivo. Non è consulenza finanziaria.

Sito: https://nine1zero.github.io/pac-vs-fp/

Stato: **implementate le sei fasi** di `docs/SPEC.md` par. 8:
1. scaffold, CSP, test di privacy, deploy su GitHub Pages;
2. modello in `src/model/`, uguale a `spec/reference/model.py` al centesimo;
3. storico e import del file contribuzioni, uguali a `spec/reference/history.py`;
4. interfaccia v2 della Landing, con le fonti nei tooltip;
5. pagine I miei versamenti, Storico, Parametri e fonti;
6. test Playwright di privacy e accessibilità (axe-core, tastiera, Lighthouse).

Punti aperti (dati da ricontrollare o aggiornare): `docs/VERIFICHE.md` par. 7.

Licenza MIT (`LICENSE`). Il codice è pubblico perché chiunque possa controllare dati, fonti e formule.

## Sviluppo

Serve Node.js 22.

```
npm ci              # dipendenze (versioni esatte da package-lock.json)
npm run dev         # sviluppo su http://localhost:5173/pac-vs-fp/ (senza CSP: Vite usa script inline)
npm test            # Vitest: modello e storico contro i golden, import dei fixture, fonti dei dati, CSP, nessun dato personale
npm run build       # typecheck e build in dist/, con la CSP nel meta tag
npm run preview     # serve la build su http://localhost:4173/pac-vs-fp/
npm run test:e2e    # Playwright sulla build: privacy (nessuna richiesta esterna, CSP), pagine, accessibilità (axe, tastiera), Lighthouse ≥ 95
```

Deploy: il workflow `.github/workflows/ci.yml` esegue typecheck, test, build e Playwright su ogni pull request; su `main` pubblica `dist/` su GitHub Pages (`https://nine1zero.github.io/pac-vs-fp/`). Nelle impostazioni del repository, Settings → Pages → Source deve essere "GitHub Actions".

| Percorso | Contenuto |
|---|---|
| `src/` | Web app (Vite + TypeScript + React) |
| `test/`, `e2e/` | Test Vitest e Playwright dell'app |
| `CLAUDE.md` | Regole per lo sviluppo con Claude Code |
| `docs/SPEC.md` | Specifica completa (interfaccia in vigore: par. 3.0) |
| `docs/FORMULE.md` | Formule e metodo, con esempi numerici |
| `docs/FONTI.md` | Fonte di ogni dato (documenti del fondo con pagina, norme, emittenti) |
| `docs/VERIFICHE.md` | Verifiche fatte, correzioni, punti aperti |
| `docs/CHANGELOG.md` | Registro delle modifiche |
| `public/data/` | Dati statici: rendimenti del fondo, prezzi ETF, parametri, profilo d'esempio |
| `spec/reference/` | Modello di riferimento in Python (`model.py`, `history.py`): fa fede sulle formule |
| `spec/tests/` | Valori di controllo (golden), file d'esempio sintetici, script di verifica |
| `spec/design/v2/` | Prototipi dell'interfaccia in vigore; `spec/design/v1/` prima versione |

Nei documenti di `docs/` i percorsi `data/`, `reference/`, `tests/` e `design/` corrispondono a `public/data/`, `spec/reference/`, `spec/tests/` e `spec/design/`.

Verifiche rapide:

```
python3 spec/tests/make_golden.py                                         # rigenera i golden (solo per modifiche volute del modello)
python3 spec/tests/make_golden_parity.py                                  # rigenera i casi di parità con il prototipo (idem)
python3 spec/reference/history.py spec/tests/fixtures/sample_dettaglio_ok.xls
node spec/tests/parity_prototype.js spec/design/v2/Landing.dc.html
```

Dati personali: mai in questo repository (vedi `.gitignore`).
