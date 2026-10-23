// SPEC par. 8 punto 10: ogni parametro ha source e source_kind, ogni anno del comparto Azionario ha evidence.
import { describe, expect, it } from 'vitest';
import { azionario, params } from '../../src/data';

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
