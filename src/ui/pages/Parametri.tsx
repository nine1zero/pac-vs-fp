// Pagina H "Parametri e fonti" (SPEC par. 3.4 H, prototipo spec/design/v2/Fonti.dc.html).
import Fuse from 'fuse.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { params, type Parameter } from '../../data';
import { ASSUMPTIONS, FUND_DOCS, FUND_SITE, LAWS, LIMITS, MARKETS, STUDIES } from '../../data/sourcesList';
import {
  currentValue,
  defaultValue,
  displayValue,
  ETF_OPTIONS,
  exportProfile,
  fieldKind,
  fromField,
  importProfile,
  isChanged,
  resetAction,
  setAction,
  toField,
} from '../../state/paramRows';
import { useStore } from '../../state/store';
import { NumField } from '../controls';
import { Tip } from '../Tip';

const GROUPS = ['Dati personali', 'Ipotesi di mercato', 'Fisco', 'PAC ETF', 'Fondo pensione', 'Tecnici'];
const UNIT_LABEL: Record<string, string> = { '%': '%', 'punti %': 'punti %', '€': '€', anno: '', anni: 'anni', n: '', testo: '' };

export function Parametri({ anchor }: { anchor?: string }) {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState('');
  const [onlyMain, setOnlyMain] = useState(false);
  const [group, setGroup] = useState('Tutti');
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(params.parameters, {
        keys: ['label', 'description', 'source', 'tags', 'id'],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [],
  );
  const matched = useMemo(() => {
    const base = q.trim() ? fuse.search(q.trim()).map((r) => r.item) : params.parameters;
    return base.filter((p) => !(onlyMain && p.advanced));
  }, [q, onlyMain, fuse]);
  const visible = matched.filter((p) => group === 'Tutti' || p.group === group);
  const nChanged = params.parameters.filter((p) => isChanged(state, p.id)).length;

  useEffect(() => {
    if (!anchor) return;
    const el = document.getElementById(`param-${anchor}`);
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    el.classList.add('flash');
    ((el.querySelector('input, select') ?? el.querySelector('button')) as HTMLElement | null)?.focus();
  }, [anchor]);

  const kinds = Object.entries(params.source_kinds);

  return (
    <main className="wrap main" id="contenuto">
      <section className="hero-text">
        <h1 className="h1">
          Parametri e <span className="mark">fonti</span>
        </h1>
        <p className="lead">
          Ogni numero usato dal calcolo, con la sua fonte. Passa sopra la <span className="ib inline">i</span> per la spiegazione e sull'etichetta della fonte per il
          riferimento esatto. Puoi modificare i valori: restano solo sul tuo dispositivo.
        </p>
      </section>

      <div className="toolbar">
        <div className="toolbar-row">
          <label className="search">
            <span className="sr-only">Cerca un parametro</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca: deduzione, TFR, riscatto, TER, inflazione…" />
          </label>
          <label className="check-label">
            <input type="checkbox" checked={onlyMain} onChange={(e) => setOnlyMain(e.target.checked)} />
            Solo i principali
          </label>
          <button type="button" className="btn ghost" disabled={nChanged === 0} onClick={() => dispatch({ type: 'resetParams' })}>
            ↺ Ripristina tutti ({nChanged})
          </button>
        </div>
        <div className="toolbar-row">
          <span className="chips" role="group" aria-label="Gruppi di parametri">
            {['Tutti', ...GROUPS].map((g) => (
              <button key={g} type="button" className="chip" aria-pressed={group === g} onClick={() => setGroup(g)}>
                {g} <span className="chip-n">{g === 'Tutti' ? matched.length : matched.filter((p) => p.group === g).length}</span>
              </button>
            ))}
          </span>
          <span className="muted text-sm" aria-live="polite">
            {visible.length} di {params.parameters.length} parametri · {nChanged} modificati
          </span>
        </div>
      </div>

      <div className="legend-kinds">
        <span className="muted text-sm">Tipo di fonte:</span>
        {kinds.map(([k, label]) => (
          <span key={k} className="kind" data-kind={label}>
            {label}
          </span>
        ))}
      </div>

      {GROUPS.filter((g) => group === 'Tutti' || g === group).map((g) => {
        const rows = visible.filter((p) => p.group === g);
        if (!rows.length) return null;
        return (
          <section key={g} className="pgroup" aria-labelledby={`g-${g}`}>
            <div className="prow phead">
              <h2 id={`g-${g}`} className="pgroup-title">
                {g} <span className="muted">{rows.length}</span>
              </h2>
              <span>Valore</span>
              <span className="hide-s">Fonte</span>
              <span className="hide-s" />
            </div>
            {rows.map((p) => (
              <ParamRow key={p.id} p={p} />
            ))}
          </section>
        );
      })}
      {visible.length === 0 && (
        <div className="card">
          Nessun parametro trovato per “{q}”. Prova “tasse”, “azienda” o “rendimento”.
        </div>
      )}

      <section className="card col">
        <h2 className="h2">Profilo: esporta e importa</h2>
        <p className="text-sm">
          Scarica i valori come file JSON per ritrovarli su un altro dispositivo, o importa un profilo (ad esempio il tuo profilo privato, che resta sul tuo computer). Il
          file è letto solo nel browser.
        </p>
        <span className="row-gap wrap">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              const blob = new Blob([exportProfile(state)], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'parametri-pac-vs-fp.json';
              a.click();
              setTimeout(() => URL.revokeObjectURL(a.href), 1000);
            }}
          >
            Esporta i parametri (JSON)
          </button>
          <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
            Importa un profilo (JSON)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            aria-label="Scegli il profilo JSON"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              f.text().then((t) => {
                try {
                  const r = importProfile(JSON.parse(t));
                  r.actions.forEach((a) => dispatch(a));
                  setMsg(`Importati ${r.applied.length} valori${r.rejected.length ? `; ignorati ${r.rejected.length} (sconosciuti o fuori dai limiti): ${r.rejected.join(', ')}` : ''}.`);
                } catch {
                  setMsg('Il file non è un JSON valido.');
                }
              });
            }}
          />
        </span>
        {msg && (
          <p className="text-sm" role="status">
            {msg}
          </p>
        )}
      </section>

      <section className="card col">
        <h2 className="h2">
          Assunzioni del modello <span className="muted">{ASSUMPTIONS.length}</span>
        </h2>
        <span className="pills">
          {ASSUMPTIONS.map(([t, d], i) => (
            <span key={t} className="tip pill-tip">
              <span className="pill" tabIndex={0} aria-describedby={`pa-${i}`}>
                {t}
              </span>
              <span className="bubble" role="tooltip" id={`pa-${i}`}>
                {d}
              </span>
            </span>
          ))}
        </span>
        <h3 className="h3">Limiti</h3>
        <ul className="text-sm list">
          {LIMITS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>

      <section className="card col" id="fonti">
        <h2 className="h2">Fonti</h2>
        <p className="text-sm">
          Elenco completo con file, pagine e citazioni in <code>docs/FONTI.md</code> nel codice sorgente. Documenti del fondo sul sito{' '}
          <a href={FUND_SITE} rel="noopener noreferrer">
            fondopensioneibm.it
          </a>
          .
        </p>
        <h3 className="h3">Documenti del fondo</h3>
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Documenti del fondo">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Documento sul sito</th>
                <th scope="col">File</th>
                <th scope="col">Dati usati</th>
              </tr>
            </thead>
            <tbody>
              {FUND_DOCS.map((d) => (
                <tr key={d.doc}>
                  <td>{d.doc}</td>
                  <td>
                    <code>{d.file}</code>
                  </td>
                  <td>{d.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="h3">Norme</h3>
        <ul className="text-sm list">
          {LAWS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <h3 className="h3">Mercati</h3>
        <ul className="text-sm list">
          {MARKETS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <h3 className="h3">Studi</h3>
        <ul className="text-sm list">
          {STUDIES.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>

      <div className="sec-foot">
        <span className="muted text-sm">
          I valori predefiniti sono un profilo d'esempio verosimile. Le modifiche restano su questo dispositivo finché non chiudi la pagina, o finché non le salvi.
        </span>
        <a href="#/" className="btn ghost">
          <span aria-hidden="true">←</span> Torna al simulatore
        </a>
      </div>
    </main>
  );
}

function ParamRow({ p }: { p: Parameter }) {
  const { state, dispatch } = useStore();
  const kind = fieldKind(p);
  const v = currentValue(state, p.id);
  const changed = isChanged(state, p.id);
  const kindLabel = params.source_kinds[p.source_kind] ?? p.source_kind;
  const set = (x: Parameters<typeof setAction>[1]) => {
    const a = setAction(p.id, x);
    if (a) dispatch(a);
  };
  const def = defaultValue(p.id);
  const link = `${window.location.origin}${window.location.pathname}#/parametri/${p.id}`;
  return (
    <div className={`prow${changed ? ' changed' : ''}`} id={`param-${p.id}`}>
      <span className="pname">
        <Tip label={`Cosa è: ${p.label}`} align="left" below>
          <strong>{p.label}</strong>
          <span>{p.description}</span>
          <span className="tip-src hide-l">
            Fonte ({kindLabel}): {p.source}
          </span>
          <button type="button" className="copy" onClick={() => navigator.clipboard?.writeText(link)}>
            Copia il link a questo parametro
          </button>
        </Tip>
        <span className="plabel" title={p.label}>
          {p.label}
        </span>
        {p.advanced && <span className="adv">avanzato</span>}
      </span>
      <span className="pval">
        {kind === 'number' && typeof v === 'number' && (
          <NumField
            label={<span className="sr-only">{p.label}</span>}
            value={toField(p, v)}
            min={p.min === null ? undefined : toField(p, p.min)}
            max={p.max === null ? undefined : toField(p, p.max)}
            step={p.step === null ? undefined : toField(p, p.step)}
            onChange={(x) => set(fromField(p, x))}
          />
        )}
        {kind === 'saving' && (
          <select className="sel" aria-label={p.label} value={v === null ? 'max' : 'fix'} onChange={(e) => set(e.target.value === 'max' ? null : v)}>
            <option value="max">Deduzione massima</option>
            <option value="fix" disabled={v === null}>
              {v === null ? 'Importo fisso (sceglilo nel simulatore)' : `Importo fisso: ${displayValue(p, v)} €`}
            </option>
          </select>
        )}
        {kind === 'mode' && (
          <select className="sel" aria-label={p.label} value={v as string} onChange={(e) => set(e.target.value)}>
            <option value="Pensione">Pensione</option>
            <option value="Riscatto">Riscatto</option>
          </select>
        )}
        {kind === 'etf' && (
          <select className="sel" aria-label={p.label} value={v as string} onChange={(e) => set(e.target.value)}>
            {ETF_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        {kind === 'bool' && (
          <select className="sel" aria-label={p.label} value={v ? 'si' : 'no'} onChange={(e) => set(e.target.value === 'si')}>
            <option value="si">Sì, in busta paga</option>
            <option value="no">No, versamento diretto</option>
          </select>
        )}
        {kind === 'text' && (
          <span className="ptext" title={displayValue(p, v)}>
            {displayValue(p, v)}
          </span>
        )}
        <span className="punit">{kind === 'number' || kind === 'text' ? (UNIT_LABEL[p.unit] ?? p.unit) : ''}</span>
      </span>
      <span className="tip tip-right hide-s psrc">
        <span className="kind" data-kind={kindLabel} tabIndex={0} aria-describedby={`src-${p.id}`}>
          {kindLabel}
        </span>
        <span className="bubble" role="tooltip" id={`src-${p.id}`} data-testid="source-text">
          {p.source}
        </span>
      </span>
      <span className="hide-s">
        {changed && (
          <button type="button" className="reset" title={`Torna a ${displayValue(p, def)}`} onClick={() => {
            const a = resetAction(p.id);
            if (a) dispatch(a);
          }}>
            ↺ default
          </button>
        )}
      </span>
    </div>
  );
}
