// Punti di pareggio (SPEC par. 4.6; docs/FORMULE.md par. 9).
import { netAt, type Precomputed } from './closedForm';
import type { Breakeven, ExitMode } from './types';

export const BREAKEVEN_LO = -0.95;
export const BREAKEVEN_HI = 0.5;
const ITERATIONS = 80;

/** Differenziale δ* per cui Netto_A = Netto_B dopo h anni (bisezione su [−95%; +50%]).
 * Sopra δ* conviene A, sotto conviene B. "sempre": A migliore in tutto l'intervallo; "mai": mai. */
export function breakeven(pre: Precomputed, a: number, b: number, h: number = pre.n, mode: ExitMode = pre.p.exit_mode): Breakeven {
  const f = (d: number) => netAt(pre, a, d, h, mode) - netAt(pre, b, d, h, mode);
  let lo = BREAKEVEN_LO;
  let hi = BREAKEVEN_HI;
  if (f(lo) > 0) return 'sempre';
  if (f(hi) < 0) return 'mai';
  for (let i = 0; i < ITERATIONS; i++) {
    const m = (lo + hi) / 2;
    if (f(m) > 0) hi = m;
    else lo = m;
  }
  return (lo + hi) / 2;
}

/** Orizzonte di pareggio con il differenziale scelto: il primo h per cui δ*(h) > δ, cioè da cui conviene B.
 * null se A conviene per qualsiasi uscita fino all'ultimo anno. */
export function breakevenHorizon(
  pre: Precomputed,
  a: number,
  b: number,
  delta: number,
  modeFor: (h: number) => ExitMode,
): number | null {
  for (let h = 1; h <= pre.n; h++) {
    const be = breakeven(pre, a, b, h, modeFor(h));
    const above = be === 'mai' || (typeof be === 'number' && be > delta);
    if (above) return h;
  }
  return null;
}

/** Pareggi "nel tempo": dove la differenza d_k = v_A[k] − v_B[k] cambia segno tra anni consecutivi,
 * interpolato linearmente: x = k − 1 + d_{k−1} / (d_{k−1} − d_k), con k indice da 0. */
export function crossings(valuesA: number[], valuesB: number[]): number[] {
  const out: number[] = [];
  for (let k = 1; k < valuesA.length; k++) {
    const d0 = valuesA[k - 1]! - valuesB[k - 1]!;
    const d1 = valuesA[k]! - valuesB[k]!;
    if (d0 === 0) {
      if (k === 1) out.push(0);
      continue;
    }
    if (d1 === 0 || Math.sign(d0) !== Math.sign(d1)) out.push(k - 1 + d0 / (d0 - d1));
  }
  return out;
}
