// ETF del PAC e fonti dei parametri, per i tooltip (SPEC par. 3.6).
import catalogJson from '../../public/data/etf_catalog.json';
import type { SourceKind } from '../ui/Tip';
import { azionario, params } from './index';

export interface EtfReturns {
  y5: number | null;
  y10: number | null;
  since_launch: number | null;
  launch: string;
  as_of: string;
  y10_source?: string;
}

export interface Etf {
  id: string;
  name: string;
  short: string;
  isin: string;
  ter: number;
  index: string;
  companies: string;
  coverage: string;
  coverage_source: string;
  holdings: number;
  aum_eur_bn: number;
  history: string;
  returns: EtfReturns;
}

export const etfCatalog = catalogJson as unknown as {
  description: string;
  default: string;
  sources: Record<string, string>;
  etfs: Etf[];
};

export function etfById(id: string): Etf {
  return etfCatalog.etfs.find((e) => e.id === id) ?? etfCatalog.etfs.find((e) => e.id === etfCatalog.default)!;
}

const KIND: Record<string, SourceKind> = Object.fromEntries(
  Object.entries(params.source_kinds).map(([k, v]) => [k, v as SourceKind]),
);

/** Tipo di fonte e testo della fonte di un parametro di public/data/params.json. */
export function paramSource(id: string): { kind: SourceKind; source: string; label: string } {
  const p = params.parameters.find((x) => x.id === id);
  if (!p) throw new Error(`Parametro senza fonte: ${id}`);
  return { kind: KIND[p.source_kind] ?? 'Ipotesi', source: p.source, label: p.label };
}

/** Fonte del comparto per un intervallo di anni (rendimenti pubblicati, docs/FONTI.md par. 1). */
export const FUND_SOURCE =
  'Rendimenti netti pubblicati dal fondo (bilanci 2012-2017, pagina web "Comparto Azionario" e Nota informativa 2026 Tav. 4 per il 2018-2025); file e pagina per anno in docs/FONTI.md par. 1. Prezzi ETF: Yahoo Finance, fine mese (etf_monthly.sources.json).';

export const TAX_RATE_SOURCE = azionario.tax_rate_source;
