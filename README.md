# pac-vs-fp

Simulatore indipendente per gli iscritti al Fondo Pensione per i Dipendenti e Dirigenti IBM (FPDDI), comparto Azionario. Confronta tre modi di usare lo stesso risparmio: più o meno versamenti nel fondo e un PAC su un ETF azionario globale. Funziona interamente nel browser; nessun dato lascia il dispositivo. Non è consulenza finanziaria.

Stato: **specifica pronta, implementazione da fare** (vedi `docs/SPEC.md`, par. 8).

| Percorso | Contenuto |
|---|---|
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
