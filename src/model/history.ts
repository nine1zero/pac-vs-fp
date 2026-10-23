// Statistiche storiche del comparto Azionario contro ETF e benchmark (SPEC par. 5; docs/FORMULE.md par. 8;
// reference/history.py).
import type { Azionario } from '../data';
import { priceAt, type PriceColumn, type PriceTable } from '../data/prices';

export interface AnnualRow {
  year: number;
  partial: boolean;
  fund_net: number;
  bench_net: number;
  tax: number;
  /** netto / (1 − imposta): vale anche negli anni negativi (credito d'imposta) */
  fund_pre_tax: number;
  bench_pre_tax: number;
  acwi_eur: number;
  msci_world_eur: number;
  msci_europe_eur: number;
  estr_eur: number;
  /** 45% MSCI World + 45% MSCI Europe + 10% liquidità, ribilanciato ogni anno */
  bench_rebuilt: number;
}

export type AnnualKey = Exclude<keyof AnnualRow, 'year' | 'partial'>;

const PRICE_COLUMNS: PriceColumn[] = ['acwi_eur', 'msci_world_eur', 'msci_europe_eur', 'estr_eur'];

function priceOrThrow(t: PriceTable, date: string, col: PriceColumn): number {
  const v = priceAt(t, date, col);
  if (v === undefined) throw new Error(`Prezzo ${col} mancante al ${date}`);
  return v;
}

export function annualTable(az: Azionario, prices: PriceTable): AnnualRow[] {
  const w = az.benchmark_composition;
  return az.years.map((y) => {
    const end = y.period_end;
    const prev = `${y.year - 1}-12-31`;
    const ret = Object.fromEntries(
      PRICE_COLUMNS.map((c) => [c, priceOrThrow(prices, end, c) / priceOrThrow(prices, prev, c) - 1]),
    ) as Record<PriceColumn, number>;
    return {
      year: y.year,
      partial: y.partial,
      fund_net: y.fund_net,
      bench_net: y.benchmark_net,
      tax: y.fund_tax_rate,
      fund_pre_tax: y.fund_net / (1 - y.fund_tax_rate),
      bench_pre_tax: y.benchmark_net / (1 - y.fund_tax_rate),
      ...ret,
      bench_rebuilt:
        w['MSCI World'] * ret.msci_world_eur + w['MSCI Europe'] * ret.msci_europe_eur + w['JPM Cash Euro 3M'] * ret.estr_eur,
    };
  });
}

/** Media annua composta di `key` negli anni y0..y1 compresi. */
export function cagr(rows: AnnualRow[], key: AnnualKey, y0: number, y1: number): number {
  const sel = rows.filter((r) => r.year >= y0 && r.year <= y1).map((r) => r[key]);
  if (sel.length === 0) return Number.NaN;
  return sel.reduce((acc, v) => acc * (1 + v), 1) ** (1 / sel.length) - 1;
}

/** Ultimo anno completo (il 2026 è parziale ed escluso dalle medie). */
export function lastFullYear(rows: AnnualRow[]): number {
  return Math.max(...rows.filter((r) => !r.partial).map((r) => r.year));
}

/** Differenziale = CAGR(key) − CAGR(ETF) (FORMULE par. 8). */
export function deltaVsEtf(rows: AnnualRow[], y0: number, y1: number, key: AnnualKey = 'fund_pre_tax', etf: AnnualKey = 'acwi_eur'): number {
  return cagr(rows, key, y0, y1) - cagr(rows, etf, y0, y1);
}

export interface DiffStats {
  n: number;
  mean: number;
  median: number;
  /** deviazione standard campionaria (n − 1) */
  sd: number;
  se: number;
  /** media ± 1,96 · errore standard */
  ci95: [number, number];
  positive: number;
  values: { year: number; value: number }[];
}

/** Statistiche dei differenziali annui (fondo prima dell'imposta − ETF). */
export function diffStats(rows: AnnualRow[], y0: number, y1: number, key: AnnualKey = 'fund_pre_tax', etf: AnnualKey = 'acwi_eur'): DiffStats {
  const values = rows.filter((r) => r.year >= y0 && r.year <= y1).map((r) => ({ year: r.year, value: r[key] - r[etf] }));
  const v = values.map((x) => x.value);
  const n = v.length;
  const mean = v.reduce((a, b) => a + b, 0) / n;
  const sorted = [...v].sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2]! : (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  const se = sd / Math.sqrt(n);
  return { n, mean, median, sd, se, ci95: [mean - 1.96 * se, mean + 1.96 * se], positive: v.filter((x) => x > 0).length, values };
}

export interface LagDecomposition {
  /** CAGR(ricostruito) − CAGR(ETF) */
  composition: number;
  /** CAGR(benchmark prima dell'imposta) − CAGR(ricostruito) */
  calculation: number;
  /** CAGR(fondo prima dell'imposta) − CAGR(benchmark prima dell'imposta) */
  manager: number;
  total: number;
}

/** Scomposizione del ritardo (SPEC par. 5.3). */
export function lagDecomposition(rows: AnnualRow[], y0: number, y1: number): LagDecomposition {
  const c = (k: AnnualKey) => cagr(rows, k, y0, y1);
  return {
    composition: c('bench_rebuilt') - c('acwi_eur'),
    calculation: c('bench_pre_tax') - c('bench_rebuilt'),
    manager: c('fund_pre_tax') - c('bench_pre_tax'),
    total: c('fund_pre_tax') - c('acwi_eur'),
  };
}

export interface DeltaPreset {
  id: 'storico' | 'ultimi10' | 'ultimi5' | 'benchmark' | 'passivo';
  label: string;
  value: number;
  /** anni usati; null per il preset senza dati */
  years: [number, number] | null;
}

/** Preset del differenziale calcolati dai dati (SPEC par. 3.3 e 7), come nel prototipo v2. */
export function deltaPresets(rows: AnnualRow[]): DeltaPreset[] {
  const last = lastFullYear(rows);
  return [
    { id: 'storico', label: 'Storico', value: deltaVsEtf(rows, 2014, last), years: [2014, last] },
    { id: 'ultimi10', label: '10 anni', value: deltaVsEtf(rows, last - 9, last), years: [last - 9, last] },
    { id: 'ultimi5', label: '5 anni', value: deltaVsEtf(rows, last - 4, last), years: [last - 4, last] },
    { id: 'benchmark', label: 'Benchmark', value: deltaVsEtf(rows, 2014, last, 'bench_pre_tax'), years: [2014, last] },
    { id: 'passivo', label: 'Passivo', value: 0, years: null },
  ];
}

/** Rendimento cumulato di una serie di rendimenti annui: Π(1 + r) − 1. */
export function cumulative(values: number[]): number {
  return values.reduce((acc, v) => acc * (1 + v), 1) - 1;
}

/** Indice "100 a fine anno precedente al primo": prodotto cumulato. */
export function indexSeries(values: number[], base = 100): number[] {
  let acc = base;
  return values.map((v) => (acc *= 1 + v));
}
