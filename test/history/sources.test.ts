// SPEC par. 8 punto 10: ogni parametro ha source e source_kind, ogni anno del comparto Azionario ha evidence.
import { describe, expect, it } from 'vitest';
import { azionario, params } from '../../src/data';
import { EXAMPLE_PARAMS } from '../../src/model';

describe('fonti dei dati', () => {
  it.each(params.parameters.map((p) => [p.id, p] as const))('parametro %s: source e source_kind', (_id, p) => {
    expect(p.source.trim().length).toBeGreaterThan(0);
    expect(Object.keys(params.source_kinds)).toContain(p.source_kind);
    expect(p.description.trim().length).toBeGreaterThan(0);
  });

  it.each(azionario.years.map((y) => [y.year, y] as const))('anno %s: evidence', (_y, y) => {
    expect(y.evidence).toBeTruthy();
    expect(y.evidence.file.trim().length).toBeGreaterThan(0);
    // dove manca la citazione, una nota spiega perché
    expect(Boolean(y.evidence.quote) || Boolean(y.evidence.note) || y.evidence.page !== null).toBe(true);
  });

  it('ogni id di parametro è unico', () => {
    const ids = params.parameters.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// SPEC par. 8 punto 7: ogni numero usato dal modello compare nella pagina "Parametri e fonti".

const MODEL_TO_PARAM: Record<string, string> = { irpef: 'irpef_brackets', regional: 'add_regional' };

describe('parametri del modello nel catalogo', () => {
  const ids = new Set(params.parameters.map((p) => p.id));
  it.each(Object.keys(EXAMPLE_PARAMS))('%s', (key) => {
    expect(ids.has(MODEL_TO_PARAM[key] ?? key)).toBe(true);
  });
  it('anche le percentuali della regola del contributo minimo', () => {
    expect(ids.has('member_min_rate_low') && ids.has('member_min_rate_high')).toBe(true);
  });
});
