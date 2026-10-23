// @vitest-environment jsdom
// (in jsdom import.meta.url non è un file: i percorsi partono dalla radice del repository)
// SPEC par. 8 punto 3: import dei file d'esempio; par. 6.3: calcoli dal file (golden_fixture_ok.json).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import golden from '../../spec/tests/golden_fixture_ok.json';
import { azionario, etfMonthly } from '../../src/data';
import { parseDettaglio, parseItNumber, successMessage } from '../../src/import/dettaglio';
import { compareWithEtf, monthlySeries, prefillFromFile } from '../../src/model/contributions';

const fixture = (name: string) => readFileSync(resolve('spec/tests/fixtures', name), 'utf8');
const TODAY = '2026-10-23';
const near = (a: number, b: number, tol: number, label = '') =>
  expect(Math.abs(a - b), `${label}: ${a} invece di ${b}`).toBeLessThanOrEqual(tol);

describe('numeri all’italiana', () => {
  it.each([
    ['1.002,32', 1002.32],
    ['-36.504,71', -36504.71],
    ['-2.195,508', -2195.508],
    ['0,00', 0],
    ['375', 375],
  ])('%s', (s, v) => expect(parseItNumber(s)).toBe(v));
  it('cella vuota e testo', () => {
    expect(parseItNumber(' ')).toBeNull();
    expect(Number.isNaN(parseItNumber('abc'))).toBe(true);
  });
});

describe('sample_dettaglio_ok.xls', () => {
  const r = parseDettaglio(fixture('sample_dettaglio_ok.xls'), { today: TODAY });

  it('esito verde, 43 movimenti, la riga TOTALE non è un movimento', () => {
    expect(r.issues).toEqual([]);
    expect(r.status).toBe('ok');
    expect(r.reduced).toBe(false);
    expect(r.movements.length).toBe(golden.n_rows);
    expect(r.movements.some((m) => m.tipo === 'TOTALE')).toBe(false);
    expect(successMessage(r)).toBe('43 movimenti letti, dal 01/2023 al 07/2026, totali coerenti con il file');
  });

  it('posizione reale e stessi versamenti nell’ETF (golden_fixture_ok.json)', () => {
    const c = compareWithEtf(r.movements, azionario, etfMonthly)!;
    expect(c.issues).toEqual([]);
    expect(c.valuation.date).toBe(golden.valuation_date);
    expect(c.valuation.nav.AZIONARIO).toBe(golden.nav_end_used);
    near(c.realPosition, golden.real_position, 1e-9, 'posizione reale');
    near(c.etfInsideFund, golden.etf_inside_fund, 1e-6, 'ETF dentro il fondo');
    near(c.etfOutsideFundPreTax, golden.etf_outside_fund_pre_tax, 1e-6, 'ETF fuori, prima del 26%');
  });

  it('precompilazione del simulatore', () => {
    const c = compareWithEtf(r.movements, azionario, etfMonthly);
    expect(prefillFromFile(r.movements, c)).toEqual({
      first_join_year: 2023,
      min_member_month: 75,
      employer_month: 70,
      tfr_month: 230,
      current_position: c!.realPosition,
    });
  });

  it('serie mensili uguali a quelle del prototipo Versamenti', () => {
    const html = readFileSync(resolve('spec/design/v2/Versamenti.dc.html'), 'utf8');
    const D = JSON.parse(html.match(/this\.D = (\{.*?\});\n/s)![1]!);
    const cols = { acwi: 'acwi_eur', world: 'msci_world_eur', europe: 'msci_europe_eur' } as const;
    for (const [k, col] of Object.entries(cols)) {
      const s = monthlySeries(r.movements, azionario, etfMonthly, col)!;
      expect(s.months.map((m) => m.slice(0, 7))).toEqual(D.months);
      s.months.forEach((_m, i) => {
        near(s.etfInside[i]!, D.etf[k].in[i], 0.0051, `${k} dentro ${i}`);
        near(s.etfOutside[i]!, D.etf[k].out[i], 0.0051, `${k} fuori ${i}`);
        if (k === 'acwi') {
          near(s.real[i]!, D.real[i], 0.0051, `reale ${i}`);
          near(s.aderente[i]!, D.ad[i], 1e-9, `aderente ${i}`);
          near(s.azienda[i]!, D.az[i], 1e-9, `azienda ${i}`);
          near(s.tfr[i]!, D.tfr[i], 1e-9, `tfr ${i}`);
        }
      });
    }
  });
});

describe('sample_dettaglio_bad_columns.xls', () => {
  it('errore rosso: manca la colonna Numero Quote', () => {
    const r = parseDettaglio(fixture('sample_dettaglio_bad_columns.xls'), { today: TODAY });
    expect(r.status).toBe('error');
    expect(r.issues.filter((i) => i.severity === 'error').map((i) => i.message)).toEqual(['Manca la colonna Numero Quote.']);
    expect(r.movements).toEqual([]);
  });

  it('modalità ridotta (avviso) solo se mancano tutte e quattro le colonne delle quote', () => {
    let html = fixture('sample_dettaglio_ok.xls');
    // toglie le ultime quattro colonne (Comparto, Numero Quote, Valore Quota, Data Valore Quota) da ogni riga
    html = html.replace(/<tr>(.*?)<\/tr>/gs, (_m, inner: string) => {
      const cells = inner.match(/<t[hd][^>]*>.*?<\/t[hd]>/gs) ?? [];
      return `<tr>${(cells.length === 15 ? cells.slice(0, 11) : cells).join('')}</tr>`;
    });
    const r = parseDettaglio(html, { today: TODAY });
    expect(r.status).toBe('warning');
    expect(r.reduced).toBe(true);
    expect(r.issues.map((i) => i.code)).toEqual(['reduced_mode']);
    expect(r.movements.length).toBe(43);
  });
});

describe('sample_dettaglio_bad_totals.xls', () => {
  it('avviso giallo sul totale Aderente', () => {
    const r = parseDettaglio(fixture('sample_dettaglio_bad_totals.xls'), { today: TODAY });
    expect(r.status).toBe('warning');
    const totals = r.issues.filter((i) => i.code === 'total_mismatch');
    expect(totals.length).toBe(1);
    expect(totals[0]!.message).toMatch(/^Totale Importo Lordo Aderente/);
  });
});

describe('errori e avvisi', () => {
  it('nessuna tabella', () => {
    const r = parseDettaglio('<html><body><p>ciao</p></body></html>');
    expect(r.status).toBe('error');
    expect(r.issues[0]!.code).toBe('no_table');
  });

  it('tipi sconosciuti, concambi e date fuori periodo', () => {
    let html = fixture('sample_dettaglio_ok.xls');
    html = html.replace('<td>Contributo</td><td>28/08/2026</td>', '<td>Bonus misterioso</td><td>28/08/2026</td>');
    html = html.replace('<td>Contributo</td><td>28/07/2026</td>', '<td>Contributo</td><td>28/07/2031</td>');
    const r = parseDettaglio(html, { today: TODAY });
    const codes = r.issues.map((i) => i.code);
    expect(codes).toContain('unknown_type');
    expect(codes).toContain('date_out_of_range');
    expect(r.movements[0]!.kind).toBe('sconosciuto');
  });

  it('più del 5% di righe illeggibili blocca l’import', () => {
    let html = fixture('sample_dettaglio_ok.xls');
    let n = 0;
    html = html.replace(/<td>75,00<\/td>/g, (m) => (n++ < 3 ? '<td>sette</td>' : m));
    const r = parseDettaglio(html, { today: TODAY });
    expect(r.status).toBe('error');
    expect(r.issues.map((i) => i.code)).toContain('unreadable');
  });
});
