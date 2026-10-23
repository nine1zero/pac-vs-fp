// Tutti i numeri della Landing calcolati da src/model (nessun calcolo nella UI).
import { azionario, etfMonthly } from '../data';
import {
  breakeven,
  breakevenHorizon,
  convenienceMap,
  crossings,
  deltaGrid,
  minMemberFromRal,
  netAt,
  netByHorizon,
  precompute,
  simulate,
  taxSaving,
  yearlyFlows,
  type Breakeven,
  type ConvenienceMap,
  type ExitMode,
  type ModelParams,
  type ScenarioResult,
} from '../model';
import { annualTable, deltaPresets, diffStats, lastFullYear } from '../model/history';

export const SCENARIO_NAMES = ['Minimo per l’azienda + PAC', 'Deduzione massima + PAC', 'Solo TFR + PAC'] as const;
export const SCENARIO_SHORT = ['Minimo per l’azienda', 'Deduzione massima', 'Solo TFR'] as const;
export const SCENARIO_DESC = [
  'Nel fondo versi solo il minimo che ti dà il contributo dell’azienda. Tutto il resto del risparmio va nel PAC.',
  'Nel fondo versi fino al limite deducibile, contando anche il contributo dell’azienda. Il rimborso IRPEF che ottieni lo investi nel PAC.',
  'Nel fondo va solo il TFR, senza contributo tuo né dell’azienda. Tutto il risparmio va nel PAC.',
] as const;

/** Coppie di pareggio nell'ordine della SPEC: (2,1), (2,3), (1,3). Sopra δ* conviene la prima. */
export const PAIRS: [number, number][] = [
  [1, 0],
  [1, 2],
  [0, 2],
];

export const MAP_DELTAS = deltaGrid(-0.12, 0.03, 0.0025).reverse(); // dall'alto: +3% … −12%
export const LINE_DELTAS = deltaGrid(-0.12, 0.03, 0.0025);

// Storico, calcolato una volta (SPEC par. 5)
export const HISTORY = (() => {
  const rows = annualTable(azionario, etfMonthly);
  const last = lastFullYear(rows);
  return { rows, last, stats: diffStats(rows, 2012, last), presets: deltaPresets(rows) };
})();

export interface Results {
  p: ModelParams;
  n: number;
  exitYear: number;
  res: [ScenarioResult, ScenarioResult, ScenarioResult];
  /** indici degli scenari dal migliore al peggiore */
  rank: number[];
  breakevens: { pair: [number, number]; value: Breakeven }[];
  /** pareggio 2-1 nel tempo con il δ scelto: primo orizzonte in cui conviene la 1 (null = mai) */
  horizon21: number | null;
  /** scenario migliore per ogni differenziale di LINE_DELTAS, all'uscita prevista */
  zones: number[];
  /** scenario migliore per ogni anno di uscita (riscatto prima dell'ultimo anno) */
  strip: number[];
  map: ConvenienceMap;
  /** capitale netto per anno di uscita con la modalità scelta: time[h − 1][s] */
  time: number[][];
  timeCrossings: { pair: [number, number]; x: number; value: number; winnerAfter: number }[];
  /** capitale netto all'uscita per ogni δ di LINE_DELTAS: byDelta[i][s] */
  byDelta: number[][];
  /** versamento del primo anno per la deduzione massima e risparmio fiscale effettivo */
  maxDeduction: number;
  effectiveRate: number;
  /** importo fisso: minimo (quota minima per il contributo dell'azienda) e massimo */
  savingMin: number;
  savingMax: number;
  /** quota minima mensile stimata dalla RAL */
  minMonthlyFromRal: number;
}

export const modeForStrip =
  (n: number, last: ExitMode) =>
  (h: number): ExitMode =>
    h < n ? 'Riscatto' : last;

export function computeResults(p: ModelParams): Results {
  const rows = yearlyFlows(p);
  const n = rows.length;
  const pre = precompute(p, rows);
  const res = simulate(p, rows);
  const rank = [0, 1, 2].sort((a, b) => res[b]!.total_net - res[a]!.total_net || a - b);
  const modeFor = modeForStrip(n, p.exit_mode);
  const map = convenienceMap(pre, MAP_DELTAS, modeFor);

  const time = netByHorizon(pre, p.delta, () => p.exit_mode);
  const timeCrossings: Results['timeCrossings'] = [];
  for (const pair of [
    [0, 1],
    [1, 2],
    [0, 2],
  ] as [number, number][]) {
    const a = time.map((v) => v[pair[0]]!);
    const b = time.map((v) => v[pair[1]]!);
    for (const x of crossings(a, b)) {
      const k = Math.floor(x);
      const t = x - k;
      const value = a[k]! + ((a[k + 1] ?? a[k]!) - a[k]!) * t;
      const after = Math.min(n - 1, k + 1);
      timeCrossings.push({ pair, x, value, winnerAfter: a[after]! - b[after]! > 0 ? pair[0] : pair[1] });
    }
  }

  const byDelta = LINE_DELTAS.map((d) => [0, 1, 2].map((s) => netAt(pre, s, d, n, p.exit_mode)));
  const zones = byDelta.map((v) => v.indexOf(Math.max(...v)));
  const strip = Array.from({ length: n }, (_, i) => {
    const h = i + 1;
    const r = [0, 1, 2].map((s) => netAt(pre, s, p.delta, h, modeFor(h)));
    return r.indexOf(Math.max(...r));
  });

  const maxDeduction = rows[0]!.J;
  const floor = Math.max(minMemberFromRal(p.ral, p.inps_first_band), rows[0]!.E);
  return {
    p,
    n,
    exitYear: p.start_year + n - 1,
    res,
    rank,
    breakevens: PAIRS.map((pair) => ({ pair, value: breakeven(pre, pair[0], pair[1], n, p.exit_mode) })),
    horizon21: breakevenHorizon(pre, 1, 0, p.delta, modeFor),
    zones,
    strip,
    map,
    time,
    timeCrossings,
    byDelta,
    maxDeduction,
    effectiveRate: taxSaving(p, p.ral, maxDeduction) / maxDeduction,
    savingMin: Math.min(maxDeduction, Math.ceil(floor / 50) * 50),
    savingMax: maxDeduction,
    minMonthlyFromRal: minMemberFromRal(p.ral, p.inps_first_band) / p.months,
  };
}
