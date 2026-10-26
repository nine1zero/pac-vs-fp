// Stato dell'app: localStorage solo su azione esplicita (SPEC par. 1.1), dati del file mai salvati.
import { describe, expect, it } from 'vitest';
import { EXAMPLE_PARAMS } from '../../src/model';
import {
  DEFAULT_INPUTS,
  STORAGE_KEY,
  forget,
  initialState,
  isDirty,
  needsAutosave,
  persist,
  reducer,
  toModelParams,
  type State,
} from '../../src/state/store';
import { computeResults } from '../../src/ui/results';
import golden from '../../spec/tests/golden_model_example.json';

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    m,
  };
}

describe('profilo d’esempio', () => {
  it('i valori iniziali danno i parametri del modello di riferimento', () => {
    expect(toModelParams(DEFAULT_INPUTS)).toEqual(EXAMPLE_PARAMS);
  });

  it('i risultati della Landing coincidono con i golden', () => {
    const r = computeResults(toModelParams(DEFAULT_INPUTS));
    r.res.forEach((x, s) => expect(Math.abs(x.total_net - golden.pensione_delta_default[s]!)).toBeLessThanOrEqual(0.01));
    expect(r.rank[0]).toBe(0);
    expect(r.breakevens.map((b) => b.value)).toEqual([
      expect.closeTo(golden.breakeven_pensione_full['2vs1'], 6),
      expect.closeTo(golden.breakeven_pensione_full['2vs3'], 6),
      expect.closeTo(golden.breakeven_pensione_full['1vs3'], 6),
    ]);
    expect(Math.abs(r.effectiveRate - golden.effective_rate_first_year_max_deduction)).toBeLessThan(5e-7);
  });

  it('il TER segue l’ETF scelto', () => {
    expect(toModelParams({ ...DEFAULT_INPUTS, etf_id: 'ishares' }).etf_ter).toBe(0.002);
    expect(toModelParams({ ...DEFAULT_INPUTS, etf_id: 'spdrimi' }).etf_ter).toBe(0.0017);
  });
});

describe('reducer', () => {
  const s0 = initialState(null);

  it('senza dati salvati si apre sulle avvertenze', () => {
    expect(s0.open).toBe(0);
    expect(s0.savedAt).toBeNull();
  });

  it('conferma una sezione: passa alla successiva e segna i dati come tuoi', () => {
    const s = reducer(s0, { type: 'confirm', section: 1, mine: 'eta' });
    expect(s.open).toBe(2);
    expect(s.done).toEqual([1]);
    expect(s.mine).toEqual({ eta: true });
  });

  it('l’uscita resta almeno nel primo anno simulato', () => {
    const s = reducer(s0, { type: 'set', inputs: { birth_year: 1960, exit_age: 60 } });
    expect(s.inputs.birth_year + s.inputs.exit_age).toBe(EXAMPLE_PARAMS.start_year);
  });

  it('importo fisso: senza valore scelto usa la deduzione massima del primo anno', () => {
    const p = toModelParams({ ...DEFAULT_INPUTS, saving_mode: 'fix', saving: null });
    expect(p.annual_saving).toBe(4390);
  });
});

describe('salvataggio automatico', () => {
  it('nulla da salvare sul profilo d’esempio appena aperto', () => {
    expect(needsAutosave(initialState(null))).toBe(false);
  });
  it('si salva dalla prima modifica; dopo il salvataggio non c’è altro da salvare', () => {
    let s = reducer(initialState(null), { type: 'set', inputs: { ral: 52000 } });
    expect(needsAutosave(s)).toBe(true);
    s = reducer(s, { type: 'save', at: '2026-10-26T10:00:00Z' });
    expect(needsAutosave(s)).toBe(false);
    // tornare ai valori d'esempio dopo un salvataggio va salvato anch'esso
    s = reducer(s, { type: 'set', inputs: { ral: 45000 } });
    expect(needsAutosave(s)).toBe(true);
  });
  it('anche aprire una sezione o confermarla si salva; "Cancella tutto" torna a non salvare', () => {
    const s = reducer(initialState(null), { type: 'confirm', section: 0 });
    expect(needsAutosave(s)).toBe(true);
    expect(needsAutosave(reducer(s, { type: 'reset' }))).toBe(false);
  });
});

describe('salvataggio', () => {
  it('nulla in localStorage finché non si salva; il file non si salva mai', () => {
    const st = memoryStorage();
    let s: State = initialState(st);
    expect(st.m.size).toBe(0);
    s = reducer(s, { type: 'set', inputs: { ral: 60000 } });
    s = { ...s, file: { name: 'x.xls', result: { status: 'ok', issues: [], columns: [], reduced: false, movements: [], fileTotals: null, period: null }, comparison: null } };
    expect(isDirty(s)).toBe(true);
    expect(persist(s, '2026-10-23T10:00:00Z', st)).toBe(true);
    s = reducer(s, { type: 'save', at: '2026-10-23T10:00:00Z' });
    expect(isDirty(s)).toBe(false);
    const raw = st.getItem(STORAGE_KEY)!;
    expect(raw).not.toContain('x.xls');
    expect(JSON.parse(raw).data.inputs.ral).toBe(60000);

    const reopened = initialState(st);
    expect(reopened.inputs.ral).toBe(60000);
    expect(reopened.open).toBe(-1);
    expect(reopened.file).toBeNull();
    expect(isDirty(reopened)).toBe(false);

    forget(st);
    expect(st.m.size).toBe(0);
    expect(reducer(reopened, { type: 'reset' }).inputs).toEqual(DEFAULT_INPUTS);
  });

  it('dati salvati illeggibili: si riparte dall’esempio', () => {
    const st = memoryStorage();
    st.setItem(STORAGE_KEY, '{non json');
    expect(initialState(st).inputs).toEqual(DEFAULT_INPUTS);
  });
});
