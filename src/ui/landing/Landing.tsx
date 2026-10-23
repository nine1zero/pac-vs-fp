import { useMemo } from 'react';
import { toModelParams, useStore } from '../../state/store';
import { EXAMPLE_PARAMS } from '../../model';
import { euro, pct } from '../format';
import { computeResults, SCENARIO_DESC, SCENARIO_NAMES, type Results } from '../results';
import { Src } from '../Tip';
import { EtfBox, EtfMenu } from './EtfMenu';
import { SectionNav } from './Section';
import { breakPhrase, Sec0, Sec1, Sec2, Sec3, Sec4, Sec5, Sec6 } from './Sections';

export function Landing() {
  const { state } = useStore();
  const p = useMemo(() => toModelParams(state.inputs), [state.inputs]);
  const r = useMemo(() => computeResults(p), [p]);
  return (
    <main className="wrap main" id="contenuto">
      <section className="hero">
        <div className="hero-text">
          <h1 className="h1">
            Simulatore strategie <EtfMenu /> vs <span className="mark">Fondo Pensione IBM</span>
          </h1>
          <EtfBox />
          <p className="lead">
            Sei sezioni, ognuna si può saltare. Senza i tuoi dati usa un profilo d'esempio con dati verosimili.
            <br />
            SOLO per gli iscritti FPDDI IBM <span className="mark">a comparto Azionario</span>.
          </p>
        </div>
      </section>
      <div className="g3">
        {[0, 1, 2].map((k) => (
          <div key={k} className="scard">
            <span className="row-gap">
              <span className={`tag s${k + 1}`}>{k + 1}</span>
              <span className="scard-name">{SCENARIO_NAMES[k]}</span>
            </span>
            <span className="scard-desc">{SCENARIO_DESC[k]}</span>
          </div>
        ))}
      </div>
      <AnswerLine r={r} />
      <SectionNav />
      <Sec0 />
      <Sec1 r={r} />
      <Sec2 r={r} />
      <Sec3 r={r} />
      <Sec4 />
      <Sec5 r={r} />
      <Sec6 />
    </main>
  );
}

/** Risposta sempre visibile (SPEC par. 8 punto 6, decisione dell'autore del 23/10/2026). */
export function AnswerLine({ r }: { r: Results }) {
  const { state } = useStore();
  const [b, second] = r.rank as [number, number];
  const d = state.inputs.delta;
  const h = r.horizon21;
  const first = EXAMPLE_PARAMS.start_year;
  let horizon: string;
  if (h === null) horizon = `con ${pct(d, 1, true)} la deduzione massima (2) batte il minimo per l'azienda (1) per qualsiasi uscita fino al ${r.exitYear}`;
  else if (h === 1) horizon = `con ${pct(d, 1, true)} il minimo per l'azienda (1) batte la deduzione massima (2) per qualsiasi uscita`;
  else
    horizon = `con ${pct(d, 1, true)} la deduzione massima (2) batte il minimo per l'azienda (1) se esci entro ${h - 1} ${h - 1 === 1 ? 'anno' : 'anni'} (entro il ${
      first + h - 2
    }); oltre conviene la 1`;
  return (
    <div className="answer" data-testid="answer">
      <p aria-live="polite">
        <span className="cap">Risposta</span> Oggi conviene <strong className="mark">
          {b + 1} · {SCENARIO_NAMES[b]}
        </strong>
        : <strong data-testid="best-total">{euro(r.res[b]!.total_net)}</strong> netti, {euro(r.res[b]!.total_net - r.res[second]!.total_net)} più della seconda.
      </p>
      <p className="answer-sub">
        Pareggi: {r.breakevens.map(({ pair, value }) => breakPhrase(pair, value).replace(/\.$/, '')).join(' · ')}. Poi {horizon}{' '}
        <Src
          kind="Calcolo"
          source="Pareggio: differenziale per cui i due scenari danno lo stesso capitale netto, con la bisezione; orizzonte: primo anno di uscita (riscatto prima dell'ultimo) da cui conviene la 1 con il differenziale scelto (docs/FORMULE.md par. 9, SPEC par. 4.6)."
          what="pareggi e orizzonte"
        />
      </p>
    </div>
  );
}
