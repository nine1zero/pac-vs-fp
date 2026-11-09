import { useMemo } from 'react';
import { toModelParams, useStore } from '../../state/store';
import { EXAMPLE_PARAMS } from '../../model';
import { euro, pct } from '../format';
import { computeResults, SCENARIO_DESC, SCENARIO_NAMES, SCENARIO_ROLE, type Results } from '../results';
import { Src } from '../Tip';
import { EtfBox, EtfMenu } from './EtfMenu';
import { SectionNav } from './Section';
import { breakPhrase, Sec0, Sec1, Sec2, Sec3, Sec4, Sec5, Sec6 } from './Sections';

export function Landing() {
  const { state } = useStore();
  const p = useMemo(() => toModelParams(state.inputs, state.overrides), [state.inputs, state.overrides]);
  const r = useMemo(() => computeResults(p), [p]);
  const row1 = r.firstRow;
  const budget = row1.K;
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
      <section className="scenarios-intro" aria-label="I tre scenari confrontati a parità di budget">
        <div className="budget-banner">
          <div className="budget-banner-main">
            <span className="budget-pill">Stesso identico budget nei 3 scenari</span>
            <p className="budget-text">
              In tutte e tre le strategie metti di tasca tua <strong>esattamente la stessa cifra</strong>: nel 1° anno{' '}
              <strong>{euro(budget)}/anno</strong> ({euro(Math.round(budget / 12))}/mese), oltre al <strong>TFR ({euro(row1.G)}/anno)</strong> e alla{' '}
              <strong>posizione già maturata ({euro(p.current_position)})</strong> che restano sempre nel Fondo.{' '}
              <span className="mark">L’unica scelta è quanto del tuo budget allocare nel Fondo e quanto nel PAC ETF autonomo</span> (più il rimborso IRPEF reinvestito nel PAC).
            </p>
          </div>
          <div className="budget-legend" aria-hidden="true">
            <span className="budget-leg-item">
              <span className="scard-dot fund" /> Quota budget nel Fondo
            </span>
            <span className="budget-leg-item">
              <span className="scard-dot pac" /> Quota budget nel PAC ETF
            </span>
          </div>
        </div>
        <div className="g3">
          {[0, 1, 2].map((k) => {
            const s = row1.s[k]!;
            const fromBudgetToFund = s.member;
            const fromBudgetToPac = Math.max(0, budget - s.member);
            const fundShare = budget > 0 ? Math.min(1, Math.max(0, fromBudgetToFund / budget)) : 0;
            const pacShare = Math.max(0, 1 - fundShare);
            return (
              <div key={k} className="scard">
                <div className="scard-top">
                  <span className="row-gap">
                    <span className={`tag s${k + 1}`}>{k + 1}</span>
                    <span className="scard-name">{SCENARIO_NAMES[k]}</span>
                  </span>
                  <span className="scard-role">{SCENARIO_ROLE[k]}</span>
                </div>
                <span className="scard-desc">{SCENARIO_DESC[k]}</span>
                <div className="scard-alloc">
                  <div className="scard-alloc-title">Come dividi il tuo budget ({euro(budget)}/a)</div>
                  <div className="scard-alloc-labels">
                    <span>
                      <span className="scard-dot fund" aria-hidden="true" />
                      Fondo <strong>{pct(fundShare, 0)}</strong> ({euro(fromBudgetToFund)})
                    </span>
                    <span>
                      <span className="scard-dot pac" aria-hidden="true" />
                      PAC <strong>{pct(pacShare, 0)}</strong> ({euro(fromBudgetToPac)})
                    </span>
                  </div>
                  <div className="scard-alloc-bar" aria-hidden="true">
                    {fundShare > 0 && <span className="scard-seg fund" style={{ width: `${fundShare * 100}%` }} />}
                    {pacShare > 0 && <span className="scard-seg pac" style={{ width: `${pacShare * 100}%` }} />}
                  </div>
                </div>
                <div className="scard-flows">
                  <div className="scard-flow-row">
                    <span className="scard-flow-k">Contributo IBM (Fondo)</span>
                    <strong className={s.employer > 0 ? 'scard-pos' : 'scard-neg'}>
                      {s.employer > 0 ? `+${euro(s.employer)}/a` : '0 € · perso'}
                    </strong>
                  </div>
                  <div className="scard-flow-row">
                    <span className="scard-flow-k">Rimborso IRPEF (→ PAC)</span>
                    <strong className={s.irpef_saving > 0 ? 'scard-pos' : 'scard-muted'}>
                      {s.irpef_saving > 0 ? `+${euro(s.irpef_saving)}/a` : '0 €'}
                    </strong>
                  </div>
                  <div className="scard-flow-row tot">
                    <span className="scard-flow-k">Flusso 1° anno (+TFR)</span>
                    <span>
                      Fondo <strong>{euro(s.fund)}</strong> · PAC <strong>{euro(s.pac)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
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

/** Risposta sempre visibile (SPEC par. 8 punto 6). */
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
