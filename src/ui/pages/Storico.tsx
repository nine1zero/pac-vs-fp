// Pagina F "Storico" (SPEC par. 3.4 F e 5, prototipo spec/design/v2/Storico.dc.html).
import { useMemo, useState } from 'react';
import { azionario } from '../../data';
import { FUND_SOURCE, TAX_RATE_SOURCE } from '../../data/catalog';
import { LegendItem, TimeChart } from '../charts/TimeChart';
import { Segmented } from '../controls';
import { euro, int, pct } from '../format';
import { Src } from '../Tip';
import { cagrOf, etfReturns, indexFrom, ROWS, STORICO_ETFS, WINDOWS, YEARS, type EtfKey } from './storicoData';

const pts = (v: number) => `${v > 0 ? '+' : ''}${pct(v, 1)}`.replace('%', ' punti');
const CALC = 'Media annua composta: (Π (1 + r))^(1/n) − 1; fondo e benchmark prima dell’imposta = netto / (1 − imposta dell’anno) (docs/FORMULE.md par. 8).';
const P = (v: number | null, d = 2) => (v === null || Number.isNaN(v) ? 'n.d.' : pct(v, d, true));

type SortKey = 'year' | 'fundNet' | 'fundGross' | 'benchGross' | 'rebuilt' | 'world' | 'europe' | 'cash' | 'etf' | 'diff';

export function Storico() {
  const [etf, setEtf] = useState<EtfKey>('ishares');
  const [win, setWin] = useState('w14');
  const [gross, setGross] = useState(true);
  const [vs, setVs] = useState<'etf' | 'bench'>('etf');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'year', dir: 1 });
  const E = useMemo(() => etfReturns(etf), [etf]);
  const meta = STORICO_ETFS[etf];
  const last = YEARS.length - 1;
  const first = E.findIndex((v) => v !== null);
  const w = WINDOWS.find((x) => x.id === win)!;
  let i0 = Math.max(YEARS.indexOf(w.from), first);
  let i1 = YEARS.indexOf(w.to);
  const cut = YEARS[i0]! > w.from;
  if (i0 > i1) {
    i0 = first;
    i1 = last;
  }
  const per = `${YEARS[i0]}–${YEARS[i1]}`;
  const col = (k: keyof (typeof ROWS)[number]) => ROWS.map((r) => r[k] as number);
  const fundGross = col('fund_pre_tax');
  const fundNet = col('fund_net');
  const benchGross = col('bench_pre_tax');
  const benchNet = col('bench_net');
  const rebuilt = col('bench_rebuilt');
  const cF = cagrOf(fundGross, i0, i1);
  const cE = cagrOf(E, i0, i1);
  const cB = cagrOf(benchGross, i0, i1);
  const cR = cagrOf(rebuilt, i0, i1);
  const comp = azionario.benchmark_composition;

  // grafico 1: dal primo anno dell'ETF scelto
  const fund = gross ? fundGross : fundNet;
  const bench = gross ? benchGross : benchNet;
  const l1 = [indexFrom(fund, first, last), indexFrom(bench, first, last), indexFrom(E, first, last)];
  const labels1 = [YEARS[first]! - 1, ...YEARS.slice(first)].map(String);
  const end = (a: number[]) => a[a.length - 1]!;
  const lastLabel = (y: number) => (y === 2026 ? 'ago 2026' : `fine ${y}`);
  const ticks = (labels: string[]) => labels.map((l, i) => ({ i, label: l === '2026' ? '2026*' : l }));

  // grafico 2: componenti dal 2012
  const comps = [col('msci_world_eur'), col('msci_europe_eur'), col('estr_eur'), rebuilt, benchGross].map((a) => indexFrom(a, 0, last));
  const labels2 = [YEARS[0]! - 1, ...YEARS].map(String);

  // barre
  const diffs = YEARS.map((_, i) => {
    const b = vs === 'etf' ? E[i] : benchGross[i];
    return b === null || b === undefined ? null : fundGross[i]! - b;
  });
  const maxAbs = Math.max(0.05, ...diffs.filter((d): d is number => d !== null).map(Math.abs));

  // scomposizione e statistiche
  const d1 = cR - cE;
  const d2 = cB - cR;
  const d3 = cF - cB;
  const tot = cF - cE;
  const mx = Math.max(Math.abs(d1), Math.abs(d2), Math.abs(d3), Math.abs(tot), 0.001);
  const sel = YEARS.slice(i0, i1 + 1).map((_, k) => fundGross[i0 + k]! - E[i0 + k]!);
  const nS = sel.length;
  const mean = sel.reduce((a, b) => a + b, 0) / nS;
  const srt = [...sel].sort((a, b) => a - b);
  const med = nS % 2 ? srt[(nS - 1) / 2]! : (srt[nS / 2 - 1]! + srt[nS / 2]!) / 2;
  const sd = nS > 1 ? Math.sqrt(sel.reduce((a, b) => a + (b - mean) ** 2, 0) / (nS - 1)) : 0;
  const se = sd / Math.sqrt(nS);
  const pos = sel.filter((v) => v > 0).length;

  // tabella
  const cols: { key: SortKey; label: string; title: string }[] = [
    { key: 'year', label: 'Anno', title: 'Anno' },
    { key: 'fundNet', label: 'Fondo netto', title: 'Rendimento pubblicato, dopo l’imposta annua' },
    { key: 'fundGross', label: 'Fondo lordo', title: 'Prima dell’imposta annua' },
    { key: 'benchGross', label: 'Bench. pubbl.', title: 'Benchmark pubblicato, prima dell’imposta' },
    { key: 'rebuilt', label: 'Ricostruito', title: '45% World + 45% Europe + 10% €STR' },
    { key: 'world', label: 'MSCI World', title: 'iShares Core MSCI World' },
    { key: 'europe', label: 'MSCI Europe', title: 'iShares Core MSCI Europe' },
    { key: 'cash', label: 'Liquidità', title: 'Xtrackers EUR Overnight Rate Swap' },
    { key: 'etf', label: meta.short, title: meta.name },
    { key: 'diff', label: 'Fondo − ETF', title: 'Fondo lordo meno ETF, in punti' },
  ];
  const val = (k: SortKey, i: number): number | null => {
    const r = ROWS[i]!;
    switch (k) {
      case 'year':
        return r.year;
      case 'fundNet':
        return r.fund_net;
      case 'fundGross':
        return r.fund_pre_tax;
      case 'benchGross':
        return r.bench_pre_tax;
      case 'rebuilt':
        return r.bench_rebuilt;
      case 'world':
        return r.msci_world_eur;
      case 'europe':
        return r.msci_europe_eur;
      case 'cash':
        return r.estr_eur;
      case 'etf':
        return E[i] ?? null;
      case 'diff':
        return E[i] === null || E[i] === undefined ? null : r.fund_pre_tax - E[i]!;
    }
  };
  const order = YEARS.map((_, i) => i).sort((a, b) => {
    const va = val(sort.key, a);
    const vb = val(sort.key, b);
    if (va === null) return 1;
    if (vb === null) return -1;
    return (va - vb) * sort.dir;
  });
  const csv = () => {
    const head = cols.map((c) => c.label).join(';');
    const body = YEARS.map((_, i) =>
      cols.map((c) => (c.key === 'year' ? String(val('year', i)) : val(c.key, i) === null ? '' : (val(c.key, i)! * 100).toFixed(4).replace('.', ','))).join(';'),
    );
    const blob = new Blob([`${head}\n${body.join('\n')}\n`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'storico-fpddi-azionario.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <main className="wrap main" id="contenuto">
      <section className="hero-text">
        <h1 className="h1">
          Lo storico del <span className="mark">comparto Azionario</span>
        </h1>
        <p className="lead">
          Dal 2012 a oggi, anno per anno: quanto ha reso il fondo, quanto il suo benchmark e ciascuna delle sue tre componenti, e quanto avrebbe reso un ETF azionario
          globale.
        </p>
      </section>

      <section className="card col">
        <span className="cap">
          Com'è fatto il benchmark del fondo <Src kind="Doc. FPDDI" source={comp.source} what="composizione del benchmark" />
        </span>
        <div className="bench-bar" role="img" aria-label="Benchmark: 45% MSCI World, 45% MSCI Europe, 10% liquidità">
          <div style={{ flex: comp['MSCI World'] }} className="bb world">
            <strong>{pct(comp['MSCI World'], 0)}</strong>
            <span>MSCI World · azioni dei paesi sviluppati</span>
          </div>
          <div style={{ flex: comp['MSCI Europe'] }} className="bb europe">
            <strong>{pct(comp['MSCI Europe'], 0)}</strong>
            <span>MSCI Europe · azioni europee</span>
          </div>
          <div style={{ flex: comp['JPM Cash Euro 3M'] }} className="bb cash">
            <strong>{pct(comp['JPM Cash Euro 3M'], 0)}</strong>
            <span>liquidità</span>
          </div>
        </div>
        <span className="text">
          <strong>Benchmark = 45% MSCI World + 45% MSCI Europe + 10% JPM Cash Euro 3M</strong>, ribilanciato ogni anno. Le azioni europee pesano due volte: sono già
          dentro il MSCI World e in più hanno un 45% dedicato. Il 10% è liquidità, che rende quasi zero. Nessuna esposizione ai mercati emergenti.
        </span>
        <span className="text-sm muted">
          Per ricostruirlo usiamo ETF che replicano le stesse componenti: iShares Core MSCI World (IE00B4L5Y983), iShares Core MSCI Europe (IE00B4K48X80) e, per la
          liquidità, Xtrackers EUR Overnight Rate Swap (LU0290358497, segue l'€STR, non l'Euribor 3 mesi). I codici Datastream del documento finiscono in (PI): se
          sono indici di prezzo, senza dividendi, il benchmark pubblicato parte svantaggiato rispetto agli ETF, che includono i dividendi. È un'ipotesi da confermare
          con il fondo.
        </span>
      </section>

      <section className="card col">
        <div className="g2">
          <div className="col tight">
            <span className="cap">ETF di confronto</span>
            <span className="chips" role="radiogroup" aria-label="ETF di confronto">
              {(Object.keys(STORICO_ETFS) as EtfKey[]).map((k) => {
                const f = etfReturns(k).findIndex((v) => v !== null);
                return (
                  <button key={k} type="button" role="radio" aria-checked={etf === k} className="chip" title={`${STORICO_ETFS[k].name} · ${STORICO_ETFS[k].isin}`} onClick={() => setEtf(k)}>
                    {STORICO_ETFS[k].short} · dal {YEARS[f]}
                  </button>
                );
              })}
            </span>
            <span className="text-sm muted">
              {meta.name} · {meta.isin} <Src kind="Emittente" source={meta.source} what="rendimenti dell'ETF" />
            </span>
          </div>
          <div className="col tight">
            <span className="cap">Periodo delle statistiche</span>
            <span className="chips" role="radiogroup" aria-label="Periodo delle statistiche">
              {WINDOWS.map((x) => (
                <button key={x.id} type="button" role="radio" aria-checked={win === x.id} className="chip" onClick={() => setWin(x.id)}>
                  {x.label}
                </button>
              ))}
            </span>
            <span className="text-sm muted">{cut ? `L’ETF scelto ha dati dal ${YEARS[first]}: le statistiche partono da lì (${per}).` : `Statistiche calcolate sul ${per}.`}</span>
          </div>
        </div>
        <div className="g4">
          <StatTile cap="Fondo, prima dell’imposta" val={P(cF)} sub={`media annua ${per} · dopo l’imposta ${P(cagrOf(fundNet, i0, i1))}`} src={`${FUND_SOURCE} ${CALC}`} />
          <StatTile cap="Benchmark pubblicato" val={P(cB)} sub={`prima dell’imposta · ricostruito 45/45/10: ${P(cR)}`} src={`${FUND_SOURCE} ${CALC}`} />
          <StatTile cap={meta.short} val={P(cE)} sub={`media annua ${per}`} src={`${meta.source}. ${CALC}`} />
          <StatTile dark cap="Differenziale fondo − ETF" val={pts(cF - cE).replace(' punti', '')} sub={`punti l’anno · ${per}`} src={CALC} />
        </div>
      </section>

      <section className="card col">
        <div className="panel-head wrap">
          <div className="col tight">
            <h2 className="h2">
              100 € a fine {YEARS[first]! - 1}: fondo, benchmark e {meta.short}
            </h2>
            <span className="text-sm">
              A {lastLabel(YEARS[last]!)} il fondo vale {euro(end(l1[0]!))}
              {gross ? ' prima dell’imposta' : ' dopo l’imposta'}, il benchmark {euro(end(l1[1]!))}, l’ETF {euro(end(l1[2]!))}:{' '}
              <span className="mark">
                {euro(Math.abs(end(l1[2]!) - end(l1[0]!)))} {end(l1[2]!) >= end(l1[0]!) ? 'in più con l’ETF' : 'in meno con l’ETF'}
              </span>
              .
            </span>
          </div>
          <Segmented
            small
            label="Fondo e benchmark netti o lordi"
            value={gross ? 'g' : 'n'}
            onChange={(v) => setGross(v === 'g')}
            options={[
              { value: 'g', label: 'Prima dell’imposta' },
              { value: 'n', label: 'Dopo l’imposta' },
            ]}
          />
        </div>
        <span className="legend">
          <LegendItem color="#3a3d42" label="Fondo, comparto Azionario" />
          <LegendItem color="#7c3aed" dash label="Benchmark pubblicato" />
          <LegendItem color="#2563eb" label={meta.short} />
        </span>
        <TimeChart
          labels={labels1}
          lines={[
            { name: 'Fondo', color: '#3a3d42', values: l1[0]! },
            { name: 'Benchmark', color: '#7c3aed', values: l1[1]!, dash: true, width: 2.5 },
            { name: meta.short, color: '#2563eb', values: l1[2]! },
          ]}
          areas={[{ lo: l1[0]!, hi: l1[2]!, color: '#d4ee36', opacity: 0.55 }]}
          xTicks={ticks(labels1)}
          yFormat={(v) => `${int(v)} €`}
          ariaLabel={`100 € a fine ${YEARS[first]! - 1}: fondo, benchmark e ${meta.short}, anno per anno fino ad agosto 2026`}
          title={(i) => (i === 0 ? `fine ${YEARS[first]! - 1}` : lastLabel(Number(labels1[i])))}
          rows={(i) => [
            { name: 'Fondo', value: euro(l1[0]![i]!), color: '#9a9ea3' },
            { name: 'Benchmark', value: euro(l1[1]![i]!), color: '#a78bfa' },
            { name: meta.short, value: euro(l1[2]![i]!), color: '#60a5fa' },
          ]}
        />
        <span className="text-sm muted">
          Valore di 100 € investiti all'inizio, anno per anno. In lime la distanza tra l'ETF e il fondo. "Prima dell'imposta" toglie dal fondo e dal benchmark
          l'imposta annua sui rendimenti (20%, 11% nel 2012–2013, 11,5% nel 2014) <Src kind="Norma" source={TAX_RATE_SOURCE} what="imposta sui rendimenti" />: è il
          confronto corretto con l'ETF, che le imposte le paga solo alla vendita. 2026: gennaio–agosto.
        </span>
      </section>

      <section className="card col">
        <div className="col tight">
          <h2 className="h2">Le tre componenti del benchmark</h2>
          <span className="text-sm">
            100 € a fine 2011 diventano {euro(end(comps[0]!))} nel MSCI World, {euro(end(comps[1]!))} nel MSCI Europe e {euro(end(comps[2]!))} in liquidità. Mescolati
            45/45/10 fanno {euro(end(comps[3]!))}; il benchmark pubblicato, prima dell’imposta, si ferma a {euro(end(comps[4]!))}.
          </span>
        </div>
        <span className="legend">
          <LegendItem color="#0e7490" label="MSCI World (45%)" />
          <LegendItem color="#b45309" label="MSCI Europe (45%)" />
          <LegendItem color="#9a9ea3" label="Liquidità €STR (10%)" />
          <LegendItem color="#0b0b0b" label="Benchmark ricostruito 45/45/10" />
          <LegendItem color="#7c3aed" dash label="Benchmark pubblicato, prima dell'imposta" />
        </span>
        <TimeChart
          labels={labels2}
          height={320}
          lines={[
            { name: 'MSCI World', color: '#0e7490', values: comps[0]!, width: 2.5 },
            { name: 'MSCI Europe', color: '#b45309', values: comps[1]!, width: 2.5 },
            { name: 'Liquidità', color: '#9a9ea3', values: comps[2]!, width: 2.5 },
            { name: 'Ricostruito', color: '#0b0b0b', values: comps[3]!, width: 3.5 },
            { name: 'Pubblicato', color: '#7c3aed', values: comps[4]!, dash: true, width: 2.5 },
          ]}
          xTicks={ticks(labels2)}
          yFormat={(v) => `${int(v)} €`}
          ariaLabel="Componenti del benchmark: MSCI World, MSCI Europe, liquidità, benchmark ricostruito e pubblicato, 100 € a fine 2011"
          title={(i) => (i === 0 ? 'fine 2011' : lastLabel(Number(labels2[i])))}
          rows={(i) => [
            { name: 'MSCI World', value: euro(comps[0]![i]!), color: '#22d3ee' },
            { name: 'MSCI Europe', value: euro(comps[1]![i]!), color: '#f59e0b' },
            { name: 'Liquidità', value: euro(comps[2]![i]!), color: '#9a9ea3' },
            { name: 'Ricostruito', value: euro(comps[3]![i]!), color: '#f4f4f2' },
            { name: 'Pubblicato', value: euro(comps[4]![i]!), color: '#a78bfa' },
          ]}
        />
        <span className="text-sm muted">
          100 € a fine 2011, con i dividendi reinvestiti (prezzi degli ETF). Il ricostruito pesa le tre linee 45/45/10 e si ribilancia ogni gennaio. Se il pubblicato
          resta sotto il ricostruito anche se hanno gli stessi pesi, la differenza sta nel modo di calcolarlo (probabilmente indici senza dividendi).
        </span>
      </section>

      <div className="g2">
        <section className="card col">
          <div className="panel-head wrap">
            <div className="col tight">
              <h2 className="h2">Anno per anno</h2>
              <span className="text-sm muted">
                Punti di rendimento in più o in meno del fondo, prima dell’imposta, contro {vs === 'etf' ? meta.short : 'il benchmark pubblicato'}. Le barre piene sono
                gli anni del periodo scelto.
              </span>
            </div>
            <Segmented
              small
              label="Differenziale"
              value={vs}
              onChange={setVs}
              options={[
                { value: 'etf', label: 'Fondo − ETF' },
                { value: 'bench', label: 'Fondo − benchmark' },
              ]}
            />
          </div>
          <div className="bars" role="img" aria-label={`Differenziale annuo del fondo contro ${vs === 'etf' ? meta.short : 'il benchmark'}: ${YEARS.map((y, i) => `${y} ${diffs[i] === null ? 'n.d.' : pts(diffs[i]!)}`).join(', ')}`}>
            {YEARS.map((y, i) => {
              const d = diffs[i] ?? null;
              const inWin = i >= i0 && i <= i1;
              const h = d === null ? 0 : (Math.abs(d) / maxAbs) * 46;
              return (
                <div key={y} className="bar-col" title={d === null ? `${y}: ETF non disponibile` : `${y}: ${pts(d)}`}>
                  {d === null ? (
                    <span className="bar-lab na">n.d.</span>
                  ) : (
                    <>
                      <span className={`bar ${d >= 0 ? 'up' : 'down'}`} style={{ opacity: inWin ? 1 : 0.35, height: `${h}%`, ...(d >= 0 ? { bottom: '50%' } : { top: '50%' }) }} />
                      <span className={`bar-lab ${d >= 0 ? 'up' : 'down'}`} style={d >= 0 ? { bottom: `calc(${50 + h}% + 2px)` } : { top: `calc(${50 + h}% + 2px)` }}>
                        {`${d > 0 ? '+' : ''}${pct(d, 1)}`.replace('%', '')}
                      </span>
                    </>
                  )}
                  <span className="bar-year">
                    {String(y).slice(2)}
                    {y === 2026 ? '*' : ''}
                  </span>
                </div>
              );
            })}
          </div>
          <span className="legend">
            <LegendItem swatch color="#15803d" label="Il fondo ha fatto meglio" />
            <LegendItem swatch color="#b91c1c" label="Il fondo ha fatto peggio" />
          </span>
        </section>
        <section className="card col">
          <div className="col tight">
            <h2 className="h2">Da dove viene il ritardo</h2>
            <span className="text-sm muted">
              Medie annue {per}, in punti l’anno. Le tre voci sommate danno il totale.{' '}
              <Src kind="Calcolo storico" source="Differenze di medie composte: ricostruito − ETF, benchmark pubblicato − ricostruito, fondo − benchmark pubblicato (SPEC par. 5.3, docs/FORMULE.md par. 8)." what="scomposizione del ritardo" />
            </span>
          </div>
          <ul className="wf">
            {[
              [`Pesi del benchmark (Europa 45%, liquidità 10%, niente emergenti) contro ${meta.short}`, d1, false],
              ['Calcolo del benchmark pubblicato contro il ricostruito (indici senza dividendi?)', d2, false],
              ['Gestore e costi contro il benchmark pubblicato', d3, false],
              ['Totale: fondo prima dell’imposta contro ETF', tot, true],
            ].map(([name, v, strong]) => (
              <li key={name as string} className={strong ? 'strong' : ''}>
                <span className="wf-head">
                  <span>{name as string}</span>
                  <strong>{pts(v as number)}</strong>
                </span>
                <span className="wf-track">
                  <span className={`wf-bar ${strong ? 'tot' : (v as number) >= 0 ? 'up' : 'down'}`} style={{ width: `${(Math.abs(v as number) / mx) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card col">
        <div className="col tight">
          <h2 className="h2">Il differenziale in numeri</h2>
          <span className="text-sm muted">
            Differenza tra fondo, prima dell’imposta, e {meta.short}, anno per anno, {per} ({nS} anni).{' '}
            <Src kind="Calcolo storico" source="Media, mediana e deviazione standard campionaria dei differenziali annui; intervallo = media ± 1,96 × errore standard (docs/FORMULE.md par. 8)." what="statistiche" />
          </span>
        </div>
        <div className="g5">
          <StatTile cap="Media" val={pct(mean, 2, true)} sub="differenza media dei singoli anni" />
          <StatTile cap="Mediana" val={pct(med, 2, true)} sub="metà degli anni sopra, metà sotto" />
          <StatTile cap="Deviazione standard" val={pct(sd, 2)} sub="quanto varia da un anno all’altro" />
          <StatTile cap="Intervallo al 95%" val={`${pct(mean - 1.96 * se, 1, true)} / ${pct(mean + 1.96 * se, 1, true)}`} sub="dove sta la media vera, con il 95% di probabilità" />
          <StatTile cap="Anni migliori dell’ETF" val={`${pos} su ${nS}`} sub={per} />
        </div>
      </section>

      <section className="card col">
        <div className="panel-head wrap">
          <div className="col tight">
            <h2 className="h2">Tabella annuale</h2>
            <span className="text-sm muted">
              Rendimenti in euro. Clicca su un'intestazione per ordinare. 2026*: gennaio–agosto. "n.d.": l'ETF non esisteva o la sua quotazione non è affidabile.
            </span>
          </div>
          <button type="button" className="btn ghost" onClick={csv}>
            Esporta CSV
          </button>
        </div>
        <div className="table-wrap">
          <table className="tbl num-tbl">
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c.key} scope="col" aria-sort={sort.key === c.key ? (sort.dir > 0 ? 'ascending' : 'descending') : undefined}>
                    <button
                      type="button"
                      className="th-btn"
                      title={c.title}
                      onClick={() => setSort(sort.key === c.key ? { key: c.key, dir: (sort.dir * -1) as 1 | -1 } : { key: c.key, dir: c.key === 'year' ? 1 : -1 })}
                    >
                      {c.label}
                      {sort.key === c.key ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.map((i) => (
                <tr key={YEARS[i]} className={i >= i0 && i <= i1 ? 'in-win' : ''}>
                  {cols.map((c) => {
                    const v = val(c.key, i);
                    if (c.key === 'year')
                      return (
                        <th key={c.key} scope="row">
                          {YEARS[i]}
                          {YEARS[i] === 2026 ? '*' : ''}
                        </th>
                      );
                    if (c.key === 'diff') return <td key={c.key} className={v === null ? '' : v >= 0 ? 'pos' : 'neg'}>{v === null ? 'n.d.' : `${v > 0 ? '+' : ''}${pct(v, 1)}`.replace('%', '')}</td>;
                    return <td key={c.key}>{P(v)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="sec-foot">
          <span className="muted text-sm">Il differenziale storico 2014–{YEARS[last - 1]} alimenta l'ipotesi del simulatore.</span>
          <a href="#/" className="btn ghost">
            <span aria-hidden="true">←</span> Torna al simulatore
          </a>
        </div>
      </section>
      <p className="text-sm muted">
        Fonti: {FUND_SOURCE} ETF: {STORICO_ETFS.ishares.source}; {STORICO_ETFS.vanguard.source}; {STORICO_ETFS.spdrimi.source}.
      </p>
    </main>
  );
}

function StatTile({ cap, val, sub, src, dark }: { cap: string; val: string; sub: string; src?: string; dark?: boolean }) {
  return (
    <div className={`tile${dark ? ' dark' : ''}`}>
      <span className="cap">{cap}</span>
      <span className="big">
        {val} {src && <Src kind="Calcolo storico" source={src} what={cap} />}
      </span>
      <span className="text-sm">{sub}</span>
    </div>
  );
}
