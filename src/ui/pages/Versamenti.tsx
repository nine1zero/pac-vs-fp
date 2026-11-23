// Pagina G "I miei versamenti" (SPEC par. 3.4 G e 6, prototipo spec/design/v2/Versamenti.dc.html).
import { AreaRiservata } from '../AreaRiservata';
import { useMemo, useState } from 'react';
import { azionario, etfMonthly, etfMonthlySources, type PriceColumn } from '../../data';
import { etfCatalog } from '../../data/catalog';
import { monthlySeries, priceCoverage } from '../../model/contributions';
import { useStore } from '../../state/store';
import { LegendItem, TimeChart } from '../charts/TimeChart';
import { Segmented } from '../controls';
import { dec, euro, euro2, int, itDate, num, pct } from '../format';
import { BackLink } from '../BackLink';
import { Src } from '../Tip';
import { useImport } from '../useImport';

const MES = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const mLabel = (iso: string) => `${MES[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const mm = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const sign = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + euro(Math.abs(v));

/** Serie mensile dei prezzi di ogni ETF del simulatore in etf_monthly.csv (null = non ancora nei dati). */
const PRICE_COLUMN: Record<string, PriceColumn | null> = { vanguard: 'vanguard_eur', spdrimi: 'spdr_imi_eur', ishares: 'acwi_eur' };
const COLUMN_SOURCE = etfMonthlySources['etf_monthly.csv'].columns as Record<string, string>;

/** Gli stessi tre ETF del menù del simulatore, nello stesso ordine (SPEC par. 3.0, pagina G). */
const ETFS = etfCatalog.etfs.map((e) => ({
  id: e.id,
  label: e.short,
  title: `${e.name} · ${e.isin} · TER ${pct(e.ter, 2)}`,
  col: PRICE_COLUMN[e.id] ?? null,
}));
type EtfOption = (typeof ETFS)[number];
const MISSING_SERIES = 'serie mensile dei prezzi non ancora nei dati: da aggiungere con la sua fonte';
const priceSource = (col: PriceColumn) => `${etfMonthlySources['etf_monthly.csv'].source}. ${COLUMN_SOURCE[col] ?? ''}`.trim();
/** Perché un ETF non si può scegliere con questo file (null = si può). */
type Avail = Record<string, string | null>;

export function Versamenti() {
  const { state } = useStore();
  const { readFile, useSample, busy } = useImport();
  // preselezionato l'ETF scelto nel simulatore, se ha la serie mensile dei prezzi
  const [etf, setEtf] = useState(() => state.inputs.etf_id);
  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [year, setYear] = useState('all');
  const [tipo, setTipo] = useState('all');
  const file = state.file;
  const res = file?.result;
  const ok = res && res.status !== 'error';
  const avail: Avail = useMemo(() => {
    const out: Avail = {};
    for (const e of ETFS) {
      if (!e.col) out[e.id] = MISSING_SERIES;
      else if (!ok) out[e.id] = null;
      else {
        const c = priceCoverage(res.movements, etfMonthly, e.col);
        out[e.id] = c.covered ? null : `serie mensile dei prezzi dal ${mm(c.from)}, i tuoi versamenti iniziano a ${mm(c.firstNeeded!)}`;
      }
    }
    return out;
  }, [ok, res]);
  const usable = (id: string) => ETFS.some((e) => e.id === id && e.col && avail[id] === null);
  const opt = ETFS.find((e) => e.id === (usable(etf) ? etf : usable(etfCatalog.default) ? etfCatalog.default : ETFS.find((x) => usable(x.id))?.id ?? 'ishares'))!;
  const series = useMemo(() => (ok && opt.col ? monthlySeries(res.movements, azionario, etfMonthly, opt.col) : null), [ok, res, opt]);

  if (!ok) {
    return (
      <main className="wrap main" id="contenuto">
        <section className="page-head">
          <h1 className="h1">
            I miei <span className="mark">versamenti</span>
          </h1>
          <BackLink top />
        </section>
        <label className="drop big">
          <span className="drop-title">{busy ? 'Lettura in corso…' : 'Trascina qui il file DettaglioOperazioni (.xls)'}</span>
          <span className="drop-sub">
            scaricato da <AreaRiservata />
          </span>
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

  return (
    <main className="wrap main" id="contenuto">
      <section className="hero hero-top">
        <div className="hero-text">
          <h1 className="h1">
            I miei <span className="mark">versamenti</span>
          </h1>
          <p className="lead">
            Quanto hai versato tu, quanto l'azienda e quanto il TFR, mese per mese, e quanto vale oggi la posizione. Accanto, gli stessi versamenti, alle stesse date,
            investiti nell'ETF che scegli.
          </p>
          <span className="file-line lock">
            {movs.length} movimenti importati
            {res.period ? ` · competenza dal ${mm(res.period[0])} al ${mm(res.period[1])}` : ''} · {file.name}
          </span>
        </div>
        <BackLink top />
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
      {series && !res.reduced ? <Chart series={series} etf={opt} avail={avail} mode={mode} setEtf={setEtf} setMode={setMode} /> : (
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
          <BackLink />
        </div>
      </section>
    </main>
  );
}

function Chart({
  series,
  etf,
  avail,
  mode,
  setEtf,
  setMode,
}: {
  series: NonNullable<ReturnType<typeof monthlySeries>>;
  etf: EtfOption;
  avail: Avail;
  mode: 'in' | 'out';
  setEtf: (v: string) => void;
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
          src={`Ogni versamento netto comprato al prezzo di fine mese della sua data valore; "dentro il fondo" con l'imposta annua del fondo (docs/FORMULE.md par. 10). Prezzi: ${priceSource(etf.col!)}`}
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
          <div className="col tight controls-left">
            <span className="chips" role="radiogroup" aria-label="ETF di confronto">
              {ETFS.map((e) => {
                const why = avail[e.id] ?? null;
                const ok = why === null;
                return (
                  <button
                    key={e.id}
                    type="button"
                    role="radio"
                    aria-checked={etf.id === e.id}
                    aria-disabled={!ok || undefined}
                    className={`chip${ok ? '' : ' unavailable'}`}
                    title={ok ? e.title : `${e.title} · ${why}`}
                    onClick={() => ok && setEtf(e.id)}
                  >
                    {e.label}
                    {!ok && <span className="sr-only"> ({why})</span>}
                  </button>
                );
              })}
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
          <LegendItem swatch color="rgba(220, 254, 113,.6)" label="Differenza" />
        </span>
        <TimeChart
          labels={s.months}
          height={360}
          areas={[
            { lo: s.months.map(() => 0), hi: s.aderente, color: '#6b6f75' },
            { lo: s.aderente, hi: c2, color: '#a9acb0' },
            { lo: c2, hi: tot, color: '#d3d5d7' },
            { lo: s.real, hi: ser, color: '#dcfe71', opacity: 0.6 },
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
            { name: 'Fondo', value: euro(s.real[i]!), color: '#fafafa' },
            { name: 'ETF', value: euro(ser[i]!), color: '#60a5fa' },
            { name: 'Differenza', value: sign(ser[i]! - s.real[i]!), color: '#dcfe71' },
          ]}
        />
        <span className="text-sm muted">
          Fondo: quote accumulate × valore quota dell'ultimo movimento del mese. ETF: ogni versamento netto comprato al prezzo di fine mese della sua data valore.
          "Dentro il fondo" applica ogni anno la stessa imposta sui rendimenti del fondo; "fuori" mostra il valore prima del 26% sulle plusvalenze. Passa il mouse sul
          grafico, o usa le frecce, per i valori di ogni mese. <Src kind="Emittente" source={priceSource(etf.col!)} what="prezzi degli ETF" />
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
