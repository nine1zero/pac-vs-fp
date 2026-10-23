// Prezzi di fine mese (public/data/etf_monthly.csv, fonte in etf_monthly.sources.json).

export type PriceColumn = 'acwi_eur' | 'msci_world_eur' | 'msci_europe_eur' | 'estr_eur';

export interface PriceTable {
  /** fine mese ISO (aaaa-mm-gg) → prezzi */
  byMonthEnd: Map<string, Record<PriceColumn, number>>;
  first: string;
  last: string;
}

const COLUMNS: PriceColumn[] = ['acwi_eur', 'msci_world_eur', 'msci_europe_eur', 'estr_eur'];

export function parsePriceCsv(text: string): PriceTable {
  const lines = text.trim().split(/\r?\n/);
  const head = lines[0]!.split(',');
  const idx = (c: string) => {
    const i = head.indexOf(c);
    if (i < 0) throw new Error(`etf_monthly.csv: manca la colonna ${c}`);
    return i;
  };
  const iMonth = idx('month_end');
  const iCols = COLUMNS.map(idx);
  const byMonthEnd = new Map<string, Record<PriceColumn, number>>();
  for (const line of lines.slice(1)) {
    const cells = line.split(',');
    const row = {} as Record<PriceColumn, number>;
    COLUMNS.forEach((c, j) => (row[c] = Number(cells[iCols[j]!])));
    byMonthEnd.set(cells[iMonth]!, row);
  }
  const keys = [...byMonthEnd.keys()].sort();
  return { byMonthEnd, first: keys[0]!, last: keys[keys.length - 1]! };
}

/** Prezzo a una data di fine mese; undefined se manca. */
export function priceAt(t: PriceTable, monthEnd: string, col: PriceColumn = 'acwi_eur'): number | undefined {
  return t.byMonthEnd.get(monthEnd)?.[col];
}
