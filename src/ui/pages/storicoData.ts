// Serie annue per la pagina Storico (SPEC par. 3.4 F e 5): fondo, benchmark, componenti ed ETF a confronto.
import { etfAnnualExtra } from '../../data';
import type { AnnualRow } from '../../model/history';
import { HISTORY } from '../results';

export type EtfKey = 'ishares' | 'vanguard' | 'spdrimi';

export const STORICO_ETFS: Record<EtfKey, { short: string; name: string; isin: string; source: string }> = {
  ishares: {
    short: 'iShares MSCI ACWI',
    name: 'iShares MSCI ACWI UCITS ETF Acc',
    isin: 'IE00B6R52259',
    source: 'Yahoo Finance, ISAC.L in dollari convertito in euro con EURUSD=X, prezzi di fine mese rettificati per i dividendi (etf_monthly.sources.json)',
  },
  vanguard: {
    short: 'Vanguard FTSE All-World',
    name: 'Vanguard FTSE All-World UCITS ETF',
    isin: 'IE00BK5BQT80 / IE00B3RBWM25',
    source: `${etfAnnualExtra.source}; ticker VGWL.DE, classe a distribuzione IE00B3RBWM25`,
  },
  spdrimi: {
    short: 'SPDR MSCI ACWI IMI',
    name: 'SPDR MSCI ACWI IMI UCITS ETF',
    isin: 'IE00B3YLTY66',
    source: `${etfAnnualExtra.source}; ticker SPYI.DE, quotazione Xetra non affidabile prima del 2017`,
  },
};

export const ROWS: AnnualRow[] = HISTORY.rows;
export const YEARS = ROWS.map((r) => r.year);

/** Rendimenti annui dell'ETF allineati agli anni dello storico (null se non disponibili). */
export function etfReturns(k: EtfKey): (number | null)[] {
  if (k === 'ishares') return ROWS.map((r) => r.acwi_eur);
  const extra = k === 'vanguard' ? etfAnnualExtra.vanguard_ftse_all_world : etfAnnualExtra.spdr_msci_acwi_imi;
  return YEARS.map((y) => {
    const i = etfAnnualExtra.years.indexOf(y);
    return i < 0 ? null : (extra[i] as number | null);
  });
}

/** Media annua composta su un intervallo di indici; NaN se manca un valore. */
export function cagrOf(values: (number | null)[], i0: number, i1: number): number {
  let acc = 1;
  for (let i = i0; i <= i1; i++) {
    const v = values[i];
    if (v === null || v === undefined) return Number.NaN;
    acc *= 1 + v;
  }
  return acc ** (1 / (i1 - i0 + 1)) - 1;
}

/** Indice "100 all'inizio": valore all'inizio e a fine di ogni anno da i0 a i1. */
export function indexFrom(values: (number | null)[], i0: number, i1: number): number[] {
  const out = [100];
  for (let i = i0; i <= i1; i++) out.push(out[out.length - 1]! * (1 + (values[i] ?? 0)));
  return out;
}

export const WINDOWS = (() => {
  const last = HISTORY.last;
  return [
    { id: 'w12', label: `2012–${last}`, from: 2012, to: last },
    { id: 'w14', label: `2014–${last}`, from: 2014, to: last },
    { id: 'w10', label: 'Ultimi 10 anni', from: last - 9, to: last },
    { id: 'w5', label: 'Ultimi 5 anni', from: last - 4, to: last },
  ];
})();
