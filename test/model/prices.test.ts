// @vitest-environment jsdom
// Serie mensili di etf_monthly.csv per la pagina "I miei versamenti" (SPEC pagina G; docs/FONTI.md).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import extra from '../../public/data/etf_annual_extra.json';
import { azionario, etfMonthly, priceAt } from '../../src/data';
import { parseDettaglio } from '../../src/import/dettaglio';
import { monthlySeries, priceCoverage } from '../../src/model/contributions';

const sample = parseDettaglio(readFileSync(resolve('spec/tests/fixtures/sample_dettaglio_ok.xls'), 'utf8'), { today: '2026-10-23' }).movements;

describe('etf_monthly.csv', () => {
  it('primo mese di ogni serie; le celle vuote non diventano prezzi', () => {
    expect(etfMonthly.first).toBe('2011-12-31');
    expect(etfMonthly.last).toBe('2026-10-31');
    expect(etfMonthly.firstOf).toEqual({
      acwi_eur: '2011-12-31',
      msci_world_eur: '2011-12-31',
      msci_europe_eur: '2011-12-31',
      estr_eur: '2011-12-31',
      vanguard_eur: '2013-12-31',
      spdr_imi_eur: '2011-12-31',
    });
    expect(priceAt(etfMonthly, '2013-11-30', 'vanguard_eur')).toBeUndefined();
    for (const row of etfMonthly.byMonthEnd.values()) for (const v of Object.values(row)) expect(Number.isFinite(v)).toBe(true);
  });

  // controllo indipendente: rendimenti annui da altre quotazioni dello stesso fondo (etf_annual_extra.json, VGWL.DE e SPYI.DE).
  // Vanguard coincide entro 0,5 punti; SPDR entro 2 punti perché Xetra è chiusa il 31/12 e Parigi no.
  it.each([
    ['vanguard_eur', 'vanguard_ftse_all_world', 0.005],
    ['spdr_imi_eur', 'spdr_msci_acwi_imi', 0.02],
  ] as const)('%s coerente con %s', (col, key, tol) => {
    extra.years.forEach((y, i) => {
      const ref = extra[key][i];
      if (ref === null || ref === undefined || y === 2026) return;
      const r = priceAt(etfMonthly, `${y}-12-31`, col)! / priceAt(etfMonthly, `${y - 1}-12-31`, col)! - 1;
      expect(Math.abs(r - ref), `${col} ${y}`).toBeLessThanOrEqual(tol);
    });
  });
});

describe('copertura della serie per il file', () => {
  it('il file d’esempio (dal 2023) è coperto da tutti e tre gli ETF', () => {
    for (const col of ['acwi_eur', 'vanguard_eur', 'spdr_imi_eur'] as const) {
      expect(priceCoverage(sample, etfMonthly, col).covered).toBe(true);
      const s = monthlySeries(sample, azionario, etfMonthly, col)!;
      expect(s.etfInside.every(Number.isFinite)).toBe(true);
      expect(s.etfInside[s.etfInside.length - 1]).toBeGreaterThan(0);
    }
  });

  it('versamenti dal 2013: Vanguard non si può scegliere, SPDR e iShares sì', () => {
    const early = sample.map((m, i) => (i === sample.length - 1 && m.dataValore ? { ...m, dataValore: '2013-06-14' } : m));
    const v = priceCoverage(early, etfMonthly, 'vanguard_eur');
    expect(v).toEqual({ covered: false, from: '2013-12-31', firstNeeded: '2013-06-30' });
    expect(priceCoverage(early, etfMonthly, 'spdr_imi_eur').covered).toBe(true);
    expect(priceCoverage(early, etfMonthly, 'acwi_eur').covered).toBe(true);
  });
});
