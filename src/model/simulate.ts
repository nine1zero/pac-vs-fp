// Valori nel tempo e all'uscita (SPEC par. 4.3-4.4; docs/FORMULE.md par. 6-7).
import { exitTax } from './tax';
import type { ExitMode, FlowRow, ModelParams, ScenarioResult } from './types';

/** Rendimento annuo dell'ETF dopo il TER. */
export function etfNetReturn(p: ModelParams): number {
  return p.etf_gross_return - p.etf_ter;
}

/** Rendimento annuo netto del fondo per un differenziale δ. */
export function fundNetReturn(p: ModelParams, delta: number): number {
  return (etfNetReturn(p) + delta) * (1 - p.fund_return_tax);
}

/** Capitale netto all'uscita dei tre scenari dopo `horizon` anni (default: fino all'uscita prevista). */
export function simulate(
  p: ModelParams,
  rows: FlowRow[],
  delta: number = p.delta,
  horizon: number = rows.length,
  mode: ExitMode = p.exit_mode,
): [ScenarioResult, ScenarioResult, ScenarioResult] {
  const re = etfNetReturn(p);
  const rn = fundNetReturn(p, delta);
  const fz = p.contribution_year_fraction;
  const exitYear = p.start_year + horizon - 1;
  const tExit = exitTax(p, exitYear, mode);
  const fundGrowth = (1 + rn) ** fz;
  const pacGrowth = (1 + re) ** fz;
  const out = [0, 1, 2].map((s) => {
    let F = p.current_position;
    let B = p.current_taxable_base;
    let V = 0;
    let C = 0;
    const series: number[] = [];
    for (const r of rows.slice(0, horizon)) {
      const x = r.s[s]!;
      F = F * (1 + rn) + x.fund * fundGrowth;
      B = B + x.taxable;
      V = (r.k > 1 ? V * (1 + re) * (1 - p.stamp_duty) : 0) + x.pac * pacGrowth;
      C = C + x.pac;
      series.push(F + V);
    }
    const fundNet = F - tExit * B;
    const pacNet = V - p.capital_gain_tax * Math.max(0, V - C);
    const total = fundNet + pacNet;
    return {
      fund_value: F,
      taxable_base: B,
      exit_tax: tExit * B,
      fund_net: fundNet,
      pac_value: V,
      pac_cost: C,
      pac_net: pacNet,
      total_net: total,
      total_real: total / (1 + p.inflation) ** (exitYear - p.base_year_real),
      series,
    };
  });
  return out as [ScenarioResult, ScenarioResult, ScenarioResult];
}
