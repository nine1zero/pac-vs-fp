// SPEC par. 8 punto 11: casi di spec/tests/parity_prototype.js (importo fisso, RAL bassa e alta, riscatto).
// Tre fonti a confronto: reference/model.py (golden_parity_cases.json), il prototipo v2 e src/model.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import golden from '../../spec/tests/golden_parity_cases.json';
import { EXAMPLE_PARAMS, marginalRate, simulate, yearlyFlows, type ExitMode, type ModelParams } from '../../src/model';
import { expectEuro } from './helpers';

type Case = (typeof golden.cases)[keyof typeof golden.cases];

function runModel(c: Case): number[] {
  const p: ModelParams = { ...EXAMPLE_PARAMS, ...(c.params as Partial<ModelParams>) };
  const rows = yearlyFlows(p);
  return simulate(p, rows, c.delta ?? p.delta, c.horizon ?? rows.length, (c.mode as ExitMode | null) ?? p.exit_mode).map(
    (r) => r.total_net,
  );
}

/** Esegue il codice del prototipo come fa parity_prototype.js. */
function prototype() {
  const html = readFileSync(new URL('../../spec/design/v2/Landing.dc.html', import.meta.url), 'utf8');
  const code = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)![1]!;
  class DCLogic {
    props: unknown;
    state: Record<string, unknown> = {};
    constructor(props?: unknown) {
      this.props = props ?? {};
    }
    setState(o: Record<string, unknown>) {
      Object.assign(this.state, o);
    }
  }
  const window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const Component = new Function('window', 'DCLogic', `${code}; return Component;`)(window, DCLogic);
  const c = new Component({});
  c.state.delta = golden.delta;
  return c;
}

// stato del prototipo per ogni caso, cumulato come in parity_prototype.js
const protoState: Record<string, Record<string, unknown>> = {
  pens: {},
  d0: {},
  r10: {},
  fix: { savMode: 'fix', saving: 3000 },
  fixLow: { savMode: 'fix', saving: 200 },
  ral90: { savMode: 'max', ral: 90000 },
  ral20: { ral: 20000 },
};

describe('parità con il modello di riferimento e il prototipo v2', () => {
  const c = prototype();
  const protoTotals: Record<string, number[]> = {};
  for (const [name, gc] of Object.entries(golden.cases)) {
    Object.assign(c.state, protoState[name]);
    const pp = c.params();
    const rows = c.flows(pp);
    const res = c.sim(pp, rows, gc.delta ?? pp.delta, gc.horizon ?? rows.length, gc.mode ?? pp.mode);
    protoTotals[name] = res.map((r: { tot: number }) => r.tot);
  }

  it.each(Object.entries(golden.cases))('%s', (name, gc) => {
    const ts = runModel(gc);
    ts.forEach((v, s) => {
      expectEuro(v, gc.total_net[s]!, `${name} S${s + 1} contro model.py`);
      expectEuro(v, protoTotals[name]![s]!, `${name} S${s + 1} contro il prototipo`);
    });
  });

  it('aliquota effettiva del primo anno', () => {
    const rows = yearlyFlows(EXAMPLE_PARAMS);
    expect(Math.abs(marginalRate(EXAMPLE_PARAMS, rows[0]!.J) - golden.tau)).toBeLessThan(1e-12);
  });
});
