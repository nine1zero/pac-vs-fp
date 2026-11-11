import { useMemo } from 'react';
import { paramSource } from '../../data/catalog';
import { toModelParams, useStore } from '../../state/store';
import { Range } from '../controls';
import { euro } from '../format';
import { computeResults, SCENARIO_DESC, SCENARIO_NAMES, SCENARIO_ROLE } from '../results';
import { SavingLockNote } from '../SavingLockNote';
import { Src } from '../Tip';
import { EtfBox, EtfMenu } from './EtfMenu';
import { SectionNav } from './Section';
import { Sec0, Sec1, Sec2, Sec3, Sec4, Sec5, Sec6 } from './Sections';

export function Landing() {
  const { state, dispatch } = useStore();
  const p = useMemo(() => toModelParams(state.inputs, state.overrides), [state.inputs, state.overrides]);
  const r = useMemo(() => computeResults(p), [p]);
  const row1 = r.firstRow;
  const budget = row1.K;
  const i = state.inputs;
  const isMax = i.saving_mode === 'max';
  const fixValue = Math.max(r.savingMin, Math.min(i.saving ?? r.savingMax, r.savingMax));
  const lim = p.deduction_limit + row1.I;
  const set = (inputs: Partial<typeof i>) => dispatch({ type: 'set', inputs });
  return (
    <main className="wrap main" id="contenuto">
      <section className="hero">
        <div className="hero-text">
          <h1 className="h1">
            Simulatore strategie <EtfMenu /> vs <span className="mark">Fondo Pensione IBM</span> <span className="h1-sub">(comparto azionario)</span>
          </h1>
          <EtfBox />
          <p className="lead">
            Sei sezioni, ognuna si può saltare. Senza i tuoi dati usa un profilo d'esempio con dati verosimili.
            <br />
            SOLO per gli iscritti{' '}
            <a href="https://www.fondopensioneibm.it/" target="_blank" rel="noopener noreferrer">
              FPDDI IBM
            </a>{' '}
            <span className="mark lead-mark">100% azionario</span>.
          </p>
        </div>
      </section>
      <section className="scenarios-intro" aria-label="I tre scenari confrontati a parità di risparmio">
        <div className="budget-banner">
          <div className="budget-banner-main">
            <span className="budget-pill">La domanda</span>
            <h2 className="budget-q">
              Dove conviene mettere <span className="mark">il risparmio in più</span>: nel Fondo o in un PAC su ETF?
            </h2>
            <p className="budget-text">
              <strong className="ink">Stessa cifra, tre modi di investirla.</strong> Decidi solo dove va il tuo risparmio aggiuntivo (qui accanto):{' '}
              <strong>tutto nel Fondo</strong>, <strong>tutto nel PAC</strong> o <strong>il minimo nel Fondo e il resto nel PAC</strong>. Il rimborso IRPEF, quando
              c'è, va nel PAC. TFR ({euro(row1.G)}/anno) e posizione già maturata ({euro(p.current_position)}) restano comunque nel Fondo.
            </p>
          </div>
          <div className="budget-box">
            <span className="budget-box-head">
              <span className="cap">Risparmio aggiuntivo · 1° anno</span>
              <span className="budget-box-month">{euro(Math.round(budget / 12))}/mese</span>
            </span>
            <span className="budget-box-val" data-testid="budget-year">
              {euro(budget)}
              <span>/anno</span>
            </span>
            <Range
              label="Risparmio aggiuntivo annuo"
              className="mini"
              min={r.savingMin}
              max={r.savingSliderMax}
              step={50}
              value={isMax ? r.savingSliderMax : fixValue}
              valueText={`${euro(budget)} l'anno`}
              onChange={(v) => set({ saving_mode: 'fix', saving: Math.min(r.savingMax, v) })}
            />
            <span className="ticks budget-ticks">
              <span>min {euro(r.savingMin)}</span>
              <span>max {euro(r.savingMax)}</span>
            </span>
            {r.savingLocked ? (
              <SavingLockNote r={r} />
            ) : isMax ? (
              <span className="budget-box-note">Ora: deduzione massima. Sposta lo slider per un importo fisso.</span>
            ) : (
              <span className="budget-box-note row">
                Ora: importo fisso.
                <button type="button" className="pill-btn" onClick={() => set({ saving_mode: 'max' })}>
                  Torna al massimo
                </button>
              </span>
            )}
          </div>
        </div>
        <div className="g3">
          {[0, 1, 2].map((k) => {
            const s = row1.s[k]!;
            const fs = budget > 0 ? Math.min(1, Math.max(0, s.member / budget)) : 0;
            const ps = 1 - fs;
            const pc0 = (x: number) => `${Math.round(x * 100)}%`;
            const w = (x: number) => `${Math.min(100, (x / lim) * 100).toFixed(1)}%`;
            const fundLab = fs >= 0.16 ? `Fondo ${pc0(fs)}` : fs > 0 ? pc0(fs) : '';
            const pacLab = ps >= 0.16 ? `PAC ${pc0(ps)}` : ps > 0.06 ? pc0(ps) : '';
            return (
              <div key={k} className={`scard s${k + 1}`}>
                <div className="scard-top">
                  <span className="row-gap">
                    <span className={`tag s${k + 1}`}>{k + 1}</span>
                    <span className="scard-name">{SCENARIO_NAMES[k]}</span>
                  </span>
                  <span className="scard-role">{SCENARIO_ROLE[k]}</span>
                </div>
                <span className="scard-desc">{SCENARIO_DESC[k]}</span>
                <div className="scard-alloc">
                  <span className="scard-alloc-head">
                    <span className="scard-alloc-title">Il tuo risparmio aggiuntivo</span>
                    <strong>sempre {euro(budget)}/anno</strong>
                  </span>
                  <span className="scard-bar" role="img" aria-label={`Risparmio aggiuntivo ${euro(budget)}: Fondo ${pc0(fs)}, PAC ${pc0(ps)}`}>
                    {fs > 0 && (
                      <span className={`scard-seg fund${ps > 0 ? ' split' : ''}`} style={{ width: `${(fs * 100).toFixed(1)}%` }}>
                        {fundLab}
                      </span>
                    )}
                    {ps > 0 && (
                      <span className="scard-seg pac" style={{ width: `${(ps * 100).toFixed(1)}%` }}>
                        {pacLab}
                      </span>
                    )}
                  </span>
                  <span className="scard-alloc-labels">
                    <span>
                      <span className="scard-dot fund" aria-hidden="true" />
                      Fondo <strong>{euro(s.member)}</strong>
                    </span>
                    <span>
                      PAC <strong>{euro(Math.max(0, budget - s.member))}</strong>
                      <span className="scard-dot pac after" aria-hidden="true" />
                    </span>
                  </span>
                  <span className="scard-alloc-head sep">
                    <span className="scard-alloc-title">Nel Fondo</span>
                    <span className="scard-lim">
                      tetto deducibile <strong>{euro(lim)}</strong>{' '}
                      <Src kind={paramSource('deduction_limit').kind} source={paramSource('deduction_limit').source} what="tetto deducibile" align="right" />
                    </span>
                  </span>
                  <span
                    className="scard-fundbar"
                    role="img"
                    aria-label={`Nel Fondo: tuo ${euro(s.member)} e azienda ${euro(s.employer)} su un tetto deducibile di ${euro(lim)}`}
                  >
                    {s.member > 0 && <span className="scard-seg fund" style={{ width: w(s.member) }} />}
                    {s.employer > 0 && (
                      <span className={`scard-seg ibm${s.member + s.employer < lim - 1 ? ' open' : ''}`} style={{ width: w(s.employer) }}>
                        {s.employer / lim >= 0.12 ? 'IBM' : ''}
                      </span>
                    )}
                  </span>
                  <span className="scard-alloc-labels start">
                    <span>
                      <span className="scard-dot fund" aria-hidden="true" />
                      tuo <strong>{euro(s.member)}</strong>
                    </span>
                    <span>
                      <span className="scard-dot ibm" aria-hidden="true" />
                      IBM <strong className={s.employer > 0 ? '' : 'scard-neg'}>{s.employer > 0 ? euro(s.employer) : '0 €'}</strong>
                    </span>
                  </span>
                  <span className="scard-alloc-head">
                    <span className="scard-alloc-title">Rimborso IRPEF → PAC</span>
                    <strong className={s.irpef_saving > 0 ? '' : 'scard-muted'}>{s.irpef_saving > 0 ? `+${euro(s.irpef_saving)}` : '0 €'}</strong>
                  </span>
                  <span className="scard-refbar" role="img" aria-label={`Rimborso IRPEF reinvestito nel PAC: ${euro(s.irpef_saving)} (stessa scala del tetto deducibile)`}>
                    {s.irpef_saving > 0 && <span style={{ width: w(s.irpef_saving) }} />}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
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
