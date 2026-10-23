// Forma chiusa del valore del fondo al variare del differenziale (SPEC par. 4.5; docs/FORMULE.md par. 7).
// PAC, versato e base tassabile non dipendono da δ: si calcolano una volta sola.
import { etfNetReturn, fundNetReturn } from './simulate';
import { exitTax } from './tax';
import type { ExitMode, FlowRow, ModelParams } from './types';

/** Parti indipendenti da δ, per scenario s e orizzonte h (indice h − 1). */
export interface Precomputed {
  p: ModelParams;
  n: number;
  /** versamenti nel fondo Q^s_k */
  fund: number[][];
  /** base tassabile cumulata B^s_h */
  base: number[][];
  /** PAC netto all'uscita dopo h anni */
  pacNet: number[][];
}

export function precompute(p: ModelParams, rows: FlowRow[]): Precomputed {
  const re = etfNetReturn(p);
  const pacGrowth = (1 + re) ** p.contribution_year_fraction;
  const fund: number[][] = [];
  const base: number[][] = [];
  const pacNet: number[][] = [];
  for (let s = 0; s < 3; s++) {
    let B = p.current_taxable_base;
    let V = 0;
    let C = 0;
    const q: number[] = [];
    const b: number[] = [];
    const pn: number[] = [];
    for (const r of rows) {
      const x = r.s[s]!;
      q.push(x.fund);
      B += x.taxable;
      V = (r.k > 1 ? V * (1 + re) * (1 - p.stamp_duty) : 0) + x.pac * pacGrowth;
      C += x.pac;
      b.push(B);
      pn.push(V - p.capital_gain_tax * Math.max(0, V - C));
    }
    fund.push(q);
    base.push(b);
    pacNet.push(pn);
  }
  return { p, n: rows.length, fund, base, pacNet };
}

/** Valore del fondo per ogni orizzonte h = 1..n con il differenziale δ:
 * Fondo_h = Fondo_0·a^h + Σ_k Q_k·a^(h−k+φ), con a = 1 + r_n. */
export function fundValues(pre: Precomputed, s: number, delta: number): number[] {
  const { p, n } = pre;
  const a = 1 + fundNetReturn(p, delta);
  const aPhi = a ** p.contribution_year_fraction;
  const q = pre.fund[s]!;
  const out: number[] = [];
  let acc = 0; // Σ_k Q_k·a^(h−k)
  for (let h = 1; h <= n; h++) {
    acc = acc * a + q[h - 1]!;
    out.push(p.current_position * a ** h + aPhi * acc);
  }
  return out;
}

/** Capitale netto dello scenario s dopo h anni con il differenziale δ e la modalità di uscita. */
export function netAt(pre: Precomputed, s: number, delta: number, h: number, mode: ExitMode): number {
  const { p } = pre;
  const a = 1 + fundNetReturn(p, delta);
  const q = pre.fund[s]!;
  let fund = p.current_position * a ** h;
  for (let k = 1; k <= h; k++) fund += q[k - 1]! * a ** (h - k + p.contribution_year_fraction);
  const t = exitTax(p, p.start_year + h - 1, mode);
  return fund - t * pre.base[s]![h - 1]! + pre.pacNet[s]![h - 1]!;
}

/** Capitale netto dei tre scenari per ogni orizzonte con un differenziale: totals[h − 1][s].
 * `modeFor(h)` sceglie la modalità di uscita per ogni orizzonte. */
export function netByHorizon(pre: Precomputed, delta: number, modeFor: (h: number) => ExitMode): number[][] {
  const { p, n } = pre;
  const fv = [0, 1, 2].map((s) => fundValues(pre, s, delta));
  const out: number[][] = [];
  for (let h = 1; h <= n; h++) {
    const t = exitTax(p, p.start_year + h - 1, modeFor(h));
    out.push([0, 1, 2].map((s) => fv[s]![h - 1]! - t * pre.base[s]![h - 1]! + pre.pacNet[s]![h - 1]!));
  }
  return out;
}
