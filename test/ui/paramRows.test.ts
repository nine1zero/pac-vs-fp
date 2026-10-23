// Pagina "Parametri e fonti": valori, modifiche, ripristino, import ed export del profilo (SPEC par. 3.4 H e 7).
import { describe, expect, it } from 'vitest';
import { params } from '../../src/data';
import { EXAMPLE_PARAMS } from '../../src/model';
import {
  currentValue,
  defaultValue,
  displayValue,
  exportProfile,
  fieldKind,
  importProfile,
  isChanged,
  resetAction,
  setAction,
} from '../../src/state/paramRows';
import { initialState, reducer, toModelParams, type State } from '../../src/state/store';

const apply = (s: State, a: ReturnType<typeof setAction>) => (a ? reducer(s, a) : s);
const byId = (id: string) => params.parameters.find((p) => p.id === id)!;

describe('righe dei parametri', () => {
  const s0 = initialState(null);

  it('all’inizio nessun parametro risulta modificato', () => {
    expect(params.parameters.filter((p) => isChanged(s0, p.id)).map((p) => p.id)).toEqual([]);
  });

  it('il differenziale di default è quello storico ed è modificabile', () => {
    expect(defaultValue('delta')).toBe(EXAMPLE_PARAMS.delta);
    expect(fieldKind(byId('delta'))).toBe('number');
  });

  it('modificare un parametro del modello cambia i risultati; il ripristino lo annulla', () => {
    let s = apply(s0, setAction('fund_return_tax', 0.25));
    expect(toModelParams(s.inputs, s.overrides).fund_return_tax).toBe(0.25);
    expect(isChanged(s, 'fund_return_tax')).toBe(true);
    s = apply(s, resetAction('fund_return_tax'));
    expect(isChanged(s, 'fund_return_tax')).toBe(false);
    expect(s.overrides).toEqual({});
  });

  it('il TER modificato torna quello dell’ETF quando si cambia ETF', () => {
    let s = apply(s0, setAction('etf_ter', 0.003));
    expect(currentValue(s, 'etf_ter')).toBe(0.003);
    s = apply(s, setAction('etf_name', 'ishares'));
    expect(currentValue(s, 'etf_ter')).toBe(0.002);
  });

  it('scaglioni e valori informativi sono testo', () => {
    expect(fieldKind(byId('irpef_brackets'))).toBe('text');
    expect(displayValue(byId('irpef_brackets'), currentValue(s0, 'irpef_brackets'))).toBe('23% fino a 28.000 € · 33% fino a 50.000 € · 43% oltre');
    expect(fieldKind(byId('fund_ter_reference'))).toBe('text');
    expect(displayValue(byId('fund_ter_reference'), currentValue(s0, 'fund_ter_reference'))).toBe('0,473');
  });
});

describe('profilo JSON', () => {
  const s0 = initialState(null);

  it('formato della SPEC: { version, name, values }', () => {
    const r = importProfile({ version: 1, name: 'x', values: { ral: 60000, exit_mode: 'Riscatto', growth: 0.03, nonesiste: 1, birth_year: 1800 } });
    expect(r.applied.sort()).toEqual(['exit_mode', 'growth', 'ral']);
    expect(r.rejected.sort()).toEqual(['birth_year', 'nonesiste']);
    const s = r.actions.reduce(reducer, s0);
    const p = toModelParams(s.inputs, s.overrides);
    expect([p.ral, p.exit_mode, p.growth]).toEqual([60000, 'Riscatto', 0.03]);
  });

  it('formato di reference/model.py, annidato sotto un’unica chiave e "defaults"', () => {
    const r = importProfile({ profilo: { defaults: { ral: 52000, irpef: [[28000, 0.23], [50000, 0.33], [null, 0.43]], annual_saving: 3000 } } });
    expect(r.applied.sort()).toEqual(['annual_saving', 'irpef_brackets', 'ral']);
    const s = r.actions.reduce(reducer, s0);
    expect(toModelParams(s.inputs, s.overrides).annual_saving).toBe(3000);
  });

  it('esporta e reimporta gli stessi valori', () => {
    let s = apply(s0, setAction('ral', 70000));
    s = apply(s, setAction('stamp_duty', 0.001));
    const back = importProfile(JSON.parse(exportProfile(s))).actions.reduce(reducer, s0);
    expect(toModelParams(back.inputs, back.overrides)).toEqual(toModelParams(s.inputs, s.overrides));
  });
});
