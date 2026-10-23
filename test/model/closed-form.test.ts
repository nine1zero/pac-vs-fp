// SPEC par. 4.5: la forma chiusa coincide con la ricorsione al centesimo. Par. 2: mappa 40×120 in meno di 50 ms.
import { describe, expect, it } from 'vitest';
import {
  EXAMPLE_PARAMS,
  breakeven,
  breakevenHorizon,
  convenienceMap,
  crossings,
  deltaGrid,
  fundValues,
  netAt,
  netByHorizon,
  precompute,
  simulate,
  yearlyFlows,
  type ExitMode,
  type ModelParams,
} from '../../src/model';
import { expectEuro } from './helpers';

const profiles: [string, ModelParams][] = [
  ['profilo d’esempio', EXAMPLE_PARAMS],
  ['importo fisso, recupero non dedotti', { ...EXAMPLE_PARAMS, annual_saving: 3000, recoverable_non_deducted: 6000 }],
  ['RAL 20.000 €, versamento diretto', { ...EXAMPLE_PARAMS, ral: 20000, payroll_deduction: false }],
];
const deltas = [-0.3, -0.12, -0.0581, -0.02, 0, 0.03];
const modes: ExitMode[] = ['Pensione', 'Riscatto'];

describe.each(profiles)('forma chiusa contro ricorsione: %s', (_name, p) => {
  const rows = yearlyFlows(p);
  const pre = precompute(p, rows);

  it('capitale netto per ogni δ, orizzonte, modalità e scenario', () => {
    for (const d of deltas)
      for (const mode of modes)
        for (const h of [1, 2, 5, 13, rows.length]) {
          const rec = simulate(p, rows, d, h, mode);
          for (let s = 0; s < 3; s++) expectEuro(netAt(pre, s, d, h, mode), rec[s]!.total_net, `δ ${d} h ${h} ${mode} S${s + 1}`);
        }
  });

  it('valore del fondo anno per anno e netByHorizon', () => {
    for (const d of deltas) {
      const rec = simulate(p, rows, d);
      for (let s = 0; s < 3; s++) {
        const fv = fundValues(pre, s, d);
        expectEuro(fv[rows.length - 1]!, rec[s]!.fund_value, `fondo δ ${d} S${s + 1}`);
      }
      const byH = netByHorizon(pre, d, (h) => (h < rows.length ? 'Riscatto' : p.exit_mode));
      for (const h of [1, 7, rows.length]) {
        const rec2 = simulate(p, rows, d, h, h < rows.length ? 'Riscatto' : p.exit_mode);
        for (let s = 0; s < 3; s++) expectEuro(byH[h - 1]![s]!, rec2[s]!.total_net, `h ${h} S${s + 1}`);
      }
    }
  });
});

describe('pareggi', () => {
  const p = EXAMPLE_PARAMS;
  const rows = yearlyFlows(p);
  const pre = precompute(p, rows);

  it('al pareggio i due scenari hanno lo stesso capitale; sopra conviene A', () => {
    const be = breakeven(pre, 1, 2) as number;
    const at = (d: number) => netAt(pre, 1, d, pre.n, 'Pensione') - netAt(pre, 2, d, pre.n, 'Pensione');
    expect(Math.abs(at(be))).toBeLessThan(0.01);
    expect(at(be + 0.001)).toBeGreaterThan(0);
    expect(at(be - 0.001)).toBeLessThan(0);
  });

  it('orizzonte di pareggio: primo h con δ*(h) > δ', () => {
    const modeFor = (h: number): ExitMode => (h < pre.n ? 'Riscatto' : p.exit_mode);
    const h = breakevenHorizon(pre, 1, 0, p.delta, modeFor);
    expect(h).not.toBeNull();
    const be = breakeven(pre, 1, 0, h!, modeFor(h!));
    expect(typeof be === 'number' ? be > p.delta : be === 'mai').toBe(true);
    for (let k = 1; k < h!; k++) {
      const b = breakeven(pre, 1, 0, k, modeFor(k));
      expect(b === 'sempre' || (typeof b === 'number' && b <= p.delta)).toBe(true);
    }
  });

  it('pareggi nel tempo interpolati tra anni consecutivi (FORMULE par. 9)', () => {
    expect(crossings([10, 4, -2], [0, 0, 0])).toEqual([1 + 4 / 6]);
    expect(crossings([1, 2, 3], [0, 0, 0])).toEqual([]);
    expect(crossings([-3, 1], [0, 0])).toEqual([0.75]);
  });
});

describe('mappa di convenienza', () => {
  it('coincide con la simulazione cella per cella', () => {
    const p = EXAMPLE_PARAMS;
    const rows = yearlyFlows(p);
    const pre = precompute(p, rows);
    const ds = deltaGrid();
    expect(ds.length).toBe(61);
    expect(ds[0]).toBe(-0.12);
    expect(Math.abs(ds[60]! - 0.03)).toBeLessThan(1e-12);
    const modeFor = (h: number): ExitMode => (h < pre.n ? 'Riscatto' : p.exit_mode);
    const map = convenienceMap(pre, ds, modeFor);
    for (const i of [0, 25, 60])
      for (const h of [1, 10, pre.n]) {
        const rec = simulate(p, rows, ds[i]!, h, modeFor(h)).map((r) => r.total_net);
        const cell = i * pre.n + h - 1;
        rec.forEach((v, s) => expectEuro(map.totals[cell * 3 + s]!, v));
        expect(map.best[cell]).toBe(rec.indexOf(Math.max(...rec)));
      }
  });

  it('40 anni × 120 differenziali in meno di 50 ms', () => {
    const p: ModelParams = { ...EXAMPLE_PARAMS, birth_year: 1999 };
    const rows = yearlyFlows(p);
    expect(rows.length).toBe(40);
    const ds = deltaGrid(-0.12, 0.03, 0.15 / 119);
    expect(ds.length).toBe(120);
    let best = Infinity;
    for (let run = 0; run < 5; run++) {
      const t0 = performance.now();
      convenienceMap(precompute(p, rows), ds, (h) => (h < rows.length ? 'Riscatto' : 'Pensione'));
      best = Math.min(best, performance.now() - t0);
    }
    expect(best).toBeLessThan(50);
  });
});
