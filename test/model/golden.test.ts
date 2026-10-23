// SPEC par. 8 punti 1 e 11: il modello TypeScript riproduce reference/model.py (golden_model_example.json).
import { describe, expect, it } from 'vitest';
import golden from '../../spec/tests/golden_model_example.json';
import {
  EXAMPLE_PARAMS as p,
  breakeven,
  marginalRate,
  precompute,
  simulate,
  taxSaving,
  taxTotal,
  taxableIncome,
  yearlyFlows,
  type ScenarioFlow,
} from '../../src/model';
import { expectBreakeven, expectEuro } from './helpers';

const rows = yearlyFlows(p);
const pre = precompute(p, rows);
const totals = (r: ReturnType<typeof simulate>) => r.map((x) => x.total_net);

describe('golden_model_example.json', () => {
  it('usa lo stesso differenziale', () => {
    expect(p.delta).toBe(golden.delta);
  });

  it('risparmio fiscale effettivo sulla deduzione massima del primo anno', () => {
    expect(rows[0]!.J).toBe(4390);
    expect(Math.abs(marginalRate(p, rows[0]!.J) - golden.effective_rate_first_year_max_deduction)).toBeLessThan(5e-7);
  });

  it.each([
    ['pensione, δ storico', golden.pensione_delta_default, () => totals(simulate(p, rows))],
    ['pensione, δ storico, euro di oggi', golden.pensione_delta_default_real, () => simulate(p, rows).map((x) => x.total_real)],
    ['pensione, δ = 0', golden.pensione_delta_0, () => totals(simulate(p, rows, 0))],
    ['riscatto a 10 anni', golden.riscatto_10y_delta_default, () => totals(simulate(p, rows, p.delta, 10, 'Riscatto'))],
  ])('capitale netto: %s', (label, expected, run) => {
    run().forEach((v, s) => expectEuro(v, expected[s]!, `${label} S${s + 1}`));
  });

  it('pareggi a pensione', () => {
    const b = golden.breakeven_pensione_full;
    expectBreakeven(breakeven(pre, 1, 2), b['2vs3'], '2vs3');
    expectBreakeven(breakeven(pre, 0, 2), b['1vs3'], '1vs3');
    expectBreakeven(breakeven(pre, 1, 0), b['2vs1'], '2vs1');
  });

  it.each(Object.entries(golden.breakeven_riscatto_by_horizon))('pareggi per riscatto dopo %s anni', (h, b) => {
    const hh = Number(h);
    expectBreakeven(breakeven(pre, 1, 2, hh, 'Riscatto'), b['2vs3'], `${h} 2vs3`);
    expectBreakeven(breakeven(pre, 0, 2, hh, 'Riscatto'), b['1vs3'], `${h} 1vs3`);
    expectBreakeven(breakeven(pre, 1, 0, hh, 'Riscatto'), b['2vs1'], `${h} 2vs1`);
  });

  it('prima riga dei flussi', () => {
    const r = rows[0]!;
    const g = golden.yearly_row_1;
    for (const k of ['k', 'year', 'E', 'F', 'G', 'H', 'I', 'J', 'K'] as const) expectEuro(r[k], g[k], k);
    g.s.forEach((gs, s) => {
      for (const [k, v] of Object.entries(gs)) expectEuro(r.s[s]![k as keyof ScenarioFlow]!, v, `S${s + 1}.${k}`);
    });
  });

  it.each(Object.entries(golden.tax_checks))('tax_checks, RAL %s €', (ral, c) => {
    const r = taxableIncome(p, Number(ral));
    expectEuro(r, c.reddito, 'reddito');
    expectEuro(taxTotal(p, r), c.imposte, 'imposte');
    expectEuro(taxSaving(p, Number(ral), 1000), c.risparmio_su_1000, 'risparmio su 1.000 €');
  });
});

describe('scomposizione del profilo d’esempio (FORMULE par. 2)', () => {
  it('deduzione di 4.390 € con RAL 45.000 €: imposte 10.830,24 → 8.449,10, risparmio 2.381,15', () => {
    const r = taxableIncome(p, 45000);
    expectEuro(r, 40864.5);
    expectEuro(r - 4390, 36474.5);
    expectEuro(taxTotal(p, r), 10830.24);
    expectEuro(taxTotal(p, r - 4390), 8449.1);
    expectEuro(taxSaving(p, 45000, 4390), 2381.15);
  });
});
