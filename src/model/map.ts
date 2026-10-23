// Mappa "Per quanti anni conviene" (SPEC par. 3.4 A e 4.6): scenario migliore per differenziale × orizzonte.
import { netByHorizon, type Precomputed } from './closedForm';
import type { ExitMode } from './types';

export interface ConvenienceMap {
  deltas: number[];
  /** n = numero di orizzonti (1..n) */
  n: number;
  /** capitale netto: totals[(i·n + h − 1)·3 + s] */
  totals: Float64Array;
  /** scenario migliore per cella: best[i·n + h − 1] */
  best: Uint8Array;
  /** margine sul secondo, in frazione del capitale del migliore */
  margin: Float64Array;
}

/** Griglia di differenziali da `from` a `to` (inclusi) con passo `step`. */
export function deltaGrid(from = -0.12, to = 0.03, step = 0.0025): number[] {
  const count = Math.round((to - from) / step);
  return Array.from({ length: count + 1 }, (_, i) => from + i * step);
}

/** Calcolo con la forma chiusa. Prima dell'ultimo anno l'uscita è un riscatto (FORMULE par. 11), salvo `modeFor`. */
export function convenienceMap(pre: Precomputed, deltas: number[], modeFor: (h: number) => ExitMode): ConvenienceMap {
  const { n } = pre;
  const totals = new Float64Array(deltas.length * n * 3);
  const best = new Uint8Array(deltas.length * n);
  const margin = new Float64Array(deltas.length * n);
  deltas.forEach((d, i) => {
    const byH = netByHorizon(pre, d, modeFor);
    for (let h = 1; h <= n; h++) {
      const v = byH[h - 1]!;
      const cell = i * n + h - 1;
      totals.set(v, cell * 3);
      const order = [0, 1, 2].sort((x, y) => v[y]! - v[x]!);
      best[cell] = order[0]!;
      const top = v[order[0]!]!;
      margin[cell] = top !== 0 ? (top - v[order[1]!]!) / Math.abs(top) : 0;
    }
  });
  return { deltas, n, totals, best, margin };
}
