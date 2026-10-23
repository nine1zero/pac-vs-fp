// Titolo con il menù a tendina dell'ETF del PAC (SPEC par. 3.0): l'ETF scelto vale in tutta la simulazione.
import { useEffect, useRef, useState } from 'react';
import { etfCatalog, etfById, type Etf } from '../../data/catalog';
import { useStore } from '../../state/store';
import { int, num, pct } from '../format';
import { Src } from '../Tip';

export function etfFacts(e: Etf): { k: string; v: string; source: string; kind: 'Emittente' | 'Norma' }[] {
  const src = etfCatalog.sources;
  return [
    { k: 'Indice', v: e.index, source: src.issuer!, kind: 'Emittente' },
    { k: 'Società', v: e.companies, source: src.issuer!, kind: 'Emittente' },
    { k: 'Copertura', v: e.coverage, source: src[e.coverage_source]!, kind: 'Emittente' },
    { k: 'Titoli', v: int(e.holdings), source: src.issuer!, kind: 'Emittente' },
    { k: 'Patrimonio', v: `${num(e.aum_eur_bn, 1)} mld €`, source: src.issuer!, kind: 'Emittente' },
    { k: 'Storia', v: e.history, source: src.issuer!, kind: 'Emittente' },
  ];
}

export function EtfMenu() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const sel = etfById(state.inputs.etf_id);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  return (
    <span className="etf-menu" ref={wrap}>
      <button type="button" className="etf-trigger" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen(!open)} title="Scegli l'ETF del PAC">
        PAC ETF globale
        <span className="etf-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <span className="etf-list" role="listbox" aria-label="ETF del PAC">
          {etfCatalog.etfs.map((e) => {
            const on = e.id === sel.id;
            return (
              <button
                key={e.id}
                type="button"
                role="option"
                aria-selected={on}
                className={`etf-opt${on ? ' on' : ''}`}
                onClick={() => {
                  dispatch({ type: 'set', inputs: { etf_id: e.id } });
                  setOpen(false);
                }}
              >
                <span className="etf-opt-head">
                  <span>{e.name}</span>
                  <span>TER {pct(e.ter, 2)}</span>
                </span>
                <span className="etf-isin">{e.isin}</span>
                <span className="etf-facts">
                  {etfFacts(e).map((f) => (
                    <span key={f.k} className="etf-fact">
                      <span>{f.k}</span>
                      <span>{f.v}</span>
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
          <span className="etf-src">Fonte: {etfCatalog.sources.issuer}.</span>
        </span>
      )}
    </span>
  );
}

export function EtfBox() {
  const { state } = useStore();
  const e = etfById(state.inputs.etf_id);
  return (
    <span className="etf-box">
      <span className="cap">ETF del PAC</span>
      <strong>{e.name}</strong>
      <span className="muted">
        {e.isin} · TER {pct(e.ter, 2)}
      </span>
      <Src kind="Emittente" source={`TER e ISIN: ${etfCatalog.sources.issuer}.`} what="TER e ISIN dell'ETF" />
      <span className="muted">usato in tutta la simulazione</span>
    </span>
  );
}
