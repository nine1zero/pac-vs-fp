// SPEC par. 8 punto 2: lo storico riproduce golden_history.json (reference/history.py).
import { describe, expect, it } from 'vitest';
import golden from '../../spec/tests/golden_history.json';
import { assicurativo, azionario, etfMonthly } from '../../src/data';
import {
  annualTable,
  cagr,
  cumulative,
  deltaPresets,
  deltaVsEtf,
  diffStats,
  lagDecomposition,
  lastFullYear,
  type AnnualKey,
} from '../../src/model/history';
import { EXAMPLE_PARAMS } from '../../src/model';

const rows = annualTable(azionario, etfMonthly);
const near = (a: number, b: number, tol: number, label = '') =>
  expect(Math.abs(a - b), `${label}: ${a} invece di ${b}`).toBeLessThanOrEqual(tol);

describe('golden_history.json', () => {
  const keys = Object.keys(golden).filter((k) => typeof (golden as Record<string, unknown>)[k] === 'object') as AnnualKey[];
  it.each(keys)('CAGR %s', (key) => {
    const g = (golden as unknown as Record<string, Record<string, number>>)[key]!;
    near(cagr(rows, key, 2012, 2025), g['2012-2025']!, 1e-12, `${key} 2012-2025`);
    near(cagr(rows, key, 2014, 2025), g['2014-2025']!, 1e-12, `${key} 2014-2025`);
  });

  it('differenziali 2014-2025 del fondo e del benchmark', () => {
    near(deltaVsEtf(rows, 2014, 2025), golden.delta_fund_minus_etf_2014_2025, 1e-12);
    near(deltaVsEtf(rows, 2014, 2025, 'bench_pre_tax'), golden.delta_bench_minus_etf_2014_2025, 1e-12);
  });

  it('il differenziale del profilo d’esempio è lo storico 2014-2025', () => {
    near(EXAMPLE_PARAMS.delta, deltaVsEtf(rows, 2014, 2025), 1e-15);
  });
});

describe('statistiche e preset (FORMULE par. 8, SPEC par. 5.2-5.3)', () => {
  it('il 2026 è parziale ed escluso dalle medie', () => {
    expect(lastFullYear(rows)).toBe(2025);
    expect(rows.find((r) => r.year === 2026)?.partial).toBe(true);
  });

  it('differenziali annui 2012-2025: media, mediana, deviazione standard, intervallo al 95%, anni positivi', () => {
    const s = diffStats(rows, 2012, 2025);
    expect(s.n).toBe(14);
    near(s.mean, -0.0616, 0.00005, 'media');
    near(s.median, -0.0682, 0.00005, 'mediana');
    near(s.sd, 0.0696, 0.00005, 'deviazione standard');
    near(s.se, 0.0186, 0.00005, 'errore standard');
    near(s.ci95[0], -0.0981, 0.00005, 'intervallo, minimo');
    near(s.ci95[1], -0.0251, 0.00005, 'intervallo, massimo');
    expect(s.positive).toBe(3);
  });

  it('scomposizione del ritardo 2014-2025: −2,1 / −2,7 / −1,0 = −5,8 punti', () => {
    const d = lagDecomposition(rows, 2014, 2025);
    near(d.composition, -0.021, 0.0005, 'composizione');
    near(d.calculation, -0.027, 0.0005, 'calcolo del benchmark');
    near(d.manager, -0.01, 0.0005, 'gestore e costi');
    near(d.composition + d.calculation + d.manager, d.total, 1e-12, 'somma');
    near(d.total, golden.delta_fund_minus_etf_2014_2025, 1e-12, 'totale');
  });

  it('preset del differenziale come nel prototipo v2', () => {
    const p = Object.fromEntries(deltaPresets(rows).map((x) => [x.id, x.value]));
    // valori del prototipo: −5,81 / −5,04 / −3,95 / −4,80 / 0
    near(p.storico!, -0.0581, 0.00005);
    near(p.ultimi10!, -0.0504, 0.00005);
    near(p.ultimi5!, -0.0395, 0.00005);
    near(p.benchmark!, -0.048, 0.00005);
    expect(p.passivo).toBe(0);
  });
});

describe('comparto Assicurativo, cumulato 2018-2025 (SPEC par. 5.4)', () => {
  const ys = assicurativo.years.filter((y) => typeof y.year === 'number' && y.year >= 2018 && y.year <= 2025);
  it('assicurativo +18,0%, ISTAT +20,4%, TFR netto +24,0%', () => {
    expect(ys.length).toBe(8);
    near(cumulative(ys.map((y) => y.net_weighted)), 0.18, 0.0005, 'assicurativo');
    near(cumulative(ys.map((y) => y.istat)), 0.204, 0.0005, 'ISTAT');
    near(cumulative(ys.map((y) => y.tfr_net)), 0.24, 0.0005, 'TFR');
    near((1 + cumulative(ys.map((y) => y.net_weighted))) ** (1 / 8) - 1, 0.0209, 0.00005, 'media annua');
    near((1 + cumulative(ys.map((y) => y.istat))) ** (1 / 8) - 1, 0.0235, 0.00005, 'media annua ISTAT');
  });
  it('comparto Azionario netto 2018-2025 +45,6%', () => {
    near(cumulative(rows.filter((r) => r.year >= 2018 && r.year <= 2025).map((r) => r.fund_net)), 0.456, 0.0005);
  });
});
