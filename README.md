# pac-vs-fp

Simulatore indipendente per gli iscritti al Fondo Pensione per i Dipendenti e Dirigenti IBM (FPDDI), comparto Azionario. Confronta tre modi di usare lo stesso risparmio: più o meno versamenti nel fondo e un PAC su un ETF azionario globale. Funziona interamente nel browser; nessun dato lascia il dispositivo. Non è consulenza finanziaria.

Stato: **in costruzione per fasi** (`docs/SPEC.md`, par. 8). Fase 1 fatta: scaffold, CSP, test di privacy, deploy su GitHub Pages.

Licenza MIT (`LICENSE`). Il codice è pubblico perché chiunque possa controllare dati, fonti e formule.

## Sviluppo

Serve Node.js 22.

```
npm ci              # dipendenze (versioni esatte da package-lock.json)
npm run dev         # sviluppo su http://localhost:5173/pac-vs-fp/ (senza CSP: Vite usa script inline)
npm test            # test Vitest (CSP uguale alla SPEC, nessun dato personale nel repository; poi modello e storico)
npm run build       # typecheck e build in dist/, con la CSP nel meta tag
npm run preview     # serve la build su http://localhost:4173/pac-vs-fp/
npm run test:e2e    # Playwright sulla build: nessuna richiesta esterna, CSP attiva, font locale
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
python3 spec/reference/history.py spec/tests/fixtures/sample_dettaglio_ok.xls
node spec/tests/parity_prototype.js spec/design/v2/Landing.dc.html
```

Dati personali: mai in questo repository (vedi `.gitignore`).
