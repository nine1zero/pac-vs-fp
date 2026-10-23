// SPEC par. 1.3 e 4.7: il profilo reale si usa solo in locale, se esiste; mai nel repository.
// Il test confronta src/model con reference/model.py eseguito sullo stesso file, senza riportarne i numeri.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { EXAMPLE_PARAMS, breakeven, precompute, simulate, yearlyFlows, type ModelParams } from '../../src/model';
import { expectBreakeven, expectEuro } from './helpers';

const candidates = ['spec/tests/private/profilo_privato.json', 'tests/private/profilo_privato.json'];
const file = candidates.find((f) => existsSync(f));

function hasPython(): boolean {
  try {
    execFileSync('python3', ['--version']);
    return true;
  } catch {
    return false;
  }
}

describe.skipIf(!file || !hasPython())('profilo privato (solo in locale)', () => {
  it('coincide con reference/model.py', () => {
    let prof = JSON.parse(readFileSync(file!, 'utf8')) as Record<string, unknown>;
    const values = Object.values(prof);
    if (values.length === 1 && typeof values[0] === 'object' && values[0] !== null) prof = values[0] as Record<string, unknown>;
    const p = { ...EXAMPLE_PARAMS, ...((prof.defaults ?? prof) as Partial<ModelParams>) } as ModelParams;
    const ref = JSON.parse(execFileSync('python3', ['spec/reference/model.py', file!], { encoding: 'utf8' }));
    const rows = yearlyFlows(p);
    const pre = precompute(p, rows);
    simulate(p, rows).forEach((r, s) => expectEuro(r.total_net, ref.defaults_pensione_delta_storico[s], `S${s + 1}`));
    simulate(p, rows, -0.02).forEach((r, s) => expectEuro(r.total_net, ref.delta_minus2_pensione[s], `δ −2% S${s + 1}`));
    const b = ref.breakeven_pensione_28y;
    expectBreakeven(breakeven(pre, 1, 2), b['2vs3'], '2vs3');
    expectBreakeven(breakeven(pre, 0, 2), b['1vs3'], '1vs3');
    expectBreakeven(breakeven(pre, 1, 0), b['2vs1'], '2vs1');
    for (const [h, bh] of Object.entries(ref.breakeven_riscatto_by_horizon as Record<string, Record<string, number | string>>)) {
      if (Number(h) > pre.n) continue;
      // model.py arrotonda questi pareggi a 6 decimali
      for (const [key, a, bb] of [['2vs3', 1, 2], ['1vs3', 0, 2], ['2vs1', 1, 0]] as const) {
        const got = breakeven(pre, a, bb, Number(h), 'Riscatto');
        const exp = bh[key]!;
        expectBreakeven(typeof got === 'number' && typeof exp === 'number' ? Math.round(got * 1e6) / 1e6 : got, exp, `${h} ${key}`);
      }
    }
  });
});
