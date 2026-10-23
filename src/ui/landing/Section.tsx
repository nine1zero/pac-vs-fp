import type { ReactNode } from 'react';
import { useStore, type MineKey } from '../../state/store';

export const SECTION_TITLES = ['Avvertenze', 'Età e orizzonte', 'Il tuo fondo', 'Stipendio', 'Ipotesi', 'Risultato', 'Fonti'];
export const SECTION_MINE: (MineKey | null)[] = [null, 'eta', 'fondo', 'ral', 'ipotesi', null, null];

interface Props {
  k: number;
  title: string;
  subtitle: string;
  /** testo del badge; default: "Dati tuoi" / "Esempio" */
  badge?: string;
  summary: ReactNode;
  children: ReactNode;
  /** azioni in fondo alla sezione aperta */
  footer: ReactNode;
}

/** Sezione comprimibile della Landing: intestazione, riepilogo di una riga, badge, Apri/Modifica/Chiudi. */
export function Section({ k, title, subtitle, badge, summary, children, footer }: Props) {
  const { state, dispatch } = useStore();
  const open = state.open === k;
  const done = state.done.includes(k);
  const mineKey = SECTION_MINE[k];
  const mine = mineKey ? state.mine[mineKey] : false;
  const b = badge ?? (mine ? 'Dati tuoi' : 'Esempio');
  return (
    <section id={`sezione-${k}`} className={`sec${open ? ' open' : ''}`} aria-labelledby={`sec-title-${k}`}>
      <div className="sec-head">
        <span className={`sec-num${open ? ' active' : done ? ' done' : ''}`} aria-hidden="true">
          {done && !open ? '✓' : k}
        </span>
        <div className="sec-titles">
          <span className="sec-title-row">
            <h2 id={`sec-title-${k}`} className="sec-title">
              {title}
            </h2>
            <span className={`badge-pill${b === 'Dati tuoi' || b.startsWith('Vince') || b === 'Da leggere' ? ' lime' : ''}`}>{b}</span>
          </span>
          <span className="sec-sub">{subtitle}</span>
        </div>
        <span className="sumrow">{summary}</span>
        <button
          type="button"
          className="btn ghost"
          aria-expanded={open}
          aria-controls={`sec-body-${k}`}
          onClick={() => dispatch({ type: 'open', section: k })}
        >
          {open ? 'Chiudi ▴' : done ? 'Modifica ▾' : 'Apri ▾'}
          <span className="sr-only"> la sezione {title}</span>
        </button>
      </div>
      {open && (
        <div className="sec-body" id={`sec-body-${k}`}>
          {children}
          <div className="sec-foot">{footer}</div>
        </div>
      )}
    </section>
  );
}

export function NextButton({ k, label, lime }: { k: number; label: string; lime?: boolean }) {
  const { dispatch } = useStore();
  const mine = SECTION_MINE[k] ?? undefined;
  return (
    <button
      type="button"
      className={`btn ${lime ? 'lime' : 'dark'}`}
      onClick={() => {
        dispatch({ type: 'confirm', section: k, mine });
        requestAnimationFrame(() => document.getElementById(`sezione-${k + 1}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
      }}
    >
      {label} <span aria-hidden="true">→</span>
    </button>
  );
}

export function SectionNav() {
  const { state, dispatch } = useStore();
  return (
    <nav className="sec-nav" aria-label="Sezioni">
      {SECTION_TITLES.map((t, k) => {
        const on = state.open === k;
        const done = state.done.includes(k);
        return (
          <button
            key={k}
            type="button"
            className={`tab${on ? ' on' : ''}`}
            aria-current={on ? 'step' : undefined}
            onClick={() => {
              if (!on) dispatch({ type: 'open', section: k });
              requestAnimationFrame(() => document.getElementById(`sezione-${k}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
            }}
          >
            <span className={`sec-num small${on ? ' active' : done ? ' done' : ''}`} aria-hidden="true">
              {done && !on ? '✓' : k}
            </span>
            <span className="tab-label">{t}</span>
            {done && <span className="sr-only"> (fatto)</span>}
          </button>
        );
      })}
    </nav>
  );
}
