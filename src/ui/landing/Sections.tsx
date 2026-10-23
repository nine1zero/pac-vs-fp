// Le sette sezioni della Landing (prototipo spec/design/v2/Landing.dc.html, SPEC par. 3.0).
import { useState, type DragEvent } from 'react';
import { params } from '../../data';
import { etfById, etfCatalog, paramSource } from '../../data/catalog';
import { successMessage } from '../../import/dettaglio';
import { EXAMPLE_PARAMS } from '../../model';
import { useStore, type Inputs } from '../../state/store';
import { DeltaZones, ExitStrip } from '../charts/Bars';
import { HeatMap } from '../charts/HeatMap';
import { LineChart, type Marker } from '../charts/LineChart';
import { Chips, NumField, Range, Segmented } from '../controls';
import { euro, euroK, pct, pctShort } from '../format';
import { HISTORY, LINE_DELTAS, MAP_DELTAS, SCENARIO_NAMES, type Results } from '../results';
import { Src, Tip } from '../Tip';
import { useImport } from '../useImport';
import { NextButton, Section } from './Section';

const P = EXAMPLE_PARAMS;
const ps = (id: string) => paramSource(id);

function useSet() {
  const { dispatch } = useStore();
  return (inputs: Partial<Inputs>) => dispatch({ type: 'set', inputs });
}

export function ExitModeSeg({ small }: { small?: boolean }) {
  const { state } = useStore();
  const set = useSet();
  return (
    <Segmented
      label="Modalità di uscita"
      small={small}
      value={state.inputs.exit_mode}
      onChange={(v) => set({ exit_mode: v })}
      options={[
        { value: 'Pensione', label: `Pensione ${pctShort(P.exit_tax_max)}→${pctShort(P.exit_tax_min)}` },
        { value: 'Riscatto', label: `Riscatto ${pctShort(P.redemption_tax)}` },
      ]}
    />
  );
}

function ExitModeSources() {
  return (
    <Src
      kind="Norma"
      source={`Pensione: ${ps('exit_tax_max').source} Riscatto: ${ps('redemption_tax').source}`}
      what="aliquote di uscita"
    />
  );
}

/* 0 · AVVERTENZE */
export function Sec0() {
  const { dispatch } = useStore();
  return (
    <Section
      k={0}
      title="Prima di iniziare"
      subtitle="Chi siamo, cosa fa questo strumento e cosa non fa"
      badge="Da leggere"
      summary={
        <>
          Indipendente <span className="dot-sep">·</span> Locale <span className="dot-sep">·</span> Non è consulenza
        </>
      }
      footer={
        <>
          <span className="muted">Prima di decidere verifica sempre i documenti ufficiali del fondo e, se serve, un consulente abilitato.</span>
          <span className="row-gap">
            <button type="button" className="btn ghost" onClick={() => dispatch({ type: 'skipToResult' })}>
              Mostrami subito l'esempio
            </button>
            <NextButton k={0} label="Ho capito, iniziamo" />
          </span>
        </>
      }
    >
      <div className="g3">
        <div className="panel">
          <span className="cap">Indipendente</span>
          <span className="text">
            Non è uno strumento del Fondo Pensione per i Dipendenti e Dirigenti IBM, né di IBM, né di un gestore o di un intermediario. Non vende nulla e
            non riceve commissioni.
          </span>
        </div>
        <div className="panel">
          <span className="cap">I tuoi dati restano qui</span>
          <span className="text">
            Calcolo e lettura del file avvengono nel tuo browser. Nessun dato viene inviato, nessun account, nessun tracciamento. Chiudendo la pagina
            tutto si cancella, salvo che tu scelga «Salva i miei dati».
          </span>
        </div>
        <div className="panel">
          <span className="cap">Non è consulenza</span>
          <span className="text">
            È una simulazione informativa su dati storici pubblicati e ipotesi che puoi cambiare. I rendimenti passati non garantiscono quelli futuri. Le
            norme fiscali possono cambiare.
          </span>
        </div>
      </div>
    </Section>
  );
}

/* 1 · ETÀ E ORIZZONTE */
export function Sec1({ r }: { r: Results }) {
  const { state } = useStore();
  const set = useSet();
  const i = state.inputs;
  const minExit = Math.max(45, P.start_year - i.birth_year);
  return (
    <Section
      k={1}
      title="Età e orizzonte"
      subtitle="Quando esci dal fondo decide quanti anni di versamenti simuliamo"
      summary={`Nato nel ${i.birth_year} · uscita ${r.exitYear} (${i.exit_mode === 'Riscatto' ? 'riscatto' : 'pensione'}) · ${r.n} anni`}
      footer={
        <>
          <span className="muted">
            Prima adesione a un fondo pensione: <strong>{i.first_join_year}</strong> · anni di iscrizione all'uscita:{' '}
            <strong>{r.exitYear - i.first_join_year}</strong>
          </span>
          <NextButton k={1} label="Conferma e passa al tuo fondo" />
        </>
      }
    >
      <div className="g3">
        <div className="panel">
          <span className="panel-head">
            <span className="cap">Anno di nascita</span>
            <span className="val">{i.birth_year}</span>
          </span>
          <Range label="Anno di nascita" min={1955} max={2005} step={1} value={i.birth_year} valueText={String(i.birth_year)} onChange={(v) => set({ birth_year: v })} />
          <span className="ticks">
            <span>1955</span>
            <span>1980</span>
            <span>2005</span>
          </span>
          <Chips label="Anni di nascita rapidi" options={[1970, 1980, 1990, 2000].map((v) => ({ label: String(v), value: v }))} isOn={(v) => v === i.birth_year} onPick={(v) => set({ birth_year: v })} />
        </div>
        <div className="panel">
          <span className="panel-head">
            <span className="cap">Età di uscita</span>
            <span className="val">{i.exit_age} anni</span>
          </span>
          <Range label="Età di uscita" min={minExit} max={72} step={1} value={i.exit_age} valueText={`${i.exit_age} anni`} onChange={(v) => set({ exit_age: v })} />
          <span className="ticks">
            <span>{minExit}</span>
            <span>
              67 = vecchiaia <Src kind="Norma" source={ps('exit_age').source} what="età di vecchiaia" />
            </span>
            <span>72</span>
          </span>
          <span className="cap">
            Come uscirai <ExitModeSources />
          </span>
          <ExitModeSeg />
        </div>
        <div className="panel">
          <span className="cap">Uscita prevista</span>
          <span className="big-year">{r.exitYear}</span>
          <span className="text-sm">
            {r.n} anni di versamenti simulati, dal {P.start_year} <Src kind={ps('start_year').kind} source={ps('start_year').source} what="primo anno simulato" />.
            Se pensi di uscire prima, scegli il riscatto sotto l'età di uscita.
          </span>
        </div>
      </div>
    </Section>
  );
}

/* 2 · IL TUO FONDO */
export function Sec2({ r }: { r: Results }) {
  const { state } = useStore();
  const set = useSet();
  const i = state.inputs;
  const [over, setOver] = useState(false);
  const file = state.file;

  const { readFile, useSample, busy } = useImport();
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    readFile(e.dataTransfer.files[0]);
  };
  const res = file?.result;
  const ok = res && res.status !== 'error';
  const errors = res?.issues.filter((x) => x.severity === 'error') ?? [];
  const warnings = res?.issues.filter((x) => x.severity === 'warning').concat(file?.comparison?.issues ?? []) ?? [];
  const fromFile = state.source === 'file';
  const yearly = (i.min_member_month + i.employer_month + i.tfr_month) * P.months;

  return (
    <Section
      k={2}
      title="Il tuo fondo"
      subtitle="Trascina l'estratto delle contribuzioni: posizione e contributi si compilano da soli"
      summary={`${euro(i.current_position)} · ${i.min_member_month}/${i.employer_month}/${i.tfr_month} €/mese · dal ${i.first_join_year}`}
      footer={
        <>
          <span className="muted">
            Oggi nel fondo arrivano <strong>{euro(yearly)}</strong> l'anno tra te, l'azienda e il TFR
          </span>
          <NextButton k={2} label="Conferma e passa allo stipendio" />
        </>
      }
    >
      <div className="g2">
        <div className="panel">
          <span className="cap">Estratto contribuzioni (.xls)</span>
          <label
            className={`drop${over ? ' over' : ''}${ok ? ' loaded' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
          >
            {ok ? (
              <>
                <span className="drop-title">{res.movements.length} movimenti importati</span>
                <span className="drop-sub">
                  {res.period ? `competenza dal ${mm(res.period[0])} al ${mm(res.period[1])} · ` : ''}trascina un altro file per sostituirlo
                </span>
              </>
            ) : (
              <>
                <span className="drop-title">{busy ? 'Lettura in corso…' : 'Trascina qui DettaglioOperazioni.xls'}</span>
                <span className="drop-sub">o fai clic · Area riservata › Posizione › Operazioni › Esporta</span>
              </>
            )}
            <input type="file" accept=".xls,.html,.htm" onChange={(e) => readFile(e.target.files?.[0])} aria-label="Scegli il file DettaglioOperazioni" />
          </label>
          {ok && (
            <a href="#/versamenti" className="btn dark">
              Vedi i miei versamenti e il grafico <span aria-hidden="true">→</span>
            </a>
          )}
          <span className="row-gap wrap">
            <span className="muted lock">Letto solo nel browser, mai salvato</span>
            <button type="button" className="btn ghost" onClick={useSample}>
              Usa un file d'esempio
            </button>
          </span>
          {errors.length > 0 && (
            <div className="alert error" role="alert">
              <strong>Il file non si può usare.</strong>
              <ul>
                {errors.map((x, j) => (
                  <li key={j}>{x.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="panel">
          <span className="panel-head">
            <span className="cap">Dati della posizione</span>
            <span className={`badge-pill${fromFile ? ' lime' : ''}`}>{fromFile ? 'Dal tuo file' : 'Profilo d’esempio'}</span>
          </span>
          {ok && (
            <ul className="checks" aria-label="Controlli sul file">
              {warnings.length === 0 ? (
                <li className="check ok">✓ {successMessage(res)}</li>
              ) : (
                <>
                  <li className="check ok">✓ {res.movements.length} movimenti letti</li>
                  {warnings.map((x, j) => (
                    <li key={j} className="check warn">
                      ! {x.message}
                    </li>
                  ))}
                </>
              )}
            </ul>
          )}
          <div className="g2 fields">
            <NumField label="Posizione attuale (€)" value={i.current_position} min={0} step={0.01} onChange={(v) => set({ current_position: v })} />
            <NumField label="Anno di prima adesione" value={i.first_join_year} min={1987} max={P.start_year} onChange={(v) => set({ first_join_year: Math.round(v) })} />
            <NumField label="Tuo contributo minimo €/mese" value={i.min_member_month} min={0} step={0.01} onChange={(v) => set({ min_member_month: v })} />
            <NumField label="Contributo azienda €/mese" value={i.employer_month} min={0} step={0.01} onChange={(v) => set({ employer_month: v })} />
            <NumField label="TFR al fondo €/mese" value={i.tfr_month} min={0} step={0.01} onChange={(v) => set({ tfr_month: v })} />
            <NumField
              label="Contributi non dedotti (€)"
              value={i.recoverable_non_deducted}
              min={0}
              onChange={(v) => set({ recoverable_non_deducted: v })}
              hint={
                <Tip label="Cosa sono i contributi non dedotti">
                  Chi ha iniziato a lavorare dopo il 2007 può dedurre fino a {euro(P.recovery_cap)} l'anno in più, dal {P.recovery_from_year_offset + 1}° al{' '}
                  {P.recovery_last_year_offset + 1}° anno di iscrizione, per recuperare i contributi non dedotti nei primi 5 anni. Il residuo è nella Certificazione
                  Unica, punto 419. Se non lo sai lascia 0. Fonte: {ps('recovery_cap').source}
                </Tip>
              }
            />
            <span className="note">
              {P.months} mensilità l'anno (dicembre doppio) <Src kind="Doc. FPDDI" source={ps('months').source} what="mensilità" />. Il contributo
              dell'azienda arriva solo se versi almeno il minimo: nello schema generale IBM Italia 2026 è il 2% della retribuzione lorda fino a{' '}
              {euro(P.inps_first_band)} e il 7% oltre <Src kind="Doc. FPDDI" source={ps('min_member_month').source} what="regola del contributo minimo" />. Con la tua
              RAL sono circa <strong>{euro(r.minMonthlyFromRal)} al mese</strong>. I non dedotti aumentano lo spazio deducibile fino a{' '}
              {euro(P.deduction_limit + P.recovery_cap)} l'anno negli anni ammessi{' '}
              <Src kind="Doc. FPDDI" source={`${ps('deduction_limit').source} ${ps('recovery_cap').source}`} what="limite di deduzione con il recupero" />.
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}

const mm = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/* 3 · STIPENDIO E RISPARMIO */
export function Sec3({ r }: { r: Results }) {
  const { state } = useStore();
  const set = useSet();
  const i = state.inputs;
  const fixValue = Math.max(r.savingMin, Math.min(i.saving ?? r.savingMax, r.savingMax));
  const shown = i.saving_mode === 'max' ? r.savingMax : fixValue;
  return (
    <Section
      k={3}
      title="Stipendio e risparmio"
      subtitle="La RAL fissa il rimborso IRPEF; il risparmio è uguale nei tre scenari"
      summary={`RAL ${euroK(i.ral)} · aliquota ${pct(r.effectiveRate, 1)} · ${i.saving_mode === 'max' ? 'deduzione max' : `${euro(fixValue)}/anno`}`}
      footer={
        <>
          <span className="muted">
            Risparmio fiscale effettivo sulla deduzione massima <strong>{pct(r.effectiveRate, 1)}</strong> · ogni 100 € dedotti te ne restituiscono circa{' '}
            <strong>{Math.round(r.effectiveRate * 100)} €</strong> (IRPEF, detrazioni per lavoro dipendente, cuneo fiscale e addizionali 2026){' '}
            <Src
              kind="Calcolo"
              source="Differenza tra le imposte senza e con la deduzione, con detrazione per lavoro dipendente, cuneo fiscale e addizionali (docs/FORMULE.md par. 2). Scaglioni: L. 199/2025; detrazione: art. 13 TUIR; cuneo: L. 207/2024; addizionale regionale Lombardia e comunale 0,8%."
              what="risparmio fiscale effettivo"
            />
          </span>
          <NextButton k={3} label="Conferma e passa alle ipotesi" />
        </>
      }
    >
      <div className="g2">
        <div className="panel">
          <span className="panel-head">
            <span className="cap">RAL annua</span>
            <span className="val">{euro(i.ral)}</span>
          </span>
          <Range label="RAL annua" min={15000} max={150000} step={500} value={i.ral} valueText={euro(i.ral)} onChange={(v) => set({ ral: v })} />
          <span className="ticks">
            <span>15k</span>
            <span>80k</span>
            <span>150k</span>
          </span>
          <Chips
            label="RAL rapide"
            options={[30000, 45000, 60000, 90000].map((v) => ({ label: `${v / 1000}k`, value: v }))}
            isOn={(v) => v === i.ral}
            onPick={(v) => set({ ral: v })}
          />
        </div>
        <div className="panel">
          <span className="panel-head">
            <span className="cap">Risparmio annuo</span>
            <span className="val">{euro(shown)}</span>
          </span>
          <Segmented
            label="Risparmio annuo"
            value={i.saving_mode}
            onChange={(v) => set(v === 'fix' ? { saving_mode: v, saving: i.saving ?? r.savingMax } : { saving_mode: v })}
            options={[
              { value: 'max', label: 'Deduzione massima' },
              { value: 'fix', label: 'Importo fisso' },
            ]}
          />
          {i.saving_mode === 'fix' && (
            <Range label="Importo annuo" min={r.savingMin} max={r.savingMax} step={50} value={fixValue} valueText={euro(fixValue)} onChange={(v) => set({ saving: v })} />
          )}
          <span className="text-sm">
            {i.saving_mode === 'max' ? (
              <>
                Quanto ti manca per arrivare al limite deducibile ({euro(P.deduction_limit)} con il contributo dell'azienda{' '}
                <Src kind="Doc. FPDDI" source={ps('deduction_limit').source} what="limite deducibile" />
                ): {euro(r.savingMax)} il primo anno, +{pctShort(P.growth)} l'anno <Src kind="Ipotesi" source={ps('growth').source} what="crescita annua" />. È lo
                stesso budget nei tre scenari: il simulatore ti dice dove mettere ogni euro, fondo o ETF.
              </>
            ) : (
              <>
                Da {euro(r.savingMin)} a {euro(r.savingMax)}, cresce del {pctShort(P.growth)} l'anno. Il minimo segue la RAL ({euro(i.ral)}): è la quota minima a
                tuo carico per avere il contributo dell'azienda, 2% fino a {euro(P.inps_first_band)} e 7% oltre. Sotto la quota minima si eliminerebbe uno dei tre
                scenari, «Minimo per l'azienda + PAC». Il massimo è la deduzione massima: ogni euro oltre il limite va comunque nell'ETF, perché nel fondo non
                avrebbe più il vantaggio fiscale.
              </>
            )}
          </span>
        </div>
      </div>
    </Section>
  );
}

/* 4 · IPOTESI */
export function Sec4() {
  const { state } = useStore();
  const set = useSet();
  const i = state.inputs;
  const e = etfById(i.etf_id);
  const st = HISTORY.stats;
  const presetLabel: Record<string, string> = { storico: 'Storico', ultimi10: '10 anni', ultimi5: '5 anni', benchmark: 'Benchmark', passivo: 'Passivo' };
  const h = e.returns;
  const ltcma = P.etf_gross_return;
  const etfChoices = [
    { label: `Stima lungo periodo ${pctShort(ltcma, 1)}`, value: ltcma, title: ps('etf_gross_return').source },
    { label: `5 anni · ${h.y5 === null ? 'n.d.' : pctShort(h.y5, 1)}`, value: h.y5 === null ? null : h.y5 + e.ter, title: `Media annua al ${h.as_of}` },
    { label: `10 anni · ${h.y10 === null ? 'n.d.' : pctShort(h.y10, 1)}`, value: h.y10 === null ? null : h.y10 + e.ter, title: `Media annua al ${h.as_of}` },
    {
      label: `Dal lancio (${h.launch}) · ${h.since_launch === null ? 'n.d.' : pctShort(h.since_launch, 1)}`,
      value: h.since_launch === null ? null : h.since_launch + e.ter,
      title: `Media annua dal ${h.launch} al ${h.as_of}`,
    },
  ];
  return (
    <Section
      k={4}
      title="Ipotesi di rendimento"
      subtitle="Quanto renderà il fondo rispetto all'ETF: il dato che decide tutto"
      summary={`Δ ${pct(i.delta, 1, true)} · ETF ${pctShort(i.etf_gross_return, 2)} · ${i.exit_mode}`}
      footer={
        <>
          <span className="muted">ETF dopo costi e bollo · fondo dopo costi, prima dell'imposta del 20% sui rendimenti</span>
          <NextButton k={4} label="Calcola il risultato" />
        </>
      }
    >
      <div className="g2">
        <div className="panel">
          <span className="panel-head">
            <span className="cap">Differenziale fondo − ETF, annuo</span>
            <span className="val">{pct(i.delta, 1, true)}</span>
          </span>
          <DeltaSlider />
          <span className="ticks">
            <span>−12: fondo molto peggiore</span>
            <span>0: come l'ETF</span>
            <span>+3</span>
          </span>
          <span className="row-gap wrap">
            <Chips
              label="Differenziali calcolati dai dati"
              options={HISTORY.presets.map((x) => ({
                label: `${presetLabel[x.id]} ${pct(x.value, 1, true).replace('%', '')}`,
                value: x.value,
                title: x.years ? `CAGR ${x.years[0]}-${x.years[1]}` : 'Un fondo che rendesse come l’ETF',
              }))}
              isOn={(v) => Math.abs(v - i.delta) < 0.0004}
              onPick={(v) => set({ delta: v })}
            />
            <Src
              kind="Calcolo storico"
              source={`Media composta del comparto prima dell'imposta (storico 2014-${HISTORY.last}, ultimi 10 e 5 anni) meno quella di iShares MSCI ACWI in euro; «Benchmark»: benchmark del fondo prima dell'imposta meno ETF; «Passivo»: un fondo che rende come l'ETF (docs/FORMULE.md par. 8). Dati: fpddi_azionario.json, etf_monthly.csv.`}
              what="preset del differenziale"
            />
          </span>
          <span className="note">
            Dal 2012 al {HISTORY.last} il comparto ha reso più dell'ETF globale solo {st.positive} anni su {st.n}. Media dei singoli anni{' '}
            {pct(st.mean, 1, true).replace('%', '')} punti, con il 95% di probabilità tra {pct(st.ci95[0], 1, true).replace('%', '')} e{' '}
            {pct(st.ci95[1], 1, true).replace('%', '')}{' '}
            <Src
              kind="Calcolo storico"
              source="Differenziali annui fondo prima dell'imposta − ETF iShares MSCI ACWI in euro; intervallo = media ± 1,96 × errore standard (docs/FORMULE.md par. 8). Il 2012 e il 2013 sono da ricontrollare sui bilanci (docs/VERIFICHE.md par. 7)."
              what="statistiche storiche"
            />
            .
          </span>
          <a href="#/storico" className="btn dark">
            Vedi lo storico completo: fondo, benchmark ed ETF <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="panel">
          <span className="panel-head">
            <span className="cap">Rendimento ETF atteso, prima del TER</span>
            <span className="val">{pctShort(i.etf_gross_return, 2)}</span>
          </span>
          <EtfReturnSlider />
          <span className="row-gap wrap">
            <Chips
              label="Rendimento atteso"
              options={etfChoices.map((c) => ({ label: c.label, value: c.value, title: c.value === null ? 'Non disponibile: l’ETF non esiste da così tanto tempo' : c.title, disabled: c.value === null }))}
              isOn={(v) => v !== null && Math.abs(v - i.etf_gross_return) < 0.00005}
              onPick={(v) => v !== null && set({ etf_gross_return: v })}
            />
            <Src kind="Emittente" source={`${etfCatalog.sources.returns}.${h.y10_source ? ` ${etfCatalog.sources[h.y10_source]}.` : ''} Stima di lungo periodo: ${ps('etf_gross_return').source}`} what="rendimenti attesi e storici" />
          </span>
          <span className="note">
            Medie annue in euro di {e.short} al {h.as_of.split('-').reverse().join('/')}, già al netto del TER: scegliendole il simulatore aggiunge il TER al valore
            mostrato qui sopra, che è sempre prima dei costi, e lo toglie nel calcolo, così il costo non è contato due volte. Gli ultimi anni sono stati
            eccezionali: per un orizzonte di decenni la stima di lungo periodo è più prudente (J.P. Morgan LTCMA 2026: azionario globale {pctShort(ltcma)} l'anno, in
            dollari, sui prossimi 10–15 anni).
          </span>
        </div>
      </div>
    </Section>
  );
}

export function DeltaSlider({ compact }: { compact?: boolean }) {
  const { state } = useStore();
  const set = useSet();
  const d = state.inputs.delta;
  return (
    <Range
      label={compact ? 'Differenziale' : 'Differenziale annuo fondo meno ETF in punti percentuali'}
      min={-12}
      max={3}
      step={0.1}
      value={Math.round(d * 1000) / 10}
      valueText={pct(d, 1, true)}
      onChange={(v) => set({ delta: v / 100 })}
    />
  );
}

export function EtfReturnSlider() {
  const { state } = useStore();
  const set = useSet();
  const v = state.inputs.etf_gross_return;
  return (
    <Range label="Rendimento atteso dell'ETF prima del TER" min={2} max={21} step={0.1} value={Math.round(v * 10000) / 100} valueText={pctShort(v, 2)} onChange={(x) => set({ etf_gross_return: x / 100 })} />
  );
}

/* 5 · RISULTATO */
export function Sec5({ r }: { r: Results }) {
  const { state, dispatch } = useStore();
  const set = useSet();
  const i = state.inputs;
  const [b, , worst] = r.rank as [number, number, number];
  const res = r.res;
  const firstYear = P.start_year;
  const histDelta = HISTORY.presets[0]!.value;

  let line: { xs: number[]; series: number[][]; markers: Marker[]; xTicks: { x: number; label: string }[]; xLabel: string; aria: string; text: string; cursor?: { x: number; label: string } };
  if (state.lnMode === 'time') {
    const xs = r.time.map((_, k) => k);
    const markers = r.timeCrossings.slice(0, 4).map((c) => ({ x: c.x, y: c.value, label: `Pareggio ${c.pair[0] + 1} = ${c.pair[1] + 1} nel ${Math.round(firstYear + c.x)}` }));
    const txt = r.timeCrossings.map(
      (c) => `Pareggio ${c.pair[0] + 1} = ${c.pair[1] + 1} nel ${Math.round(firstYear + c.x)} (${euroK(c.value)}): da lì in poi, tra le due, è meglio la ${c.winnerAfter + 1}`,
    );
    line = {
      xs,
      series: [0, 1, 2].map((s) => r.time.map((v) => v[s]!)),
      markers,
      xTicks: Array.from({ length: 6 }, (_, k) => {
        const x = Math.round((k / 5) * (r.n - 1));
        return { x, label: String(firstYear + x) };
      }),
      xLabel: 'anno di uscita',
      aria: `Capitale netto nei tre scenari se esci in ciascun anno dal ${firstYear} al ${r.exitYear}, differenziale ${pct(i.delta, 1, true)}, con i punti di pareggio`,
      text: `Capitale netto se esci in quell’anno, con differenziale ${pct(i.delta, 1, true)} e uscita per ${i.exit_mode === 'Riscatto' ? 'riscatto' : 'pensione'}. ${
        txt.length ? `${txt.join(' · ')}.` : 'Le linee non si incrociano: lo stesso scenario vince in ogni anno.'
      }`,
    };
  } else {
    const markers: Marker[] = [];
    const txt: string[] = [];
    for (const { pair, value } of r.breakevens) {
      if (typeof value !== 'number' || value < -0.12 || value > 0.03) continue;
      // capitale al pareggio: interpolato sulla griglia dei differenziali
      const k = Math.min(LINE_DELTAS.length - 2, Math.max(0, Math.floor((value + 0.12) / 0.0025)));
      const t = (value - LINE_DELTAS[k]!) / 0.0025;
      const y = r.byDelta[k]![pair[0]]! + (r.byDelta[k + 1]![pair[0]]! - r.byDelta[k]![pair[0]]!) * t;
      const label = `Pareggio ${pair[0] + 1} = ${pair[1] + 1} a ${pct(value, 1, true)}`;
      markers.push({ x: value, y, label });
      txt.push(`${label} (${euroK(y)})`);
    }
    line = {
      xs: LINE_DELTAS,
      series: [0, 1, 2].map((s) => r.byDelta.map((v) => v[s]!)),
      markers,
      xTicks: [-0.12, -0.09, -0.06, -0.03, 0, 0.03].map((x) => ({ x, label: x === 0 ? '0' : pct(x, 0, true) })),
      xLabel: 'differenziale annuo fondo − ETF',
      aria: `Capitale netto all’uscita nel ${r.exitYear} nei tre scenari al variare del differenziale, con i punti di pareggio`,
      text: `Uscita nel ${r.exitYear} con ${i.exit_mode === 'Riscatto' ? 'riscatto' : 'pensione'}. Dove due linee si incrociano i due scenari danno lo stesso capitale: ${
        txt.length ? `${txt.join(' · ')}.` : 'nessun pareggio tra −12% e +3%: vince sempre lo stesso scenario.'
      }`,
      cursor: { x: Math.max(-0.12, Math.min(0.03, i.delta)), label: `tu: ${pct(i.delta, 1, true)}` },
    };
  }

  return (
    <Section
      k={5}
      title="Risultato e punti di pareggio"
      subtitle="Capitale netto all'uscita, chi vince a ogni differenziale e per ogni anno di uscita"
      badge={`Vince la ${b + 1} · ${euroK(res[b]!.total_net)}`}
      summary={[0, 1, 2].map((k) => (
        <span key={k} className={`sum-s s${k + 1}${k === b ? ' best' : ''}`}>
          {k + 1} · {euroK(res[k]!.total_net)}
        </span>
      ))}
      footer={
        <>
          <span className="muted">Stesso risparmio netto nei tre scenari · rimborso IRPEF reinvestito nel PAC · valori stimati, non garantiti</span>
          <NextButton k={5} label="Vedi assunzioni e fonti" lime />
        </>
      }
    >
      <p className="result-head" aria-live="polite">
        Con un differenziale di {pct(i.delta, 1, true)} e uscita nel {r.exitYear} conviene{' '}
        <span className="mark">
          {b + 1} · {SCENARIO_NAMES[b]}
        </span>
        : {euro(res[b]!.total_net)} netti, {euro(res[b]!.total_net - res[worst]!.total_net)} più della peggiore.
      </p>
      <div className="g3">
        {[0, 1, 2].map((k) => {
          const on = k === b;
          return (
            <div key={k} className={`rcard s${k + 1}${on ? ' best' : ''}`}>
              <span className="rcard-head">
                <span className="row-gap">
                  <span className={`tag s${k + 1}`}>{k + 1}</span>
                  <span className="rcard-name">{SCENARIO_NAMES[k]}</span>
                </span>
                <span className={`badge-pill${on ? ' lime' : ''}`}>{on ? 'Conviene' : `−${euro(res[b]!.total_net - res[k]!.total_net)}`}</span>
              </span>
              <span className="rcard-total">{euro(res[k]!.total_net)}</span>
              <span className="text-sm">
                {euro(res[k]!.total_real)} in euro di oggi{' '}
                <Src kind="Ipotesi" source={`Inflazione ${pctShort(P.inflation)} l'anno dal ${P.base_year_real}: ${ps('inflation').source}`} what="euro di oggi" />
              </span>
              <span className="text-sm muted">
                Fondo {euro(res[k]!.fund_net)} · PAC {euro(res[k]!.pac_net)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-sm muted">
        Capitale netto all'uscita: fondo meno l'imposta d'uscita sulla parte tassabile, più il PAC meno il 26% sulle plusvalenze{' '}
        <Src kind="Calcolo" source="docs/FORMULE.md par. 7: fondo netto = fondo − aliquota d'uscita × base tassabile; PAC netto = PAC − 26% × plusvalenza; bollo 0,2% annuo già tolto." what="capitale netto" />
        .
      </p>
      <div className="g2">
        <div className="panel">
          <span className="cap">Chi vince a ogni differenziale</span>
          <DeltaZones deltas={LINE_DELTAS} winners={r.zones} current={i.delta} />
          <span className="ticks">
            <span>−12%</span>
            <span>−6%</span>
            <span>0</span>
            <span>+3%</span>
          </span>
          <ul className="breaks">
            {r.breakevens.map(({ pair, value }) => (
              <li key={pair.join()}>{breakPhrase(pair, value)}</li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <span className="cap">Se esci nel… conviene</span>
          <ExitStrip firstYear={firstYear} winners={r.strip} />
          <span className="ticks">
            <span>{firstYear}</span>
            <span>prima dell'ultimo anno: riscatto {pctShort(P.redemption_tax)}</span>
            <span>{r.exitYear}</span>
          </span>
          <Legend />
        </div>
      </div>

      <div className="band">
        <span className="cap">Parametri dei grafici qui sotto</span>
        <div className="g4">
          <label className="band-field">
            <span>
              Differenziale <strong>{pct(i.delta, 1, true)}</strong>
            </span>
            <DeltaSlider compact />
          </label>
          <label className="band-field">
            <span>
              Rendimento ETF <strong>{pctShort(i.etf_gross_return, 2)}</strong>
            </span>
            <EtfReturnSlider />
          </label>
          <label className="band-field">
            <span>
              Età di uscita <strong>{i.exit_age} anni</strong>
            </span>
            <Range label="Età di uscita" min={Math.max(45, P.start_year - i.birth_year)} max={72} step={1} value={i.exit_age} valueText={`${i.exit_age} anni`} onChange={(v) => set({ exit_age: v })} />
          </label>
          <label className="band-field">
            <span>
              RAL <strong>{euro(i.ral)}</strong>
            </span>
            <Range label="RAL" min={15000} max={150000} step={500} value={i.ral} valueText={euro(i.ral)} onChange={(v) => set({ ral: v })} />
          </label>
        </div>
        <ExitModeSeg small />
      </div>

      <div className="panel">
        <span className="cap">Per quanti anni conviene</span>
        <span className="text-sm">
          Ogni casella è un anno di uscita (in orizzontale) e un differenziale fondo − ETF (in verticale), colorata con lo scenario che vince. Più il colore è pieno,
          più il vantaggio sul secondo è grande. Muovi i parametri e la mappa si ricalcola; clicca una casella per provare quell’uscita e quel differenziale.
        </span>
        <span className="text-sm muted">
          {r.n} anni di uscita · prima dell’ultimo anno uscita con riscatto {pctShort(P.redemption_tax)}
        </span>
        <HeatMap
          map={r.map}
          firstYear={firstYear}
          delta={i.delta}
          histDelta={histDelta}
          onPick={(h, d) => set({ exit_age: Math.max(45, Math.min(72, firstYear + h - 1 - i.birth_year)), delta: Math.round(d * 10000) / 10000 })}
        />
        <span className="sr-only">Differenziali della mappa da {pct(MAP_DELTAS[0]!, 0, true)} a {pct(MAP_DELTAS[MAP_DELTAS.length - 1]!, 0, true)}, passo 0,25 punti.</span>
      </div>

      <div className="panel">
        <span className="panel-head wrap">
          <span className="cap">Capitale netto nei tre scenari e punti di pareggio</span>
          <Segmented
            small
            label="Asse orizzontale"
            value={state.lnMode}
            onChange={(v) => dispatch({ type: 'lnMode', mode: v })}
            options={[
              { value: 'time', label: 'Nel tempo' },
              { value: 'delta', label: 'Al variare del differenziale' },
            ]}
          />
        </span>
        <span className="text-sm">{line.text}</span>
        <span className="legend">
          <Legend inline />
          <span className="leg">
            <span className="leg-dot" />
            pareggio
          </span>
        </span>
        <LineChart xs={line.xs} series={line.series} markers={line.markers} xTicks={line.xTicks} xLabel={line.xLabel} ariaLabel={line.aria} cursor={line.cursor} />
      </div>
    </Section>
  );
}

export function breakPhrase(pair: [number, number], v: number | string): string {
  const label = `${pair[0] + 1} contro ${pair[1] + 1}`;
  if (v === 'sempre') return `${label}: vince sempre la ${pair[0] + 1}.`;
  if (v === 'mai') return `${label}: vince sempre la ${pair[1] + 1}.`;
  return `${label}: pareggio a ${pct(v as number, 1, true)} (sopra vince la ${pair[0] + 1}, sotto la ${pair[1] + 1}).`;
}

function Legend({ inline }: { inline?: boolean }) {
  return (
    <span className={inline ? 'legend-inline' : 'legend'}>
      {[0, 1, 2].map((k) => (
        <span key={k} className="leg">
          <span className={`leg-sw s${k + 1}`} />
          {k + 1} · {inline ? SCENARIO_NAMES[k] : SCENARIO_NAMES[k]!.replace(' + PAC', '')}
        </span>
      ))}
    </span>
  );
}

/* 6 · ASSUNZIONI E FONTI */
export function Sec6() {
  const { state } = useStore();
  const e = etfById(state.inputs.etf_id);
  const keyParams: { name: string; val: string; id: string }[] = [
    { name: 'Limite deducibile', val: euro(P.deduction_limit), id: 'deduction_limit' },
    { name: 'Imposta sui rendimenti del fondo', val: pctShort(P.fund_return_tax), id: 'fund_return_tax' },
    { name: 'Aliquota d’uscita', val: `${pctShort(P.exit_tax_max)} → ${pctShort(P.exit_tax_min)}`, id: 'exit_tax_max' },
    { name: 'Riscatto per dimissioni', val: pctShort(P.redemption_tax), id: 'redemption_tax' },
    { name: 'Plusvalenze PAC', val: pctShort(P.capital_gain_tax), id: 'capital_gain_tax' },
    { name: 'Bollo conto titoli', val: pctShort(P.stamp_duty, 2), id: 'stamp_duty' },
    { name: `TER ETF (${e.short})`, val: pct(e.ter, 2), id: 'etf_ter' },
    { name: 'TER comparto 2025', val: pctShort(params.parameters.find((x) => x.id === 'fund_ter_reference')!.default as number), id: 'fund_ter_reference' },
  ];
  const A: [string, string][] = [
    ['Stesso budget netto', 'I tre scenari usano ogni anno gli stessi soldi del tuo stipendio netto. Cambia solo dove li metti.'],
    ['Rimborso IRPEF nel PAC', 'Il risparmio fiscale della deduzione è investito nel PAC nello stesso anno.'],
    ['Differenziale costante', 'Il fondo rende ogni anno come l’ETF più il differenziale scelto.'],
    ['Costi già nel differenziale', 'Il differenziale storico è calcolato sui valori quota, già al netto dei costi del fondo.'],
    ['Versamenti a metà anno', 'I contributi mensili rendono in media mezzo anno nell’anno in cui arrivano.'],
    [`Contributi +${pctShort(P.growth)} l’anno`, `Contributi e TFR crescono con lo stipendio; il limite di ${euro(P.deduction_limit)} resta fisso.`],
    ['Uscita in capitale', 'Confrontiamo il capitale netto all’uscita; la rendita non è simulata.'],
    [`Riscatto anticipato ${pctShort(P.redemption_tax)}`, 'Nella striscia e nella mappa, ogni uscita prima dell’ultimo anno è trattata come riscatto per dimissioni.'],
    ['PAC tassato alla fine', `Il PAC paga il bollo ${pctShort(P.stamp_duty, 2)} ogni anno e il ${pctShort(P.capital_gain_tax)} sulle plusvalenze solo alla vendita.`],
    ['Norme 2026', 'Scaglioni, limiti e aliquote restano quelli del 2026 per tutto l’orizzonte.'],
  ];
  return (
    <Section
      k={6}
      title="Assunzioni, fonti e avvertenze"
      subtitle="Ogni numero ha una fonte; ogni ipotesi si può cambiare"
      badge="Verificabile"
      summary={
        <>
          {params.parameters.length} parametri <span className="dot-sep">·</span> {A.length} assunzioni <span className="dot-sep">·</span> fonti citate
        </>
      }
      footer={
        <a href="#/parametri" className="btn dark">
          Tutti i {params.parameters.length} parametri con le fonti <span aria-hidden="true">→</span>
        </a>
      }
    >
      <div className="g2">
        <div className="panel">
          <span className="cap">Parametri chiave</span>
          <ul className="kp">
            {keyParams.map((k) => {
              const s = ps(k.id);
              return (
                <li key={k.id}>
                  <span>
                    {k.name} <span className="muted">· {s.kind}</span>
                  </span>
                  <span className="kp-val">
                    {k.val} <Src kind={s.kind} source={s.source} what={k.name} align="right" />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="col">
          <div className="panel">
            <span className="cap">Assunzioni del modello</span>
            <span className="pills">
              {A.map(([t, d]) => (
                <span key={t} className="tip pill-tip">
                  <span className="pill" tabIndex={0} aria-describedby={`ass-${t}`}>
                    {t}
                  </span>
                  <span className="bubble" role="tooltip" id={`ass-${t}`}>
                    {d}
                  </span>
                </span>
              ))}
            </span>
          </div>
          <div className="panel">
            <span className="cap">Avvertenze</span>
            <span className="text-sm">
              Simulazione a scopo informativo, non consulenza finanziaria, fiscale o previdenziale. Strumento indipendente, non affiliato a FPDDI, IBM o ai gestori
              citati. Rendimenti passati non garantiscono quelli futuri. Il modello tratta il capitale come interamente liquidabile e non simula la rendita. Verifica
              i documenti ufficiali del fondo.
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}

