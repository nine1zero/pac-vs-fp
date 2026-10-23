// Pagina G "I miei versamenti" (SPEC par. 3.4 G e 6, prototipo spec/design/v2/Versamenti.dc.html).
import { useMemo, useState } from 'react';
import { azionario, etfMonthly, etfMonthlySources, type PriceColumn } from '../../data';
import { monthlySeries } from '../../model/contributions';
import { useStore } from '../../state/store';
import { LegendItem, TimeChart } from '../charts/TimeChart';
import { Segmented } from '../controls';
import { dec, euro, euro2, int, itDate, num } from '../format';
import { Src } from '../Tip';
import { useImport } from '../useImport';

const MES = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const mLabel = (iso: string) => `${MES[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const mm = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const sign = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + euro(Math.abs(v));

const ETFS: { id: PriceColumn; label: string; isin: string }[] = [
  { id: 'acwi_eur', label: 'MSCI ACWI', isin: 'iShares MSCI ACWI UCITS ETF (Acc) · IE00B6R52259' },
  { id: 'msci_world_eur', label: 'MSCI World', isin: 'iShares Core MSCI World UCITS ETF (Acc) · IE00B4L5Y983' },
  { id: 'msci_europe_eur', label: 'MSCI Europe', isin: 'iShares Core MSCI Europe UCITS ETF (Acc) · IE00B4K48X80' },
];
const PRICE_SOURCE = `${etfMonthlySources['etf_monthly.csv'].source}.`;

export function Versamenti() {
  const { state } = useStore();
  const { readFile, useSample, busy } = useImport();
  const [etf, setEtf] = useState<PriceColumn>('acwi_eur');
  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [year, setYear] = useState('all');
  const [tipo, setTipo] = useState('all');
  const file = state.file;
  const res = file?.result;
  const ok = res && res.status !== 'error';
  const series = useMemo(() => (ok ? monthlySeries(res.movements, azionario, etfMonthly, etf) : null), [ok, res, etf]);

  if (!ok) {
    return (
      <main className="wrap main" id="contenuto">
        <h1 className="h1">
          I miei <span className="mark">versamenti</span>
        </h1>
        <label className="drop big">
          <span className="drop-title">{busy ? 'Lettura in corso…' : 'Trascina qui il file DettaglioOperazioni scaricato dall’area riservata del fondo (.xls)'}</span>
          <span className="drop-sub lock">Il file viene letto solo nel tuo browser</span>
          <input type="file" accept=".xls,.html,.htm" onChange={(e) => readFile(e.target.files?.[0])} aria-label="Scegli il file DettaglioOperazioni" />
        </label>
        {res?.status === 'error' && (
          <div className="alert error" role="alert">
            <strong>Il file non si può usare.</strong>
            <ul>
              {res.issues
                .filter((x) => x.severity === 'error')
                .map((x, j) => (
                  <li key={j}>{x.message}</li>
                ))}
            </ul>
          </div>
        )}
        <span className="row-gap wrap">
          <button type="button" className="btn ghost" onClick={useSample}>
            Usa un file d'esempio
          </button>
          <a href="#/" className="btn ghost">
            <span aria-hidden="true">←</span> Torna al simulatore
          </a>
        </span>
      </main>
    );
  }

  const movs = res.movements;
  const warnings = res.issues.filter((x) => x.severity === 'warning').concat(file.comparison?.issues ?? []);
  const yearOf = (m: (typeof movs)[number]) => (m.dataValore ?? m.competenza ?? '').slice(0, 4);
  const okY = (m: (typeof movs)[number]) => year === 'all' || yearOf(m) === year;
  const okT = (m: (typeof movs)[number]) => tipo === 'all' || m.tipo === tipo;
  const sel = movs.filter((m) => okY(m) && okT(m));
  const years = [...new Set(movs.map(yearOf))].filter(Boolean).sort().reverse();
  const tipi = [...new Set(movs.map((m) => m.tipo))];
  const sum = (k: 'aderente' | 'azienda' | 'tfr' | 'netto') => sel.reduce((a, m) => a + m[k], 0);
  const sumQ = sel.reduce((a, m) => a + (m.quote ?? 0), 0);
  const name = ETFS.find((e) => e.id === etf)!;

  return (
    <main className="wrap main" id="contenuto">
      <section className="hero">
        <div className="hero-text">
          <h1 className="h1">
            I miei <span className="mark">versamenti</span>
          </h1>
          <p className="lead">
            Quanto hai versato tu, quanto l'azienda e quanto il TFR, mese per mese, e quanto vale oggi la posizione. Accanto, gli stessi versamenti, alle stesse date,
            investiti nell'ETF che scegli.
          </p>
        </div>
        <span className="file-line lock">
          {movs.length} movimenti importati
          {res.period ? ` · competenza dal ${mm(res.period[0])} al ${mm(res.period[1])}` : ''} · {file.name}
        </span>
      </section>
      {warnings.length > 0 && (
        <ul className="checks" aria-label="Avvisi sul file">
          {warnings.map((w, j) => (
            <li key={j} className="check warn">
              ! {w.message}
            </li>
          ))}
        </ul>
      )}
      {series && !res.reduced ? <Chart series={series} etf={name} mode={mode} setEtf={setEtf} setMode={setMode} etfId={etf} /> : (
        <p className="card">Il file non ha le colonne delle quote (fondo solo assicurativo): niente posizione reale né confronto con l'ETF, solo i movimenti.</p>
      )}
      <section className="card col">
        <div className="panel-head wrap">
          <div className="col tight">
            <h2 className="h2">Dettaglio movimenti</h2>
            <span className="text-sm muted">
              {sel.length} di {movs.length} movimenti, dal più recente · importi lordi in euro
            </span>
          </div>
          <span className="row-gap wrap">
            <label className="filter">
              Anno
              <select className="sel" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="all">Tutti ({movs.filter(okT).length})</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y} ({movs.filter((m) => okT(m) && yearOf(m) === y).length})
                  </option>
                ))}
              </select>
            </label>
            <label className="filter">
              Tipologia
              <select className="sel" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="all">Tutte ({movs.filter(okY).length})</option>
                {tipi.map((t) => (
                  <option key={t} value={t}>
                    {t} ({movs.filter((m) => okY(m) && m.tipo === t).length})
                  </option>
                ))}
              </select>
            </label>
            {(year !== 'all' || tipo !== 'all') && (
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setYear('all');
                  setTipo('all');
                }}
              >
                Azzera filtri
              </button>
            )}
          </span>
        </div>
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Dettaglio movimenti">
          <table className="tbl num-tbl mov-tbl">
            <thead>
              <tr>
                <th scope="col">Data valore</th>
                <th scope="col">Competenza</th>
                <th scope="col">Tipologia</th>
                <th scope="col">Tu</th>
                <th scope="col">Azienda</th>
                <th scope="col">TFR</th>
                <th scope="col">Netto</th>
                <th scope="col">Quote</th>
                <th scope="col">Valore quota</th>
              </tr>
            </thead>
            <tbody>
              {sel.map((m) => (
                <tr key={m.index}>
                  <td>{m.dataValore ? itDate(m.dataValore) : m.inAttesa ? 'in attesa' : '–'}</td>
                  <td>{m.competenza ? mm(m.competenza) : '–'}</td>
                  <td>{m.tipo}</td>
                  <td>{dec(m.aderente, 2)}</td>
                  <td>{dec(m.azienda, 2)}</td>
                  <td>{dec(m.tfr, 2)}</td>
                  <td>
                    <strong>{dec(m.netto, 2)}</strong>
                  </td>
                  <td>{m.quote === null ? '–' : dec(m.quote, 3)}</td>
                  <td>{m.valoreQuota === null ? '–' : dec(m.valoreQuota, 3)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Totale</th>
                <td />
                <td />
                <td>{dec(sum('aderente'), 2)}</td>
                <td>{dec(sum('azienda'), 2)}</td>
                <td>{dec(sum('tfr'), 2)}</td>
                <td>{dec(sum('netto'), 2)}</td>
                <td>{dec(sumQ, 3)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="sec-foot">
          <span className="muted text-sm">Posizione, ultimo contributo mensile e anno di prima adesione sono già nel simulatore dal momento del caricamento.</span>
          <a href="#/" className="btn ghost">
            <span aria-hidden="true">←</span> Torna al simulatore
          </a>
        </div>
      </section>
    </main>
  );
}

function Chart({
  series,
  etf,
  etfId,
  mode,
  setEtf,
  setMode,
}: {
  series: NonNullable<ReturnType<typeof monthlySeries>>;
  etf: (typeof ETFS)[number];
  etfId: PriceColumn;
  mode: 'in' | 'out';
  setEtf: (v: PriceColumn) => void;
  setMode: (v: 'in' | 'out') => void;
}) {
  const s = series;
  const n = s.months.length;
  const L = n - 1;
  const tot = s.aderente.map((v, i) => v + s.azienda[i]! + s.tfr[i]!);
  const c2 = s.aderente.map((v, i) => v + s.azienda[i]!);
  const ser = mode === 'in' ? s.etfInside : s.etfOutside;
  const T = tot[L]!;
  const real = s.real[L]!;
  const diff = ser[L]! - real;
  const modeTxt = mode === 'in' ? 'dentro il fondo, con la stessa imposta' : 'fuori dal fondo, prima del 26%';
  const pctOf = (v: number) => `${int((v / T) * 100)}%`;
  const xTicks = [{ i: 0, label: mLabel(s.months[0]!) }];
  s.months.forEach((m, i) => {
    if (i > 0 && i < L - 2 && m.slice(5, 7) === '01') xTicks.push({ i, label: m.slice(0, 4) });
  });
  if (L > 0) xTicks.push({ i: L, label: mLabel(s.months[L]!) });
  const calc = 'Calcolato dal tuo file: quote accumulate × valore quota dell’ultimo movimento (SPEC par. 6.3, docs/FORMULE.md par. 10).';
  return (
    <>
      <div className="g5">
        <Tile cap="Versato da te" color="#6b6f75" val={euro(s.aderente[L]!)} sub={`${pctOf(s.aderente[L]!)} del totale`} />
        <Tile cap="Azienda" color="#a9acb0" val={euro(s.azienda[L]!)} sub={`${pctOf(s.azienda[L]!)} del totale`} />
        <Tile cap="TFR" color="#d3d5d7" val={euro(s.tfr[L]!)} sub={`${pctOf(s.tfr[L]!)} del totale`} />
        <Tile cap="Posizione oggi" val={euro2(real)} sub={`rendimento ${sign(real - T)} su ${euro(T)} versati`} src={calc} />
        <Tile
          cap="Stessi versamenti nell'ETF"
          val={euro(ser[L]!)}
          sub={`${sign(diff)} rispetto al fondo`}
          src={`Ogni versamento netto comprato al prezzo di fine mese della sua data valore; "dentro il fondo" con l'imposta annua del fondo (docs/FORMULE.md par. 10). Prezzi: ${PRICE_SOURCE}`}
        />
      </div>
      <section className="card col">
        <div className="panel-head wrap">
          <div className="col tight">
            <h2 className="h2">Versamenti e rendimento nel tempo</h2>
            <span className="text-sm">
              Hai versato {euro(T)} e oggi nel fondo hai {euro(real)}. Con gli stessi versamenti nell’ETF {etf.label} {modeTxt}, avresti{' '}
              <span className="mark">
                {euro(Math.abs(diff))} {diff >= 0 ? 'in più' : 'in meno'}
              </span>{' '}
              ({euro(ser[L]!)}).
            </span>
          </div>
          <div className="col tight">
            <span className="chips" role="radiogroup" aria-label="ETF di confronto">
              {ETFS.map((e) => (
                <button key={e.id} type="button" role="radio" aria-checked={etfId === e.id} className="chip" title={e.isin} onClick={() => setEtf(e.id)}>
                  {e.label}
                </button>
              ))}
            </span>
            <Segmented
              small
              label="Tassazione dell'ETF"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'in', label: 'Dentro il fondo' },
                { value: 'out', label: 'Fuori, prima del 26%' },
              ]}
            />
          </div>
        </div>
        <span className="legend">
          <LegendItem swatch color="#6b6f75" label="Tu" />
          <LegendItem swatch color="#a9acb0" label="Azienda" />
          <LegendItem swatch color="#d3d5d7" label="TFR" />
          <LegendItem color="#0b0b0b" label="Posizione reale nel fondo" />
          <LegendItem color="#2563eb" dash label={`Stessi versamenti in ETF ${etf.label}`} />
          <LegendItem swatch color="rgba(212,238,54,.6)" label="Differenza" />
        </span>
        <TimeChart
          labels={s.months}
          height={360}
          areas={[
            { lo: s.months.map(() => 0), hi: s.aderente, color: '#6b6f75' },
            { lo: s.aderente, hi: c2, color: '#a9acb0' },
            { lo: c2, hi: tot, color: '#d3d5d7' },
            { lo: s.real, hi: ser, color: '#d4ee36', opacity: 0.6 },
          ]}
          lines={[
            { name: 'Fondo', color: '#0b0b0b', values: s.real },
            { name: 'ETF', color: '#2563eb', values: ser, dash: true },
          ]}
          xTicks={xTicks}
          yFormat={(v) => (v >= 1000 ? `${num(v / 1000, 1)}k €` : `${int(v)} €`)}
          ariaLabel={`Versamenti cumulati di aderente, azienda e TFR, posizione reale del fondo e stessi versamenti nell’ETF ${etf.label}, da ${mLabel(s.months[0]!)} a ${mLabel(s.months[L]!)}`}
          title={(i) => mLabel(s.months[i]!)}
          rows={(i) => [
            { name: 'Tu', value: euro(s.aderente[i]!) },
            { name: 'Azienda', value: euro(s.azienda[i]!) },
            { name: 'TFR', value: euro(s.tfr[i]!) },
            { name: 'Versato', value: euro(tot[i]!) },
            { name: 'Fondo', value: euro(s.real[i]!), color: '#f4f4f2' },
            { name: 'ETF', value: euro(ser[i]!), color: '#60a5fa' },
            { name: 'Differenza', value: sign(ser[i]! - s.real[i]!), color: '#d4ee36' },
          ]}
        />
        <span className="text-sm muted">
          Fondo: quote accumulate × valore quota dell'ultimo movimento del mese. ETF: ogni versamento netto comprato al prezzo di fine mese della sua data valore.
          "Dentro il fondo" applica ogni anno la stessa imposta sui rendimenti del fondo; "fuori" mostra il valore prima del 26% sulle plusvalenze. Passa il mouse sul
          grafico, o usa le frecce, per i valori di ogni mese. <Src kind="Emittente" source={PRICE_SOURCE} what="prezzi degli ETF" />
        </span>
      </section>
    </>
  );
}

function Tile({ cap, val, sub, color, src }: { cap: string; val: string; sub: string; color?: string; src?: string }) {
  return (
    <div className="tile">
      <span className="cap">
        {color && <span className="leg-sw" style={{ background: color }} />}
        {cap}
      </span>
      <span className="big">
        {val} {src && <Src kind="Calcolo" source={src} what={cap} />}
      </span>
      <span className="text-sm muted">{sub}</span>
    </div>
  );
}
