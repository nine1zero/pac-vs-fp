// Calcoli dal file contribuzioni (SPEC par. 6.3; docs/FORMULE.md par. 10; reference/history.py counterfactual).
import type { Azionario } from '../data';
import { priceAt, type PriceColumn, type PriceTable } from '../data/prices';
import type { Issue, Movement } from '../import/dettaglio';
import { monthEnd, monthEndsBetween, yearOf } from './dates';

/** Tipi che entrano nel confronto con l'ETF (i concambi sono fusioni di comparti, esclusi). */
const COMPARED = new Set(['versamento', 'volontario', 'anticipazione']);

export interface Valuation {
  /** fine del mese di valutazione (ISO) */
  date: string;
  /** valore quota per comparto usato per la posizione reale */
  nav: Record<string, number>;
}

/** Data e valore quota dell'ultimo movimento del file, per comparto (SPEC par. 6.3). */
export function defaultValuation(movements: Movement[]): Valuation | null {
  const nav: Record<string, number> = {};
  const navDate: Record<string, string> = {};
  let last: string | null = null;
  for (const m of movements) {
    if (!m.dataValore || m.valoreQuota === null) continue;
    // a parità di data vale il primo nel file (il file è in ordine decrescente)
    if (navDate[m.comparto] === undefined || m.dataValore > navDate[m.comparto]!) {
      navDate[m.comparto] = m.dataValore;
      nav[m.comparto] = m.valoreQuota;
    }
    if (last === null || m.dataValore > last) last = m.dataValore;
  }
  return last === null ? null : { date: monthEnd(last), nav };
}

function taxByYear(az: Azionario): Map<number, number> {
  return new Map(az.years.map((y) => [y.year, y.fund_tax_rate]));
}

/** Valore alla data V di un versamento fatto alla data d, "dentro il fondo": il rendimento dell'ETF è tassato
 * ogni anno con l'aliquota del fondo. undefined se manca un prezzo o un'aliquota. */
function insideFactor(prices: PriceTable, tax: Map<number, number>, d: string, V: string, col: PriceColumn): number | undefined {
  const p0 = priceAt(prices, monthEnd(d), col);
  const y = yearOf(d);
  const vy = yearOf(V);
  const ty = tax.get(y);
  if (p0 === undefined || ty === undefined) return undefined;
  const firstEnd = y === vy ? V : `${y}-12-31`;
  const p1 = priceAt(prices, firstEnd, col);
  if (p1 === undefined) return undefined;
  let f = 1 + (p1 / p0 - 1) * (1 - ty);
  for (let j = y + 1; j <= vy; j++) {
    const tj = tax.get(j);
    const a = priceAt(prices, `${j - 1}-12-31`, col);
    const b = priceAt(prices, j === vy ? V : `${j}-12-31`, col);
    if (tj === undefined || a === undefined || b === undefined) return undefined;
    f *= 1 + (b / a - 1) * (1 - tj);
  }
  return f;
}

export interface Comparison {
  valuation: Valuation;
  /** Σ quote × valore quota per comparto + Σ "Contr. non investito" */
  realPosition: number;
  /** stessi versamenti nell'ETF, con l'imposta annua del fondo */
  etfInsideFund: number;
  /** stessi versamenti nell'ETF fuori dal fondo, prima del 26% */
  etfOutsideFundPreTax: number;
  /** liquidità in attesa, aggiunta a entrambi i lati */
  pending: number;
  issues: Issue[];
}

const dateOf = (m: Movement) => m.dataValore ?? m.dataOperazione ?? m.competenza;

/** Posizione reale e stessi versamenti nell'ETF alla data di valutazione. */
export function compareWithEtf(
  movements: Movement[],
  az: Azionario,
  prices: PriceTable,
  col: PriceColumn = 'acwi_eur',
  valuation: Valuation | null = defaultValuation(movements),
): Comparison | null {
  if (!valuation) return null;
  const V = valuation.date;
  const tax = taxByYear(az);
  const issues: Issue[] = [];
  const pending = movements.filter((m) => m.kind === 'non_investito').reduce((a, m) => a + m.netto, 0);
  const quotes: Record<string, number> = {};
  for (const m of movements) if (m.quote !== null) quotes[m.comparto] = (quotes[m.comparto] ?? 0) + m.quote;
  const real = Object.entries(quotes).reduce((a, [c, q]) => a + q * (valuation.nav[c] ?? 0), 0);

  const pV = priceAt(prices, V, col);
  let inside = 0;
  let outside = 0;
  const missing: number[] = [];
  for (const m of movements) {
    if (!COMPARED.has(m.kind)) continue;
    const d = m.dataValore;
    const f = d ? insideFactor(prices, tax, d, V, col) : undefined;
    const p0 = d ? priceAt(prices, monthEnd(d), col) : undefined;
    if (f === undefined || p0 === undefined || pV === undefined) {
      missing.push(m.index);
      continue;
    }
    inside += m.netto * f;
    outside += (m.netto * pV) / p0;
  }
  if (missing.length) {
    issues.push({
      severity: 'warning',
      code: 'price_missing',
      message: `Prezzo dell’ETF non disponibile per ${missing.length} movimenti (prima del 12/2011 o oltre l’ultimo mese dei dati): esclusi dal confronto.`,
      rows: missing,
    });
  }
  return {
    valuation,
    realPosition: real + pending,
    etfInsideFund: inside + pending,
    etfOutsideFundPreTax: outside + pending,
    pending,
    issues,
  };
}

export interface MonthlySeries {
  months: string[];
  /** cumulati per fonte */
  aderente: number[];
  azienda: number[];
  tfr: number[];
  /** quote cumulate × valore quota dell'ultimo movimento noto alla data */
  real: number[];
  etfInside: number[];
  etfOutside: number[];
}

/** Serie a fine mese, dal primo movimento alla data di valutazione (grafico della pagina "I miei versamenti"). */
export function monthlySeries(
  movements: Movement[],
  az: Azionario,
  prices: PriceTable,
  col: PriceColumn = 'acwi_eur',
  valuation: Valuation | null = defaultValuation(movements),
): MonthlySeries | null {
  if (!valuation) return null;
  const dated = movements.filter((m) => dateOf(m) !== null);
  const first = dated.map((m) => dateOf(m)!).sort()[0];
  if (!first) return null;
  const tax = taxByYear(az);
  const months = monthEndsBetween(first, valuation.date);
  const out: MonthlySeries = { months, aderente: [], azienda: [], tfr: [], real: [], etfInside: [], etfOutside: [] };
  for (const V of months) {
    const upto = dated.filter((m) => dateOf(m)! <= V);
    const included = upto.filter((m) => COMPARED.has(m.kind));
    const sum = (k: 'aderente' | 'azienda' | 'tfr') => included.reduce((a, m) => a + m[k], 0);
    out.aderente.push(sum('aderente'));
    out.azienda.push(sum('azienda'));
    out.tfr.push(sum('tfr'));
    const pending = upto.filter((m) => m.kind === 'non_investito').reduce((a, m) => a + m.netto, 0);
    const nav = defaultValuation(upto)?.nav ?? {};
    const quotes: Record<string, number> = {};
    for (const m of upto) if (m.quote !== null) quotes[m.comparto] = (quotes[m.comparto] ?? 0) + m.quote;
    out.real.push(Object.entries(quotes).reduce((a, [c, q]) => a + q * (nav[c] ?? 0), 0) + pending);
    const pV = priceAt(prices, V, col);
    let inside = 0;
    let outside = 0;
    for (const m of included) {
      const d = m.dataValore;
      const f = d ? insideFactor(prices, tax, d, V, col) : undefined;
      const p0 = d ? priceAt(prices, monthEnd(d), col) : undefined;
      if (f === undefined || p0 === undefined || pV === undefined) continue;
      inside += m.netto * f;
      outside += (m.netto * pV) / p0;
    }
    out.etfInside.push(inside + pending);
    out.etfOutside.push(outside + pending);
  }
  return out;
}

export interface Prefill {
  first_join_year: number | null;
  min_member_month: number | null;
  employer_month: number | null;
  tfr_month: number | null;
  current_position: number | null;
}

/** Precompilazione del simulatore dal file (SPEC par. 6.3). */
export function prefillFromFile(movements: Movement[], comparison: Comparison | null): Prefill {
  const comp = movements.map((m) => m.competenza).filter((d): d is string => d !== null).sort();
  // ultima riga "Contributo" di un mese non di dicembre (a dicembre il versamento è doppio)
  const last = movements
    .filter((m) => m.kind === 'versamento' && m.competenza !== null && m.competenza.slice(5, 7) !== '12')
    .sort((a, b) => (a.competenza! < b.competenza! ? 1 : a.competenza! > b.competenza! ? -1 : a.index - b.index))[0];
  return {
    first_join_year: comp.length ? yearOf(comp[0]!) : null,
    min_member_month: last?.aderente ?? null,
    employer_month: last?.azienda ?? null,
    tfr_month: last?.tfr ?? null,
    current_position: comparison?.realPosition ?? null,
  };
}
